import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Track user behavior events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionId,
      eventType,
      eventName,
      eventData,
      pageUrl,
      pageTitle,
      referrer,
      userAgent,
      ipAddress,
      geolocation,
      deviceInfo,
      duration,
      scrollDepth,
      metadata
    } = body;

    // Validate required fields
    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    // Check privacy settings
    if (userId) {
      const privacySettings = await db.dataPrivacySettings.findUnique({
        where: { userId }
      });

      if (privacySettings && !privacySettings.analyticsConsent) {
        return NextResponse.json(
          { error: 'Analytics tracking disabled by user' },
          { status: 403 }
        );
      }
    }

    // Create behavior record
    const behavior = await db.userBehavior.create({
      data: {
        userId,
        sessionId,
        eventType,
        eventName,
        eventData,
        pageUrl,
        pageTitle,
        referrer,
        userAgent,
        ipAddress: ipAddress || request.ip,
        geolocation,
        deviceInfo,
        duration,
        scrollDepth,
        metadata
      }
    });

    // Update airdrop analytics if this is an airdrop interaction
    if (eventType === 'airdrop_interact' && eventData?.airdropId) {
      await updateAirdropAnalytics(eventData.airdropId, eventName);
    }

    // Trigger real-time analytics processing
    await processAnalyticsEvent(behavior);

    return NextResponse.json({ success: true, id: behavior.id });
  } catch (error) {
    console.error('Error tracking behavior:', error);
    return NextResponse.json(
      { error: 'Failed to track behavior' },
      { status: 500 }
    );
  }
}

// Get user behavior analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: any = {};
    if (userId) where.userId = userId;
    if (sessionId) where.sessionId = sessionId;
    if (eventType) where.eventType = eventType;
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const behaviors = await db.userBehavior.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    // Generate insights
    const insights = await generateBehaviorInsights(behaviors);

    return NextResponse.json({
      behaviors,
      insights,
      total: behaviors.length
    });
  } catch (error) {
    console.error('Error fetching behavior analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch behavior analytics' },
      { status: 500 }
    );
  }
}

// Update airdrop analytics
async function updateAirdropAnalytics(airdropId: string, eventName: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const analytics = await db.airdropAnalytics.upsert({
    where: {
      airdropId_date: {
        airdropId,
        date: today
      }
    },
    update: {},
    create: {
      airdropId,
      date: today
    }
  });

  // Update specific metrics based on event type
  const updateData: any = {};
  
  switch (eventName) {
    case 'view':
      updateData.views = { increment: 1 };
      break;
    case 'click':
      updateData.clicks = { increment: 1 };
      break;
    case 'register':
      updateData.registrations = { increment: 1 };
      break;
    case 'complete':
      updateData.completions = { increment: 1 };
      break;
    case 'share':
      updateData.shares = { increment: 1 };
      break;
  }

  if (Object.keys(updateData).length > 0) {
    await db.airdropAnalytics.update({
      where: { id: analytics.id },
      data: updateData
    });
  }

  // Recalculate rates
  await recalculateAirdropMetrics(airdropId);
}

// Recalculate airdrop metrics
async function recalculateAirdropAnalytics(airdropId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const analytics = await db.airdropAnalytics.findUnique({
    where: {
      airdropId_date: {
        airdropId,
        date: today
      }
    }
  });

  if (!analytics) return;

  // Calculate rates
  const engagementRate = analytics.views > 0 
    ? (analytics.clicks / analytics.views) * 100 
    : 0;
  
  const conversionRate = analytics.registrations > 0 
    ? (analytics.completions / analytics.registrations) * 100 
    : 0;

  await db.airdropAnalytics.update({
    where: { id: analytics.id },
    data: {
      engagementRate,
      conversionRate
    }
  });
}

// Process analytics event with AI
async function processAnalyticsEvent(behavior: any) {
  try {
    const zai = await ZAI.create();

    // Analyze behavior patterns
    const analysis = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an analytics expert. Analyze user behavior events and provide insights.'
        },
        {
          role: 'user',
          content: `Analyze this user behavior event:
          Type: ${behavior.eventType}
          Name: ${behavior.eventName}
          Page: ${behavior.pageUrl}
          Duration: ${behavior.duration}s
          Scroll Depth: ${behavior.scrollDepth}%
          
          Provide insights about user engagement and potential actions.`
        }
      ]
    });

    // Store AI insights
    const insights = analysis.choices[0]?.message?.content;
    if (insights) {
      await db.userBehavior.update({
        where: { id: behavior.id },
        data: {
          metadata: {
            ...behavior.metadata,
            aiInsights: insights
          }
        }
      });
    }
  } catch (error) {
    console.error('Error processing analytics event:', error);
  }
}

// Generate behavior insights
async function generateBehaviorInsights(behaviors: any[]) {
  const insights = {
    totalEvents: behaviors.length,
    uniquePages: new Set(behaviors.map(b => b.pageUrl)).size,
    avgSessionDuration: 0,
    topEventTypes: {} as Record<string, number>,
    engagementScore: 0,
    behaviorPatterns: [] as string[]
  };

  // Calculate metrics
  const durations = behaviors
    .filter(b => b.duration)
    .map(b => b.duration!);
  
  if (durations.length > 0) {
    insights.avgSessionDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  // Count event types
  behaviors.forEach(b => {
    insights.topEventTypes[b.eventType] = (insights.topEventTypes[b.eventType] || 0) + 1;
  });

  // Calculate engagement score
  const engagementEvents = ['click', 'form_submit', 'airdrop_interact'];
  const engagementCount = behaviors.filter(b => 
    engagementEvents.includes(b.eventType)
  ).length;
  
  insights.engagementScore = behaviors.length > 0 
    ? (engagementCount / behaviors.length) * 100 
    : 0;

  // Generate behavior patterns using AI
  try {
    const zai = await ZAI.create();
    
    const patternAnalysis = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a user behavior analyst. Identify patterns in user behavior data.'
        },
        {
          role: 'user',
          content: `Analyze these user behavior events and identify key patterns:
          ${behaviors.slice(0, 10).map(b => 
            `${b.eventType}: ${b.eventName} on ${b.pageUrl}`
          ).join('\n')}
          
          Provide 3-5 key behavior patterns or insights.`
        }
      ]
    });

    const patterns = patternAnalysis.choices[0]?.message?.content;
    if (patterns) {
      insights.behaviorPatterns = patterns.split('\n').filter(p => p.trim());
    }
  } catch (error) {
    console.error('Error generating behavior patterns:', error);
  }

  return insights;
}