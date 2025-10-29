import { NextRequest, NextResponse } from 'next/server';
import { ActivityPatternAnalyzer } from '@/lib/activity-pattern';

const activityAnalyzer = new ActivityPatternAnalyzer();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Analyze activity patterns
    const pattern = await activityAnalyzer.analyzeActivityPatterns(userId);

    return NextResponse.json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error analyzing activity patterns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get existing activity pattern
    const pattern = await activityAnalyzer.getActivityPattern(userId);

    if (!pattern) {
      return NextResponse.json(
        { error: 'No activity pattern found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error fetching activity pattern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}