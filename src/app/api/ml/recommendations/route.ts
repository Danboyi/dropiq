import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mlInfrastructure } from '@/lib/ml/infrastructure';
import { onChainAnalyzer } from '@/lib/ml/onchain-analyzer';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's wallet address
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { walletAddress: true }
    });

    if (!user?.walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required for on-chain analysis' },
        { status: 400 }
      );
    }

    // Analyze on-chain history
    const onChainData = await onChainAnalyzer.analyzeOnChainHistory(
      session.user.id,
      user.walletAddress
    );

    // Generate enhanced recommendations based on on-chain data
    const enhancedRecommendations = await onChainAnalyzer.generateEnhancedRecommendations(
      session.user.id,
      onChainData
    );

    // Generate traditional ML recommendations as fallback
    const userFeatures = await mlInfrastructure.generateUserFeatureVector(session.user.id);
    const mlPrediction = await mlInfrastructure.makePrediction(
      session.user.id,
      'airdrop_recommendation',
      userFeatures
    );

    // Merge and prioritize recommendations
    const finalRecommendations = mergeRecommendations(
      enhancedRecommendations,
      mlPrediction,
      onChainData
    );

    return NextResponse.json({
      success: true,
      recommendations: finalRecommendations.recommendations,
      secondaryRecommendations: finalRecommendations.secondaryRecommendations,
      exploratoryRecommendations: finalRecommendations.exploratoryRecommendations,
      insights: finalRecommendations.insights,
      onChainAnalysis: onChainData,
      confidence: finalRecommendations.confidence,
      mlConfidence: mlPrediction.confidence || 0.5,
      onChainConfidence: enhancedRecommendations.confidence,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Enhanced recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function mergeRecommendations(
  enhanced: any,
  mlPrediction: any,
  onChainData: any
): any {
  // If we have strong on-chain data, prioritize it
  if (onChainData.totalTransactions > 10 && onChainData.defiScore > 40) {
    return {
      ...enhanced,
      insights: [
        ...enhanced.insights,
        ...generateMLInsights(mlPrediction),
      ],
      confidence: Math.max(enhanced.confidence, mlPrediction.confidence || 0.5),
    };
  }

  // Otherwise, blend both approaches
  return {
    recommendations: enhanced.recommendations.slice(0, 8),
    secondaryRecommendations: [
      ...enhanced.secondaryRecommendations.slice(0, 5),
      // Add ML-based recommendations if available
      ...(mlPrediction.recommendations || []).slice(0, 3),
    ],
    exploratoryRecommendations: enhanced.exploratoryRecommendations.slice(0, 5),
    insights: [
      ...enhanced.insights,
      ...generateMLInsights(mlPrediction),
    ],
    confidence: (enhanced.confidence + (mlPrediction.confidence || 0.5)) / 2,
  };
}

function generateMLInsights(mlPrediction: any): string[] {
  const insights = [];
  
  if (mlPrediction.recommendations && mlPrediction.recommendations.length > 0) {
    const topCategory = mlPrediction.recommendations[0];
    if (topCategory.confidence > 0.7) {
      insights.push(`AI strongly recommends ${topCategory.category} airdrops based on your behavior patterns`);
    }
  }

  if (mlPrediction.confidence && mlPrediction.confidence > 0.8) {
    insights.push("High confidence in your personalized recommendations");
  } else if (mlPrediction.confidence && mlPrediction.confidence < 0.5) {
    insights.push("Continue using the platform to improve recommendation accuracy");
  }

  return insights;
}