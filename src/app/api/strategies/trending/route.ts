import { NextRequest, NextResponse } from 'next/server';
import { StrategyService } from '@/lib/services/strategy-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const strategies = await StrategyService.getTrendingStrategies(limit);
    
    return NextResponse.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    console.error('Error fetching trending strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending strategies' },
      { status: 500 }
    );
  }
}