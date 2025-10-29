import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { preferenceAnalysisService } from '@/lib/services/preference-analysis.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const timeHorizon = searchParams.get('timeHorizon') || '30d';
    const refresh = searchParams.get('refresh') === 'true';

    // Get cached chain preferences
    let chainPreferences = await db.chainPreference.findMany({
      where: { userId },
      orderBy: { preferenceScore: 'desc' }
    });

    // If no preferences exist or refresh is requested, analyze from behavior
    if (chainPreferences.length === 0 || refresh) {
      const analyzedPreferences = await preferenceAnalysisService.analyzeChainPreferences(userId, timeHorizon);
      
      // Update database with new preferences
      for (const pref of analyzedPreferences) {
        await db.chainPreference.upsert({
          where: {
            userId_chainId: {
              userId,
              chainId: pref.chainId
            }
          },
          update: {
            preferenceScore: pref.preferenceScore,
            usageFrequency: pref.interactionCount,
            successRate: pref.successRate,
            avgGasCost: pref.avgGasSpent,
            lastUsedAt: pref.lastInteraction,
            updatedAt: new Date()
          },
          create: {
            userId,
            chainId: pref.chainId,
            chainName: pref.chainName,
            preferenceScore: pref.preferenceScore,
            usageFrequency: pref.interactionCount,
            successRate: pref.successRate,
            avgGasCost: pref.avgGasSpent,
            lastUsedAt: pref.lastInteraction
          }
        });
      }

      // Get updated preferences
      chainPreferences = await db.chainPreference.findMany({
        where: { userId },
        orderBy: { preferenceScore: 'desc' }
      });

      return NextResponse.json({
        success: true,
        chainPreferences,
        analyzed: true,
        timeHorizon
      });
    }

    return NextResponse.json({
      success: true,
      chainPreferences,
      cached: true
    });

  } catch (error) {
    console.error('Error fetching chain preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chain preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { chainId, action, data } = body;

    switch (action) {
      case 'manual_interaction':
        // Record a manual chain interaction
        await recordChainInteraction(userId, chainId, data);
        break;
      case 'update_preference':
        // Manually update chain preference
        await updateChainPreference(userId, chainId, data);
        break;
      case 'get_recommendations':
        // Get chain recommendations based on preferences
        const recommendations = await getChainRecommendations(userId);
        return NextResponse.json({
          success: true,
          recommendations
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Chain preference updated successfully'
    });

  } catch (error) {
    console.error('Error updating chain preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update chain preferences' },
      { status: 500 }
    );
  }
}

async function recordChainInteraction(userId: string, chainId: string, data: any) {
  try {
    // Update or create chain preference record
    const existingPref = await db.chainPreference.findUnique({
      where: {
        userId_chainId: { userId, chainId }
      }
    });

    const newUsageFrequency = (existingPref?.usageFrequency || 0) + 1;
    const totalGasSpent = (existingPref?.totalGasSpent || 0) + (data.gasSpent || 0);
    const newAvgGasCost = totalGasSpent / newUsageFrequency;

    await db.chainPreference.upsert({
      where: {
        userId_chainId: { userId, chainId }
      },
      update: {
        usageFrequency: newUsageFrequency,
        totalGasSpent,
        avgGasCost: newAvgGasCost,
        lastUsedAt: new Date(),
        successRate: data.success ? 
          ((existingPref?.successRate || 0) * existingPref.usageFrequency + (data.success ? 100 : 0)) / newUsageFrequency :
          existingPref?.successRate || 0,
        updatedAt: new Date()
      },
      create: {
        userId,
        chainId,
        chainName: data.chainName || `Chain ${chainId}`,
        usageFrequency: 1,
        totalGasSpent: data.gasSpent || 0,
        avgGasCost: data.gasSpent || 0,
        successRate: data.success ? 100 : 0,
        lastUsedAt: new Date()
      }
    });

    // Track behavior event
    await db.userBehaviorEvent.create({
      data: {
        userId,
        eventType: 'chain_interaction',
        eventName: 'manual_chain_usage',
        eventData: {
          chainId,
          interactionType: data.interactionType,
          gasSpent: data.gasSpent,
          success: data.success
        },
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error recording chain interaction:', error);
    throw error;
  }
}

async function updateChainPreference(userId: string, chainId: string, data: any) {
  try {
    await db.chainPreference.upsert({
      where: {
        userId_chainId: { userId, chainId }
      },
      update: {
        preferenceScore: data.preferenceScore,
        preferenceFactors: data.factors || {},
        updatedAt: new Date()
      },
      create: {
        userId,
        chainId,
        chainName: data.chainName || `Chain ${chainId}`,
        preferenceScore: data.preferenceScore,
        preferenceFactors: data.factors || {}
      }
    });

    // Track preference evolution
    await db.preferenceEvolution.create({
      data: {
        userId,
        category: 'chain',
        oldValue: { preferenceScore: data.oldScore },
        newValue: { preferenceScore: data.preferenceScore },
        changeReason: 'user_manual_update',
        changeTrigger: 'preference_api'
      }
    });

  } catch (error) {
    console.error('Error updating chain preference:', error);
    throw error;
  }
}

async function getChainRecommendations(userId: string) {
  try {
    // Get user's current chain preferences
    const currentPreferences = await db.chainPreference.findMany({
      where: { userId },
      orderBy: { preferenceScore: 'desc' }
    });

    // Get user's risk profile
    const riskProfile = await db.riskProfile.findUnique({
      where: { userId }
    });

    // Get user behavior patterns
    const behaviorEvents = await db.userBehaviorEvent.findMany({
      where: {
        userId,
        eventType: 'chain_interaction',
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      take: 100
    });

    // Analyze and generate recommendations
    const recommendations = [];
    
    // Recommend chains based on user's current preferences
    const highScoreChains = currentPreferences.filter(p => p.preferenceScore > 70);
    if (highScoreChains.length > 0) {
      recommendations.push({
        type: 'continue_exploring',
        chains: highScoreChains.slice(0, 3),
        reason: 'You have strong preferences for these chains'
      });
    }

    // Recommend similar chains
    if (currentPreferences.length > 0) {
      const topChain = currentPreferences[0];
      const similarChains = getSimilarChains(topChain.chainId);
      if (similarChains.length > 0) {
        recommendations.push({
          type: 'similar_chains',
          chains: similarChains.slice(0, 2),
          reason: `Similar to your favorite chain ${topChain.chainName}`
        });
      }
    }

    // Recommend new chains based on risk tolerance
    if (riskProfile) {
      const riskAppropriateChains = getRiskAppropriateChains(riskProfile.riskToleranceScore);
      recommendations.push({
        type: 'risk_aligned',
        chains: riskAppropriateChains.slice(0, 2),
        reason: 'Aligned with your risk tolerance'
      });
    }

    return recommendations;

  } catch (error) {
    console.error('Error generating chain recommendations:', error);
    return [];
  }
}

function getSimilarChains(chainId: string): Array<{chainId: string, chainName: string, reason: string}> {
  const similarityMap: Record<string, string[]> = {
    '1': ['42161', '10', '137'], // Ethereum -> L2s and compatible chains
    '42161': ['1', '10', '137'], // Arbitrum -> Ethereum and other L2s
    '10': ['1', '42161', '137'], // Optimism -> Ethereum and other L2s
    '137': ['1', '56', '250'], // Polygon -> Ethereum and EVM compatible
    '56': ['137', '250', '128'], // BSC -> Other EVM compatible
    '43114': ['1', '137', '56'] // Avalanche -> Ethereum and EVM compatible
  };

  const similarChainIds = similarityMap[chainId] || [];
  const chainNames: Record<string, string> = {
    '1': 'Ethereum',
    '42161': 'Arbitrum',
    '10': 'Optimism',
    '137': 'Polygon',
    '56': 'BSC',
    '250': 'Fantom',
    '43114': 'Avalanche',
    '128': 'Huobi ECO'
  };

  return similarChainIds.map(id => ({
    chainId: id,
    chainName: chainNames[id] || `Chain ${id}`,
    reason: 'Similar technology and ecosystem'
  }));
}

function getRiskAppropriateChains(riskScore: number): Array<{chainId: string, chainName: string, reason: string}> {
  const chains = [
    { chainId: '1', chainName: 'Ethereum', riskLevel: 20 },
    { chainId: '42161', chainName: 'Arbitrum', riskLevel: 35 },
    { chainId: '10', chainName: 'Optimism', riskLevel: 35 },
    { chainId: '137', chainName: 'Polygon', riskLevel: 40 },
    { chainId: '56', chainName: 'BSC', riskLevel: 50 },
    { chainId: '250', chainName: 'Fantom', riskLevel: 60 },
    { chainId: '43114', chainName: 'Avalanche', riskLevel: 55 }
  ];

  return chains
    .filter(chain => chain.riskLevel <= riskScore + 20) // Allow some flexibility
    .map(chain => ({
      ...chain,
      reason: `Risk level ${chain.riskLevel} matches your profile`
    }));
}