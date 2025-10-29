import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-123'; // TODO: Get from auth session

    // Fetch strategies that were copied by the user
    const copiedStrategies = await db.strategy.findMany({
      where: {
        authorId: userId,
        tags: {
          has: 'copy'
        },
        isPublic: false, // Copied strategies are private by default
      },
      include: {
        author: true,
        ratings: true,
        comments: true,
        tips: true,
        requirements: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedStrategies = copiedStrategies.map(strategy => ({
      ...strategy,
      metrics: {
        views: strategy.metrics?.views || 0,
        likes: strategy.metrics?.likes || 0,
        shares: strategy.metrics?.shares || 0,
        copies: strategy.metrics?.copies || 0,
        successRate: strategy.metrics?.successRate || 0,
      },
    }));

    return NextResponse.json({
      data: formattedStrategies,
      total: formattedStrategies.length,
    });

  } catch (error) {
    console.error('Error fetching copied strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch copied strategies' },
      { status: 500 }
    );
  }
}