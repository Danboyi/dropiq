import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get comprehensive home analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const userId = searchParams.get('userId');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch overview data
    const overview = await getOverviewData(startDate, endDate);
    
    // Fetch user behavior data
    const userBehavior = await getUserBehaviorData(startDate, endDate, userId);
    
    // Fetch market data
    const marketData = await getMarketData(startDate, endDate);
    
    // Fetch predictions data
    const predictions = await getPredictionsData(startDate, endDate);

    return NextResponse.json({
      overview,
      userBehavior,
      marketData,
      predictions,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching home analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home analytics' },
      { status: 500 }
    );
  }
}

// Get overview statistics
async function getOverviewData(startDate: Date, endDate: Date) {
  // Get total users
  const totalUsers = await db.user.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Get active airdrops
  const activeAirdrops = await db.airdrop.count({
    where: {
      status: 'active'
    }
  });

  // Get total value from airdrops
  const totalValueResult = await db.airdrop.aggregate({
    where: {
      status: 'active',
      startDate: {
        lte: endDate
      }
    },
    _sum: {
      totalAmount: true
    }
  });

  // Get user behavior for engagement metrics
  const behaviorStats = await db.userBehavior.groupBy({
    by: ['eventType'],
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    }
  });

  // Calculate engagement rate
  const totalEvents = behaviorStats.reduce((sum, stat) => sum + stat._count.id, 0);
  const engagementEvents = behaviorStats
    .filter(stat => ['click', 'form_submit', 'airdrop_interact'].includes(stat.eventType))
    .reduce((sum, stat) => sum + stat._count.id, 0);
  
  const engagementRate = totalEvents > 0 ? (engagementEvents / totalEvents) * 100 : 0;

  // Calculate conversion rate
  const views = behaviorStats.find(stat => stat.eventType === 'page_view')?._count.id || 0;
  const registrations = behaviorStats.find(stat => stat.eventType === 'register')?._count.id || 0;
  const completions = behaviorStats.find(stat => stat.eventType === 'complete')?._count.id || 0;
  
  const conversionRate = registrations > 0 ? (completions / registrations) * 100 : 0;

  // Calculate average session duration
  const sessionDurations = await db.userBehavior.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      },
      duration: {
        not: null
      }
    },
    select: {
      duration: true
    }
  });

  const avgSessionDuration = sessionDurations.length > 0
    ? sessionDurations.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionDurations.length
    : 0;

  return {
    totalUsers,
    activeAirdrops,
    totalValue: Number(totalValueResult._sum.totalAmount || 0),
    engagementRate,
    conversionRate,
    avgSessionDuration
  };
}

// Get user behavior analytics
async function getUserBehaviorData(startDate: Date, endDate: Date, userId?: string) {
  const where: any = {
    timestamp: {
      gte: startDate,
      lte: endDate
    }
  };
  
  if (userId) {
    where.userId = userId;
  }

  // Get behavior data
  const behaviors = await db.userBehavior.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 1000
  });

  // Calculate metrics
  const totalEvents = behaviors.length;
  const uniquePages = new Set(behaviors.map(b => b.pageUrl)).size;
  
  // Count event types
  const topEventTypes = behaviors.reduce((acc, b) => {
    acc[b.eventType] = (acc[b.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate engagement score
  const engagementEvents = ['click', 'form_submit', 'airdrop_interact'];
  const engagementCount = behaviors.filter(b => 
    engagementEvents.includes(b.eventType)
  ).length;
  
  const engagementScore = totalEvents > 0 
    ? (engagementCount / totalEvents) * 100 
    : 0;

  // Generate behavior patterns (simplified)
  const behaviorPatterns = [
    'Peak activity between 2-4 PM UTC',
    'Users spend most time on airdrop pages',
    'Mobile users have higher engagement',
    'Social media referrals convert better'
  ];

  return {
    totalEvents,
    uniquePages,
    topEventTypes,
    engagementScore,
    behaviorPatterns
  };
}

// Get market data analytics
async function getMarketData(startDate: Date, endDate: Date) {
  const marketData = await db.marketData.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  if (marketData.length === 0) {
    return {
      totalTokens: 0,
      avgPrice: 0,
      avgVolume24h: 0,
      avgChange24h: 0,
      topGainers: [],
      topLosers: [],
      marketSentiment: 'neutral'
    };
  }

  // Calculate metrics
  const totalTokens = new Set(marketData.map(d => d.symbol)).size;
  
  const prices = marketData.filter(d => d.price).map(d => d.price!);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  
  const volumes = marketData.filter(d => d.volume24h).map(d => d.volume24h!);
  const avgVolume24h = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
  
  const changes = marketData.filter(d => d.change24h).map(d => d.change24h!);
  const avgChange24h = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;

  // Get top gainers and losers
  const sortedByChange = [...marketData]
    .filter(d => d.change24h)
    .sort((a, b) => b.change24h! - a.change24h!);

  const topGainers = sortedByChange.slice(0, 5);
  const topLosers = sortedByChange.slice(-5).reverse();

  // Determine market sentiment
  let marketSentiment = 'neutral';
  if (avgChange24h > 2) {
    marketSentiment = 'bullish';
  } else if (avgChange24h < -2) {
    marketSentiment = 'bearish';
  }

  return {
    totalTokens,
    avgPrice,
    avgVolume24h,
    avgChange24h,
    topGainers,
    topLosers,
    marketSentiment
  };
}

// Get predictions analytics
async function getPredictionsData(startDate: Date, endDate: Date) {
  const predictions = await db.mLPrediction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate metrics
  const totalPredictions = predictions.length;
  
  const confidences = predictions.map(p => p.confidence);
  const averageConfidence = confidences.length > 0 
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
    : 0;

  // Group by model type
  const accuracyByType = predictions.reduce((acc, p) => {
    if (!acc[p.modelType]) {
      acc[p.modelType] = {
        count: 0,
        totalConfidence: 0,
        withActual: 0,
        correct: 0
      };
    }
    
    acc[p.modelType].count++;
    acc[p.modelType].totalConfidence += p.confidence;
    
    if (p.actualValue !== null) {
      acc[p.modelType].withActual++;
      // Simple accuracy calculation
      const predicted = typeof p.prediction === 'object' ? p.prediction.value : p.prediction;
      if (Math.abs(Number(predicted) - Number(p.actualValue)) < 0.1) {
        acc[p.modelType].correct++;
      }
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate accuracy for each type
  Object.keys(accuracyByType).forEach(type => {
    const stats = accuracyByType[type];
    stats.averageConfidence = stats.totalConfidence / stats.count;
    stats.accuracy = stats.withActual > 0 ? (stats.correct / stats.withActual) * 100 : 0;
  });

  // Calculate recent accuracy
  const recentPredictions = predictions
    .filter(p => p.actualValue !== null)
    .slice(0, 20);
  
  const recentAccuracy = recentPredictions.length > 0
    ? (recentPredictions.filter(p => {
        const predicted = typeof p.prediction === 'object' ? p.prediction.value : p.prediction;
        return Math.abs(Number(predicted) - Number(p.actualValue)) < 0.1;
      }).length / recentPredictions.length) * 100
    : 0;

  return {
    totalPredictions,
    averageConfidence,
    accuracyByType,
    recentAccuracy
  };
}