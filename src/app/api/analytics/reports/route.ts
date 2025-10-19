import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Generate automated reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      reportType,
      title,
      description,
      filters,
      dateRange,
      format,
      schedule
    } = body;

    // Validate required fields
    if (!reportType || !title) {
      return NextResponse.json(
        { error: 'reportType and title are required' },
        { status: 400 }
      );
    }

    // Create report record
    const report = await db.analyticsReport.create({
      data: {
        userId,
        reportType,
        title,
        description,
        filters: filters || {},
        dateRange: dateRange || {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date()
        },
        format: format || 'json',
        status: 'generating'
      }
    });

    // Generate report data asynchronously
    generateReportData(report.id);

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report generation started'
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// Get reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const reportType = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (userId) where.userId = userId;
    if (reportType) where.reportType = reportType;
    if (status) where.status = status;

    const reports = await db.analyticsReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// Download report
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, userId } = body;

    if (!reportId || !userId) {
      return NextResponse.json(
        { error: 'reportId and userId are required' },
        { status: 400 }
      );
    }

    // Get report
    const report = await db.analyticsReport.findFirst({
      where: {
        id: reportId,
        userId
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.status !== 'ready') {
      return NextResponse.json(
        { error: 'Report is not ready for download' },
        { status: 400 }
      );
    }

    // Check download limits
    if (report.maxDownloads && report.downloadCount >= report.maxDownloads) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 400 }
      );
    }

    // Check if report has expired
    if (report.expiresAt && new Date() > report.expiresAt) {
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 400 }
      );
    }

    // Update download count and timestamp
    await db.analyticsReport.update({
      where: { id: reportId },
      data: {
        downloadCount: { increment: 1 },
        downloadedAt: new Date()
      }
    });

    // Return report data
    return NextResponse.json({
      report,
      data: report.reportData,
      downloadUrl: report.fileUrl
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}

// Generate report data
async function generateReportData(reportId: string) {
  try {
    const report = await db.analyticsReport.findUnique({
      where: { id: reportId }
    });

    if (!report) return;

    // Update status to generating
    await db.analyticsReport.update({
      where: { id: reportId },
      data: { status: 'generating' }
    });

    let reportData;

    switch (report.reportType) {
      case 'portfolio':
        reportData = await generatePortfolioReport(report);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(report);
        break;
      case 'market':
        reportData = await generateMarketReport(report);
        break;
      case 'user_behavior':
        reportData = await generateUserBehaviorReport(report);
        break;
      case 'predictions':
        reportData = await generatePredictionsReport(report);
        break;
      case 'custom':
        reportData = await generateCustomReport(report);
        break;
      default:
        throw new Error(`Unknown report type: ${report.reportType}`);
    }

    // Generate file if needed
    let fileUrl = null;
    let fileSize = null;

    if (report.format !== 'json') {
      const fileResult = await generateReportFile(reportData, report.format, report.title);
      fileUrl = fileResult.url;
      fileSize = fileResult.size;
    }

    // Update report with data
    await db.analyticsReport.update({
      where: { id: reportId },
      data: {
        reportData,
        status: 'ready',
        fileUrl,
        fileSize,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
  } catch (error) {
    console.error('Error generating report data:', error);
    
    // Update status to failed
    await db.analyticsReport.update({
      where: { id: reportId },
      data: { status: 'failed' }
    });
  }
}

// Generate portfolio report
async function generatePortfolioReport(report: any) {
  const { userId, dateRange } = report;
  
  const portfolio = await db.userPortfolio.findUnique({
    where: { userId }
  });

  const transactions = await db.userBehavior.findMany({
    where: {
      userId,
      eventType: 'transaction',
      timestamp: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      }
    }
  });

  const predictions = await db.mLPrediction.findMany({
    where: {
      targetType: 'user',
      targetId: userId,
      createdAt: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      }
    }
  });

  return {
    summary: {
      totalValue: portfolio?.totalValue || 0,
      totalReturns: portfolio?.totalReturns || 0,
      roiPercentage: portfolio?.roiPercentage || 0,
      diversificationScore: portfolio?.diversificationScore || 0,
      holdingsCount: portfolio?.holdings ? Object.keys(portfolio.holdings).length : 0
    },
    performance: {
      periodStart: dateRange.startDate,
      periodEnd: dateRange.endDate,
      transactions: transactions.length,
      averageTransactionValue: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + (t.eventData?.value || 0), 0) / transactions.length 
        : 0
    },
    holdings: portfolio?.holdings || {},
    predictions: {
      total: predictions.length,
      averageConfidence: predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
        : 0,
      accuracy: calculatePredictionAccuracy(predictions)
    },
    insights: await generatePortfolioInsights(portfolio, transactions, predictions)
  };
}

// Generate performance report
async function generatePerformanceReport(report: any) {
  const { dateRange, filters } = report;

  const airdrops = await db.airdrop.findMany({
    where: {
      startDate: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      },
      ...filters
    },
    include: {
      project: true
    }
  });

  const analytics = await db.airdropAnalytics.findMany({
    where: {
      date: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      }
    }
  });

  return {
    summary: {
      totalAirdrops: airdrops.length,
      totalValue: airdrops.reduce((sum, a) => sum + Number(a.totalAmount), 0),
      averageTrustScore: airdrops.reduce((sum, a) => sum + Number(a.trustScore), 0) / airdrops.length,
      categories: [...new Set(airdrops.map(a => a.project.category))]
    },
    performance: {
      totalViews: analytics.reduce((sum, a) => sum + a.views, 0),
      totalRegistrations: analytics.reduce((sum, a) => sum + a.registrations, 0),
      totalCompletions: analytics.reduce((sum, a) => sum + a.completions, 0),
      averageEngagementRate: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.engagementRate || 0), 0) / analytics.length 
        : 0,
      averageConversionRate: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.conversionRate || 0), 0) / analytics.length 
        : 0
    },
    topPerformers: airdrops
      .sort((a, b) => Number(b.trustScore) - Number(a.trustScore))
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        title: a.title,
        project: a.project.name,
        trustScore: a.trustScore,
        participants: a.participantsCount,
        totalAmount: a.totalAmount
      })),
    insights: await generatePerformanceInsights(airdrops, analytics)
  };
}

// Generate market report
async function generateMarketReport(report: any) {
  const { dateRange } = report;

  const marketData = await db.marketData.findMany({
    where: {
      timestamp: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      }
    }
  });

  const predictions = await db.mLPrediction.findMany({
    where: {
      modelType: 'price_prediction',
      createdAt: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      }
    }
  });

  return {
    summary: {
      totalTokens: new Set(marketData.map(d => d.symbol)).size,
      averagePrice: marketData.length > 0 
        ? marketData.reduce((sum, d) => sum + (d.price || 0), 0) / marketData.length 
        : 0,
      totalVolume: marketData.reduce((sum, d) => sum + (d.volume24h || 0), 0),
      averageSentiment: marketData.length > 0 
        ? marketData.reduce((sum, d) => sum + (d.sentiment || 0), 0) / marketData.length 
        : 0
    },
    trends: {
      topGainers: marketData
        .filter(d => d.change24h && d.change24h > 0)
        .sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
        .slice(0, 10),
      topLosers: marketData
        .filter(d => d.change24h && d.change24h < 0)
        .sort((a, b) => (a.change24h || 0) - (b.change24h || 0))
        .slice(0, 10),
      highestVolume: marketData
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        .slice(0, 10)
    },
    predictions: {
      total: predictions.length,
      averageConfidence: predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
        : 0,
      accuracy: calculatePredictionAccuracy(predictions)
    },
    insights: await generateMarketInsights(marketData, predictions)
  };
}

// Generate user behavior report
async function generateUserBehaviorReport(report: any) {
  const { dateRange, filters } = report;

  const behavior = await db.userBehavior.findMany({
    where: {
      timestamp: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      },
      ...filters
    }
  });

  const eventTypes = behavior.reduce((acc, b) => {
    acc[b.eventType] = (acc[b.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueUsers = new Set(behavior.map(b => b.userId)).size;
  const uniquePages = new Set(behavior.map(b => b.pageUrl)).size;

  return {
    summary: {
      totalEvents: behavior.length,
      uniqueUsers,
      uniquePages,
      averageEventsPerUser: uniqueUsers > 0 ? behavior.length / uniqueUsers : 0
    },
    eventTypes,
    timeAnalysis: analyzeTimePatterns(behavior),
    pageAnalysis: analyzePagePatterns(behavior),
    userSegments: await analyzeUserSegments(behavior),
    insights: await generateBehaviorInsights(behavior)
  };
}

// Generate predictions report
async function generatePredictionsReport(report: any) {
  const { dateRange, filters } = report;

  const predictions = await db.mLPrediction.findMany({
    where: {
      createdAt: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate)
      },
      ...filters
    }
  });

  const byType = predictions.reduce((acc, p) => {
    if (!acc[p.modelType]) acc[p.modelType] = [];
    acc[p.modelType].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const accuracyByType = {};
  for (const [type, preds] of Object.entries(byType)) {
    accuracyByType[type] = {
      total: preds.length,
      averageConfidence: preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length,
      accuracy: calculatePredictionAccuracy(preds)
    };
  }

  return {
    summary: {
      totalPredictions: predictions.length,
      modelTypes: Object.keys(byType),
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
      overallAccuracy: calculatePredictionAccuracy(predictions)
    },
    byType: accuracyByType,
    topPredictions: predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20)
      .map(p => ({
        id: p.id,
        type: p.modelType,
        target: p.targetId,
        confidence: p.confidence,
        prediction: p.prediction,
        accuracy: p.actualValue ? calculateSinglePredictionAccuracy(p) : null
      })),
    insights: await generatePredictionsInsights(predictions)
  };
}

// Generate custom report
async function generateCustomReport(report: any) {
  const { filters, dateRange } = report;

  // This would be highly customizable based on user requirements
  // For now, return a combination of other report types
  return {
    message: 'Custom report generation based on user-defined filters',
    filters,
    dateRange,
    generatedAt: new Date().toISOString()
  };
}

// Helper functions
function calculatePredictionAccuracy(predictions: any[]) {
  const withActual = predictions.filter(p => p.actualValue !== null);
  if (withActual.length === 0) return 0;

  const correct = withActual.filter(p => {
    const predicted = typeof p.prediction === 'object' ? p.prediction.value : p.prediction;
    return Math.abs(Number(predicted) - Number(p.actualValue)) < 0.1;
  }).length;

  return (correct / withActual.length) * 100;
}

function calculateSinglePredictionAccuracy(prediction: any) {
  const predicted = typeof prediction.prediction === 'object' ? prediction.prediction.value : prediction.prediction;
  const actual = prediction.actualValue;
  const error = Math.abs(Number(predicted) - Number(actual));
  return Math.max(0, 100 - (error * 100));
}

function analyzeTimePatterns(behavior: any[]) {
  const hours = behavior.reduce((acc, b) => {
    const hour = new Date(b.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const days = behavior.reduce((acc, b) => {
    const day = new Date(b.timestamp).getDay();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return { hours, days };
}

function analyzePagePatterns(behavior: any[]) {
  const pages = behavior.reduce((acc, b) => {
    if (b.pageUrl) {
      acc[b.pageUrl] = (acc[b.pageUrl] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(pages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20);
}

async function analyzeUserSegments(behavior: any[]) {
  // Simple segmentation based on activity level
  const userActivity = behavior.reduce((acc, b) => {
    if (!b.userId) return acc;
    acc[b.userId] = (acc[b.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const segments = {
    high: Object.values(userActivity).filter(count => count > 50).length,
    medium: Object.values(userActivity).filter(count => count >= 10 && count <= 50).length,
    low: Object.values(userActivity).filter(count => count < 10).length
  };

  return segments;
}

// AI-powered insight generation functions
async function generatePortfolioInsights(portfolio: any, transactions: any[], predictions: any[]) {
  try {
    const zai = await ZAI.create();
    
    const result = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a portfolio analyst. Provide insights on portfolio performance and recommendations.'
        },
        {
          role: 'user',
          content: `Analyze this portfolio and provide insights:
          Portfolio Value: $${portfolio?.totalValue || 0}
          ROI: ${portfolio?.roiPercentage || 0}%
          Diversification: ${portfolio?.diversificationScore || 0}/100
          Transactions: ${transactions.length}
          Predictions Accuracy: ${calculatePredictionAccuracy(predictions)}%
          
          Provide 3-5 key insights and recommendations.`
        }
      ]
    });

    return result.choices[0]?.message?.content || 'Unable to generate insights';
  } catch (error) {
    console.error('Error generating portfolio insights:', error);
    return 'Error generating insights';
  }
}

async function generatePerformanceInsights(airdrops: any[], analytics: any[]) {
  try {
    const zai = await ZAI.create();
    
    const result = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a performance analyst. Analyze airdrop performance and provide insights.'
        },
        {
          role: 'user',
          content: `Analyze this airdrop performance data:
          Total Airdrops: ${airdrops.length}
          Total Value: $${airdrops.reduce((sum, a) => sum + Number(a.totalAmount), 0)}
          Average Trust Score: ${airdrops.reduce((sum, a) => sum + Number(a.trustScore), 0) / airdrops.length}
          Total Views: ${analytics.reduce((sum, a) => sum + a.views, 0)}
          Conversion Rate: ${analytics.length > 0 ? analytics.reduce((sum, a) => sum + (a.conversionRate || 0), 0) / analytics.length : 0}%
          
          Provide 3-5 key performance insights and recommendations.`
        }
      ]
    });

    return result.choices[0]?.message?.content || 'Unable to generate insights';
  } catch (error) {
    console.error('Error generating performance insights:', error);
    return 'Error generating insights';
  }
}

async function generateMarketInsights(marketData: any[], predictions: any[]) {
  try {
    const zai = await ZAI.create();
    
    const result = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a market analyst. Analyze market data and provide insights.'
        },
        {
          role: 'user',
          content: `Analyze this market data:
          Total Tokens: ${new Set(marketData.map(d => d.symbol)).size}
          Average Price: $${marketData.length > 0 ? marketData.reduce((sum, d) => sum + (d.price || 0), 0) / marketData.length : 0}
          Total Volume: $${marketData.reduce((sum, d) => sum + (d.volume24h || 0), 0)}
          Average Sentiment: ${marketData.length > 0 ? marketData.reduce((sum, d) => sum + (d.sentiment || 0), 0) / marketData.length : 0}
          Prediction Accuracy: ${calculatePredictionAccuracy(predictions)}%
          
          Provide 3-5 key market insights and trends.`
        }
      ]
    });

    return result.choices[0]?.message?.content || 'Unable to generate insights';
  } catch (error) {
    console.error('Error generating market insights:', error);
    return 'Error generating insights';
  }
}

async function generateBehaviorInsights(behavior: any[]) {
  try {
    const zai = await ZAI.create();
    
    const result = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a user behavior analyst. Analyze behavior patterns and provide insights.'
        },
        {
          role: 'user',
          content: `Analyze this user behavior data:
          Total Events: ${behavior.length}
          Unique Users: ${new Set(behavior.map(b => b.userId)).size}
          Unique Pages: ${new Set(behavior.map(b => b.pageUrl)).size}
          Top Events: ${Object.entries(behavior.reduce((acc, b) => { acc[b.eventType] = (acc[b.eventType] || 0) + 1; return acc; }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a).slice(0, 5).map(([type, count]) => `${type}: ${count}`).join(', ')}
          
          Provide 3-5 key behavior insights and recommendations.`
        }
      ]
    });

    return result.choices[0]?.message?.content || 'Unable to generate insights';
  } catch (error) {
    console.error('Error generating behavior insights:', error);
    return 'Error generating insights';
  }
}

async function generatePredictionsInsights(predictions: any[]) {
  try {
    const zai = await ZAI.create();
    
    const result = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an ML predictions analyst. Analyze prediction performance and provide insights.'
        },
        {
          role: 'user',
          content: `Analyze this prediction data:
          Total Predictions: ${predictions.length}
          Model Types: ${[...new Set(predictions.map(p => p.modelType))].join(', ')}
          Average Confidence: ${predictions.length > 0 ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length : 0}
          Overall Accuracy: ${calculatePredictionAccuracy(predictions)}%
          
          Provide 3-5 key insights about prediction performance and model effectiveness.`
        }
      ]
    });

    return result.choices[0]?.message?.content || 'Unable to generate insights';
  } catch (error) {
    console.error('Error generating predictions insights:', error);
    return 'Error generating insights';
  }
}

// Generate report file (CSV, PDF, etc.)
async function generateReportFile(data: any, format: string, title: string) {
  // This would integrate with a file generation service
  // For now, return a mock result
  return {
    url: `/reports/${title.replace(/\s+/g, '_')}_${Date.now()}.${format}`,
    size: Math.floor(Math.random() * 1000000) + 100000 // Random file size
  };
}