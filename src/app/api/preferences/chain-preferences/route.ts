import { NextRequest, NextResponse } from 'next/server';
import { ChainPreferenceAnalyzer } from '@/lib/chain-preference';

const chainAnalyzer = new ChainPreferenceAnalyzer();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Analyze chain preferences
    const preferences = await chainAnalyzer.analyzeChainPreferences(userId);

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error analyzing chain preferences:', error);
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

    // Get existing chain preferences
    const preferences = await chainAnalyzer.getChainPreferences(userId);

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching chain preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}