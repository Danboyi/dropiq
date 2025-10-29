import { NextRequest, NextResponse } from 'next/server';
import { StrategyService } from '@/lib/services/strategy-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await StrategyService.likeStrategy(params.id, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Strategy liked successfully'
    });
  } catch (error) {
    console.error('Error liking strategy:', error);
    return NextResponse.json(
      { error: 'Failed to like strategy' },
      { status: 500 }
    );
  }
}