import { NextRequest, NextResponse } from 'next/server';
import { StrategyService } from '@/lib/services/strategy-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filter = {
      category: searchParams.get('category') as any || undefined,
      difficulty: searchParams.get('difficulty') as any || undefined,
      riskLevel: searchParams.get('riskLevel') as any || undefined,
      isPublic: searchParams.get('isPublic') === 'true' ? true : 
                searchParams.get('isPublic') === 'false' ? false : undefined,
      isVerified: searchParams.get('isVerified') === 'true' ? true : 
                  searchParams.get('isVerified') === 'false' ? false : undefined,
      authorId: searchParams.get('authorId') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as any || undefined,
      sortOrder: searchParams.get('sortOrder') as any || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };
    
    const result = await StrategyService.getStrategies(filter);
    
    return NextResponse.json({
      success: true,
      data: result.strategies,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorId, ...strategyData } = body;
    
    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }

    const strategy = await StrategyService.createStrategy(authorId, strategyData);
    
    return NextResponse.json({
      success: true,
      data: strategy
    });
  } catch (error: any) {
    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create strategy' },
      { status: 500 }
    );
  }
}