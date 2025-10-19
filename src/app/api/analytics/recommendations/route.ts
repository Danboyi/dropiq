import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Get personalized recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check privacy settings
    const privacySettings = await db.dataPrivacySettings.findUnique({
      where: { userId }
    });

    if (privacySettings && !privacySettings.personalization) {
      return NextResponse.json(
        { error: 'Personalization disabled by user' },
        { status: 403 }
      );
    }

    // Get user preferences and behavior
    const userProfile = await getUserProfile(userId);
    
    // Generate recommendations
    const recommendations = await generateRecommendations(userProfile, type, limit);

    // Store recommendations in database
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const saved = await db.personalizedRecommendation.upsert({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: rec.targetId || '',
            targetType: rec.targetType || ''
          }
        },
        update: {
          score: rec.score,
          reason: rec.reason,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          status: 'pending'
        },
        create: {
          userId,
          recommendationType: rec.type,
          targetId: rec.targetId,
          targetType: rec.targetType,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          score: rec.score,
          reason: rec.reason,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      savedRecommendations.push(saved);
    }

    return NextResponse.json({
      recommendations: savedRecommendations,
      userProfile: {
        interests: userProfile.interests,
        riskTolerance: userProfile.riskTolerance,
        preferredCategories: userProfile.preferredCategories
      }
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

// Update recommendation status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendationId, action, userId } = body;

    if (!recommendationId || !action || !userId) {
      return NextResponse.json(
        { error: 'recommendationId, action, and userId are required' },
        { status: 400 }
      );
    }

    // Verify user owns this recommendation
    const recommendation = await db.personalizedRecommendation.findFirst({
      where: {
        id: recommendationId,
        userId
      }
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Update recommendation status
    const updateData: any = {};
    const now = new Date();

    switch (action) {
      case 'view':
        updateData.status = 'viewed';
        updateData.viewedAt = now;
        break;
      case 'accept':
        updateData.status = 'accepted';
        updateData.acceptedAt = now;
        break;
      case 'reject':
        updateData.status = 'rejected';
        updateData.rejectedAt = now;
        break;
      case 'dismiss':
        updateData.status = 'dismissed';
        updateData.dismissedAt = now;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updated = await db.personalizedRecommendation.update({
      where: { id: recommendationId },
      data: updateData
    });

    // Learn from user feedback
    await learnFromFeedback(userId, recommendation, action);

    return NextResponse.json({
      success: true,
      recommendation: updated
    });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}

// Get user profile for personalization
async function getUserProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  const preferences = await db.userPreferences.findUnique({
    where: { userId }
  });

  const behavior = await db.userBehavior.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  const portfolio = await db.userPortfolio.findUnique({
    where: { userId }
  });

  // Analyze behavior patterns
  const behaviorAnalysis = analyzeBehaviorPatterns(behavior);

  return {
    user,
    preferences: preferences || {
      interests: [],
      riskTolerance: 'medium',
      preferredCategories: [],
      behaviorProfile: {}
    },
    behavior: behaviorAnalysis,
    portfolio
  };
}

// Analyze user behavior patterns
function analyzeBehaviorPatterns(behavior: any[]) {
  const analysis = {
    totalEvents: behavior.length,
    eventTypes: {} as Record<string, number>,
    categories: {} as Record<string, number>,
    timePatterns: {} as Record<string, number>,
    engagementLevel: 0,
    preferredContentTypes: [] as string[],
    activityFrequency: 'low' as 'low' | 'medium' | 'high'
  };

  // Count event types
  behavior.forEach(b => {
    analysis.eventTypes[b.eventType] = (analysis.eventTypes[b.eventType] || 0) + 1;
    
    // Extract category from event data if available
    if (b.eventData?.category) {
      analysis.categories[b.eventData.category] = (analysis.categories[b.eventData.category] || 0) + 1;
    }

    // Analyze time patterns
    const hour = new Date(b.timestamp).getHours();
    const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    analysis.timePatterns[timeSlot] = (analysis.timePatterns[timeSlot] || 0) + 1;
  });

  // Calculate engagement level
  const engagementEvents = ['click', 'form_submit', 'airdrop_interact', 'share'];
  const engagementCount = behavior.filter(b => engagementEvents.includes(b.eventType)).length;
  analysis.engagementLevel = behavior.length > 0 ? (engagementCount / behavior.length) * 100 : 0;

  // Determine activity frequency
  const uniqueDays = new Set(behavior.map(b => new Date(b.timestamp).toDateString())).size;
  if (uniqueDays >= 20) {
    analysis.activityFrequency = 'high';
  } else if (uniqueDays >= 10) {
    analysis.activityFrequency = 'medium';
  } else {
    analysis.activityFrequency = 'low';
  }

  // Get preferred content types
  analysis.preferredContentTypes = Object.entries(analysis.eventTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);

  return analysis;
}

// Generate personalized recommendations
async function generateRecommendations(userProfile: any, type: string | null, limit: number) {
  const recommendations = [];
  const zai = await ZAI.create();

  try {
    // Generate different types of recommendations
    const recommendationTypes = type ? [type] : ['airdrop', 'campaign', 'educational_content', 'security_tip'];

    for (const recType of recommendationTypes) {
      const typeRecommendations = await generateRecommendationsByType(
        userProfile, 
        recType, 
        Math.ceil(limit / recommendationTypes.length),
        zai
      );
      recommendations.push(...typeRecommendations);
    }

    // Sort by score and limit
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

// Generate recommendations by type
async function generateRecommendationsByType(
  userProfile: any, 
  type: string, 
  limit: number, 
  zai: any
) {
  const recommendations = [];

  try {
    const prompt = buildRecommendationPrompt(userProfile, type, limit);
    
    const result = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert recommendation engine for cryptocurrency airdrops and DeFi platforms. 
          Generate personalized recommendations based on user profile and behavior.
          Return recommendations as a JSON array with objects containing: title, description, targetId, targetType, priority, score, reason.`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = result.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.map(rec => ({
            ...rec,
            type,
            priority: rec.priority || 'medium',
            score: Math.max(0, Math.min(1, rec.score || 0.5))
          }));
        }
      } catch (parseError) {
        console.error('Error parsing recommendations:', parseError);
      }
    }

    // Fallback recommendations
    return getFallbackRecommendations(type, limit);
  } catch (error) {
    console.error('Error generating recommendations by type:', error);
    return getFallbackRecommendations(type, limit);
  }
}

// Build recommendation prompt
function buildRecommendationPrompt(userProfile: any, type: string, limit: number) {
  const { user, preferences, behavior, portfolio } = userProfile;

  return `
    Generate ${limit} personalized ${type} recommendations for this user:
    
    User Profile:
    - Name: ${user?.displayName || user?.username}
    - Role: ${user?.role}
    - Premium: ${user?.isPremium}
    - Risk Tolerance: ${preferences.riskTolerance}
    - Interests: ${Array.isArray(preferences.interests) ? preferences.interests.join(', ') : 'Not specified'}
    - Preferred Categories: ${Array.isArray(preferences.preferredCategories) ? preferences.preferredCategories.join(', ') : 'Not specified'}
    
    Behavior Analysis:
    - Total Events: ${behavior.totalEvents}
    - Engagement Level: ${behavior.engagementLevel.toFixed(1)}%
    - Activity Frequency: ${behavior.activityFrequency}
    - Preferred Content: ${behavior.preferredContentTypes.join(', ')}
    - Most Active Time: ${Object.keys(behavior.timePatterns).reduce((a, b) => behavior.timePatterns[a] > behavior.timePatterns[b] ? a : b, '')}
    
    Portfolio:
    - Total Value: $${portfolio?.totalValue || 0}
    - ROI: ${portfolio?.roiPercentage || 0}%
    - Diversification Score: ${portfolio?.diversificationScore || 0}
    
    Generate recommendations that are:
    1. Highly relevant to their interests and risk tolerance
    2. Based on their behavior patterns
    3. Appropriate for their experience level
    4. Likely to provide value
    
    For each recommendation include:
    - title: Clear, compelling title
    - description: Detailed explanation of value
    - targetId: Relevant ID (airdrop ID, content ID, etc.)
    - targetType: Type of target (airdrop, content, etc.)
    - priority: low/medium/high/urgent
    - score: Relevance score 0-1
    - reason: Why this was recommended
    
    Return as JSON array.
  `;
}

// Get fallback recommendations
function getFallbackRecommendations(type: string, limit: number) {
  const fallbacks = {
    airdrop: [
      {
        title: 'High-Potential DeFi Airdrop',
        description: 'New DeFi protocol with strong team and audit offering token airdrop',
        targetId: 'fallback-airdrop-1',
        targetType: 'airdrop',
        priority: 'medium',
        score: 0.6,
        reason: 'Matches general DeFi interest'
      },
      {
        title: 'Gaming Platform Token Launch',
        description: 'Blockchain gaming platform distributing tokens to early users',
        targetId: 'fallback-airdrop-2',
        targetType: 'airdrop',
        priority: 'medium',
        score: 0.5,
        reason: 'Popular gaming category'
      }
    ],
    campaign: [
      {
        title: 'Social Media Campaign',
        description: 'Earn rewards by promoting verified crypto projects',
        targetId: 'fallback-campaign-1',
        targetType: 'campaign',
        priority: 'low',
        score: 0.4,
        reason: 'Entry-level opportunity'
      }
    ],
    educational_content: [
      {
        title: 'DeFi Security Best Practices',
        description: 'Learn how to protect your assets in DeFi protocols',
        targetId: 'fallback-content-1',
        targetType: 'content',
        priority: 'high',
        score: 0.8,
        reason: 'Essential security knowledge'
      },
      {
        title: 'Airdrop Strategy Guide',
        description: 'Advanced strategies for maximizing airdrop returns',
        targetId: 'fallback-content-2',
        targetType: 'content',
        priority: 'medium',
        score: 0.7,
        reason: 'Improves airdrop success'
      }
    ],
    security_tip: [
      {
        title: 'Wallet Security Checklist',
        description: 'Essential security measures for crypto wallets',
        targetId: 'fallback-tip-1',
        targetType: 'security_tip',
        priority: 'urgent',
        score: 0.9,
        reason: 'Critical security information'
      }
    ]
  };

  return fallbacks[type as keyof typeof fallbacks] || [];
}

// Learn from user feedback
async function learnFromFeedback(userId: string, recommendation: any, action: string) {
  try {
    const preferences = await db.userPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) return;

    // Update user preferences based on feedback
    const updates: any = {};

    switch (action) {
      case 'accept':
        // Strengthen preference for this type
        if (recommendation.recommendationType) {
          const currentInterests = Array.isArray(preferences.interests) ? preferences.interests : [];
          if (!currentInterests.includes(recommendation.recommendationType)) {
            updates.interests = [...currentInterests, recommendation.recommendationType];
          }
        }
        break;

      case 'reject':
      case 'dismiss':
        // Weaken preference for this type
        if (recommendation.recommendationType) {
          const currentInterests = Array.isArray(preferences.interests) ? preferences.interests : [];
          updates.interests = currentInterests.filter((interest: string) => 
            interest !== recommendation.recommendationType
          );
        }
        break;
    }

    // Update behavior profile
    const behaviorProfile = preferences.behaviorProfile || {};
    behaviorProfile.lastFeedbackAction = action;
    behaviorProfile.lastFeedbackType = recommendation.recommendationType;
    behaviorProfile.lastFeedbackAt = new Date().toISOString();
    updates.behaviorProfile = behaviorProfile;

    // Update last analyzed timestamp
    updates.lastAnalyzed = new Date();

    await db.userPreferences.update({
      where: { userId },
      data: updates
    });
  } catch (error) {
    console.error('Error learning from feedback:', error);
  }
}