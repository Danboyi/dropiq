import { NextRequest, NextResponse } from 'next/server';
import { StrategyService } from '@/lib/services/strategy-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, rating, review } = body;
    
    if (!userId || !rating) {
      return NextResponse.json(
        { error: 'User ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const ratingData = await StrategyService.rateStrategy(params.id, userId, rating, review);
    
    return NextResponse.json({
      success: true,
      data: ratingData
    });
  } catch (error) {
    console.error('Error rating strategy:', error);
    return NextResponse.json(
      { error: 'Failed to rate strategy' },
      { status: 500 }
    );
  }
}