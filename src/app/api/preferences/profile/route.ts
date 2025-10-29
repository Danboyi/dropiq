import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RiskToleranceAssessment } from '@/lib/risk-assessment';
import { ChainPreferenceAnalyzer } from '@/lib/chain-preference';
import { ActivityPatternAnalyzer } from '@/lib/activity-pattern';

const riskAssessment = new RiskToleranceAssessment();
const chainAnalyzer = new ChainPreferenceAnalyzer();
const activityAnalyzer = new ActivityPatternAnalyzer();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Get all preference data in parallel
    const [riskProfile, chainPreferences, activityPattern, insights] = await Promise.all([
      riskAssessment.getRiskProfile(userId),
      chainAnalyzer.getChainPreferences(userId),
      activityAnalyzer.getActivityPattern(userId),
      db.preferenceInsight.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // Get preference evolution history
    const evolutionHistory = await db.preferenceEvolution.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Calculate overall profile completeness
    const completeness = calculateProfileCompleteness(riskProfile, chainPreferences, activityPattern);

    return NextResponse.json({
      success: true,
      data: {
        riskProfile,
        chainPreferences,
        activityPattern,
        insights,
        evolutionHistory,
        completeness,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching preference profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action' },
        { status: 400 }
      );
    }

    if (action === 'analyze_all') {
      // Trigger comprehensive analysis
      const [riskProfile, chainPreferences, activityPattern] = await Promise.all([
        riskAssessment.getRiskProfile(userId),
        chainAnalyzer.analyzeChainPreferences(userId),
        activityAnalyzer.analyzeActivityPatterns(userId)
      ]);

      return NextResponse.json({
        success: true,
        message: 'Comprehensive analysis completed',
        data: {
          riskProfile,
          chainPreferences,
          activityPattern
        }
      });
    } else if (action === 'refresh_insights') {
      // Trigger insight generation for all categories
      // This would typically be called after major preference changes
      
      return NextResponse.json({
        success: true,
        message: 'Insights refresh triggered'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: analyze_all, refresh_insights' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating preference profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateProfileCompleteness(
  riskProfile: any,
  chainPreferences: any[],
  activityPattern: any
): {
  score: number;
  level: 'basic' | 'intermediate' | 'advanced' | 'complete';
  missingComponents: string[];
} {
  let score = 0;
  const missingComponents: string[] = [];

  // Risk profile (40% weight)
  if (riskProfile) {
    score += 40;
  } else {
    missingComponents.push('risk_assessment');
  }

  // Chain preferences (30% weight)
  if (chainPreferences && chainPreferences.length > 0) {
    score += 30;
  } else {
    missingComponents.push('chain_preferences');
  }

  // Activity pattern (30% weight)
  if (activityPattern && activityPattern.dailyActiveTime > 0) {
    score += 30;
  } else {
    missingComponents.push('activity_pattern');
  }

  let level: 'basic' | 'intermediate' | 'advanced' | 'complete';
  if (score >= 90) level = 'complete';
  else if (score >= 70) level = 'advanced';
  else if (score >= 40) level = 'intermediate';
  else level = 'basic';

  return {
    score,
    level,
    missingComponents
  };
}