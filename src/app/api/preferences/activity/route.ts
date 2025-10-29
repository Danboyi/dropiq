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

    // Get cached activity patterns
    let activityPattern = await db.activityPattern.findUnique({
      where: { userId }
    });

    // If no patterns exist or refresh is requested, analyze from behavior
    if (!activityPattern || refresh) {
      const analyzedPatterns = await preferenceAnalysisService.analyzeActivityPatterns(userId, timeHorizon);
      
      // Aggregate patterns into summary statistics
      const aggregatedStats = aggregateActivityPatterns(analyzedPatterns);
      
      // Update database with new patterns
      await db.activityPattern.upsert({
        where: { userId },
        update: {
          dailyActiveTime: aggregatedStats.dailyActiveTime,
          weeklyActiveDays: aggregatedStats.weeklyActiveDays,
          preferredTimeSlots: aggregatedStats.preferredTimeSlots,
          sessionDuration: aggregatedStats.avgSessionDuration,
          tasksPerSession: aggregatedStats.tasksPerSession,
          peakActivityHours: aggregatedStats.peakActivityHours,
          consistencyScore: aggregatedStats.consistencyScore,
          burstActivity: aggregatedStats.burstActivity,
          weekendActivity: aggregatedStats.weekendActivity,
          lastAnalyzedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId,
          dailyActiveTime: aggregatedStats.dailyActiveTime,
          weeklyActiveDays: aggregatedStats.weeklyActiveDays,
          preferredTimeSlots: aggregatedStats.preferredTimeSlots,
          sessionDuration: aggregatedStats.avgSessionDuration,
          tasksPerSession: aggregatedStats.tasksPerSession,
          peakActivityHours: aggregatedStats.peakActivityHours,
          consistencyScore: aggregatedStats.consistencyScore,
          burstActivity: aggregatedStats.burstActivity,
          weekendActivity: aggregatedStats.weekendActivity
        }
      });

      // Get updated patterns
      activityPattern = await db.activityPattern.findUnique({
        where: { userId }
      });

      return NextResponse.json({
        success: true,
        activityPattern,
        detailedPatterns: analyzedPatterns,
        analyzed: true,
        timeHorizon
      });
    }

    return NextResponse.json({
      success: true,
      activityPattern,
      cached: true
    });

  } catch (error) {
    console.error('Error fetching activity patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity patterns' },
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
    const { action, data } = body;

    switch (action) {
      case 'record_activity':
        await recordActivitySession(userId, data);
        break;
      case 'update_preferences':
        await updateActivityPreferences(userId, data);
        break;
      case 'get_insights':
        const insights = await getActivityInsights(userId);
        return NextResponse.json({
          success: true,
          insights
        });
      case 'get_recommendations':
        const recommendations = await getActivityRecommendations(userId);
        return NextResponse.json({
          success: true,
          recommendations
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Activity pattern updated successfully'
    });

  } catch (error) {
    console.error('Error updating activity patterns:', error);
    return NextResponse.json(
      { error: 'Failed to update activity patterns' },
      { status: 500 }
    );
  }
}

function aggregateActivityPatterns(patterns: any[]): {
  dailyActiveTime: number;
  weeklyActiveDays: number;
  preferredTimeSlots: any;
  avgSessionDuration: number;
  tasksPerSession: number;
  peakActivityHours: any;
  consistencyScore: number;
  burstActivity: boolean;
  weekendActivity: number;
} {
  if (patterns.length === 0) {
    return {
      dailyActiveTime: 0,
      weeklyActiveDays: 0,
      preferredTimeSlots: [],
      avgSessionDuration: 0,
      tasksPerSession: 0,
      peakActivityHours: [],
      consistencyScore: 0,
      burstActivity: false,
      weekendActivity: 0
    };
  }

  // Calculate total activity frequency
  const totalFrequency = patterns.reduce((sum, p) => sum + p.activityFrequency, 0);
  
  // Calculate daily active time (average across all patterns)
  const dailyActiveTime = totalFrequency / patterns.length;
  
  // Calculate weekly active days (unique days with activity)
  const uniqueDays = new Set(patterns.map(p => p.dayOfWeek)).size;
  const weeklyActiveDays = uniqueDays;
  
  // Find preferred time slots
  const timeSlotFrequency: Record<string, number> = {};
  patterns.forEach(p => {
    if (!timeSlotFrequency[p.period]) {
      timeSlotFrequency[p.period] = 0;
    }
    timeSlotFrequency[p.period] += p.activityFrequency;
  });
  
  const preferredTimeSlots = Object.entries(timeSlotFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([period, frequency]) => ({ period, frequency }));
  
  // Calculate average session duration
  const avgSessionDuration = patterns.reduce((sum, p) => sum + p.avgSessionDuration, 0) / patterns.length;
  
  // Calculate average tasks per session
  const tasksPerSession = patterns.reduce((sum, p) => sum + (p.preferredActionTypes?.length || 0), 0) / patterns.length;
  
  // Find peak activity hours
  const hourlyActivity: Record<number, number> = {};
  patterns.forEach(p => {
    const hour = getHourFromPeriod(p.period);
    if (hour !== null) {
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + p.activityFrequency;
    }
  });
  
  const peakActivityHours = Object.entries(hourlyActivity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, frequency]) => ({ hour: parseInt(hour), frequency }));
  
  // Calculate consistency score (how evenly distributed activity is)
  const frequencies = patterns.map(p => p.activityFrequency);
  const mean = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
  const variance = frequencies.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / frequencies.length;
  const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));
  
  // Detect burst activity (high variance in activity patterns)
  const burstActivity = variance > mean * 2;
  
  // Calculate weekend activity ratio
  const weekendPatterns = patterns.filter(p => p.dayOfWeek === 0 || p.dayOfWeek === 6);
  const weekdayPatterns = patterns.filter(p => p.dayOfWeek >= 1 && p.dayOfWeek <= 5);
  const weekendFreq = weekendPatterns.reduce((sum, p) => sum + p.activityFrequency, 0);
  const weekdayFreq = weekdayPatterns.reduce((sum, p) => sum + p.activityFrequency, 0);
  const weekendActivity = weekdayFreq > 0 ? weekendFreq / weekdayFreq : 0;

  return {
    dailyActiveTime,
    weeklyActiveDays,
    preferredTimeSlots,
    avgSessionDuration,
    tasksPerSession,
    peakActivityHours,
    consistencyScore,
    burstActivity,
    weekendActivity
  };
}

function getHourFromPeriod(period: string): number | null {
  const periodHours: Record<string, number> = {
    'morning': 9,    // 9 AM as representative
    'afternoon': 15, // 3 PM as representative
    'evening': 19,   // 7 PM as representative
    'night': 23      // 11 PM as representative
  };
  return periodHours[period] || null;
}

async function recordActivitySession(userId: string, data: any) {
  try {
    // Record the activity session
    await db.userBehaviorEvent.create({
      data: {
        userId,
        eventType: 'activity_session',
        eventName: 'session_completed',
        eventData: {
          sessionDuration: data.duration,
          tasksCompleted: data.tasksCompleted,
          startTime: data.startTime,
          endTime: data.endTime,
          interactions: data.interactions || []
        },
        duration: data.duration,
        timestamp: new Date()
      }
    });

    // Update activity pattern with new session data
    const existingPattern = await db.activityPattern.findUnique({
      where: { userId }
    });

    const newSessionDuration = data.duration || 0;
    const newTasksCompleted = data.tasksCompleted || 0;
    const currentTotalSessions = existingPattern?.sessionDuration || 0;
    const currentTotalTasks = existingPattern?.tasksPerSession || 0;

    // Calculate new averages (simplified - in production would track total count)
    const updatedAvgSessionDuration = (currentTotalSessions + newSessionDuration) / 2;
    const updatedAvgTasksPerSession = (currentTotalTasks + newTasksCompleted) / 2;

    await db.activityPattern.upsert({
      where: { userId },
      update: {
        sessionDuration: updatedAvgSessionDuration,
        tasksPerSession: updatedAvgTasksPerSession,
        updatedAt: new Date()
      },
      create: {
        userId,
        sessionDuration: newSessionDuration,
        tasksPerSession: newTasksCompleted
      }
    });

  } catch (error) {
    console.error('Error recording activity session:', error);
    throw error;
  }
}

async function updateActivityPreferences(userId: string, data: any) {
  try {
    await db.activityPattern.upsert({
      where: { userId },
      update: {
        preferredTimeSlots: data.preferredTimeSlots,
        sessionDuration: data.targetSessionDuration,
        tasksPerSession: data.targetTasksPerSession,
        updatedAt: new Date()
      },
      create: {
        userId,
        preferredTimeSlots: data.preferredTimeSlots,
        sessionDuration: data.targetSessionDuration,
        tasksPerSession: data.targetTasksPerSession
      }
    });

    // Track preference evolution
    await db.preferenceEvolution.create({
      data: {
        userId,
        category: 'activity',
        oldValue: { sessionDuration: data.oldSessionDuration },
        newValue: { sessionDuration: data.targetSessionDuration },
        changeReason: 'user_preference_update',
        changeTrigger: 'activity_api'
      }
    });

  } catch (error) {
    console.error('Error updating activity preferences:', error);
    throw error;
  }
}

async function getActivityInsights(userId: string) {
  try {
    const activityPattern = await db.activityPattern.findUnique({
      where: { userId }
    });

    if (!activityPattern) {
      return [];
    }

    const insights = [];

    // Session duration insight
    if (activityPattern.sessionDuration < 10) {
      insights.push({
        type: 'session_duration',
        title: 'Short Sessions Detected',
        description: 'Your average session duration is quite short. Consider spending more time on each airdrop task for better results.',
        impactLevel: 'medium',
        actionableRecommendation: 'Try to aim for 15-30 minute sessions to complete tasks thoroughly.'
      });
    } else if (activityPattern.sessionDuration > 60) {
      insights.push({
        type: 'session_duration',
        title: 'Long Sessions Detected',
        description: 'You tend to have long sessions. This might lead to burnout.',
        impactLevel: 'medium',
        actionableRecommendation: 'Consider taking breaks during long sessions to maintain focus.'
      });
    }

    // Consistency insight
    if (activityPattern.consistencyScore < 30) {
      insights.push({
        type: 'consistency',
        title: 'Inconsistent Activity Pattern',
        description: 'Your activity patterns are quite inconsistent. Regular activity often leads to better results.',
        impactLevel: 'high',
        actionableRecommendation: 'Try to establish a routine by engaging with airdrops at similar times each day.'
      });
    }

    // Burst activity insight
    if (activityPattern.burstActivity) {
      insights.push({
        type: 'burst_activity',
        title: 'Burst Activity Pattern',
        description: 'You tend to be very active in short bursts. This can be effective but may miss opportunities.',
        impactLevel: 'medium',
        actionableRecommendation: 'Consider setting up alerts for new airdrops to capitalize on your burst pattern.'
      });
    }

    // Weekend activity insight
    if (activityPattern.weekendActivity > 2) {
      insights.push({
        type: 'weekend_activity',
        title: 'High Weekend Activity',
        description: 'You\'re much more active on weekends. This is great for catching time-sensitive opportunities!',
        impactLevel: 'low',
        actionableRecommendation: 'Keep up the weekend momentum, but consider some weekday activity too.'
      });
    }

    return insights;

  } catch (error) {
    console.error('Error generating activity insights:', error);
    return [];
  }
}

async function getActivityRecommendations(userId: string) {
  try {
    const activityPattern = await db.activityPattern.findUnique({
      where: { userId }
    });

    if (!activityPattern) {
      return [];
    }

    const recommendations = [];

    // Time-based recommendations
    if (activityPattern.preferredTimeSlots && activityPattern.preferredTimeSlots.length > 0) {
      const topTimeSlot = activityPattern.preferredTimeSlots[0];
      recommendations.push({
        type: 'timing',
        title: `Optimal Activity Time: ${topTimeSlot.period}`,
        description: `You're most active during ${topTimeSlot.period}. Schedule important airdrop tasks during this time.`,
        priority: 'high'
      });
    }

    // Session duration recommendations
    if (activityPattern.sessionDuration < 15) {
      recommendations.push({
        type: 'session_optimization',
        title: 'Increase Session Duration',
        description: 'Consider extending your sessions to 15-30 minutes to complete more tasks effectively.',
        priority: 'medium'
      });
    }

    // Consistency recommendations
    if (activityPattern.consistencyScore < 50) {
      recommendations.push({
        type: 'consistency',
        title: 'Build a Routine',
        description: 'Establish a consistent daily routine for airdrop activities to maximize your earnings.',
        priority: 'high'
      });
    }

    // Task completion recommendations
    if (activityPattern.tasksPerSession < 2) {
      recommendations.push({
        type: 'productivity',
        title: 'Focus on Task Completion',
        description: 'Aim to complete at least 2-3 tasks per session for better results.',
        priority: 'medium'
      });
    }

    return recommendations;

  } catch (error) {
    console.error('Error generating activity recommendations:', error);
    return [];
  }
}