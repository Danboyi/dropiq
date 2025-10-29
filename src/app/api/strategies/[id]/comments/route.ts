import { NextRequest, NextResponse } from 'next/server';
import { StrategyService } from '@/lib/services/strategy-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, content } = body;
    
    if (!userId || !content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    const comment = await StrategyService.addComment(params.id, userId, content);
    
    return NextResponse.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}