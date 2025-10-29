import { NextRequest, NextResponse } from 'next/server';
import { StrategyService } from '@/lib/services/strategy-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategy = await StrategyService.getStrategy(params.id);
    
    if (!strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategy' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { authorId, ...updateData } = body;
    
    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }

    const strategy = await StrategyService.updateStrategy(params.id, authorId, updateData);
    
    return NextResponse.json({
      success: true,
      data: strategy
    });
  } catch (error: any) {
    console.error('Error updating strategy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update strategy' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    
    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }

    await StrategyService.deleteStrategy(params.id, authorId);
    
    return NextResponse.json({
      success: true,
      message: 'Strategy deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete strategy' },
      { status: 500 }
    );
  }
}