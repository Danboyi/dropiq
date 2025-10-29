import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const unread = searchParams.get('unread');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Build query
    const where: any = { userId };

    if (type) {
      where.insightType = type;
    }

    if (unread === 'true') {
      where.isRead = false;
    }

    // Get insights
    const insights = await db.preferenceInsight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, insightId } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action' },
        { status: 400 }
      );
    }

    if (action === 'mark_read') {
      if (!insightId) {
        return NextResponse.json(
          { error: 'Missing required field: insightId for mark_read action' },
          { status: 400 }
        );
      }

      // Mark specific insight as read
      await db.preferenceInsight.update({
        where: { 
          id: insightId,
          userId // Ensure user can only mark their own insights
        },
        data: { isRead: true }
      });

      return NextResponse.json({
        success: true,
        message: 'Insight marked as read'
      });
    } else if (action === 'mark_all_read') {
      // Mark all insights as read
      await db.preferenceInsight.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      return NextResponse.json({
        success: true,
        message: 'All insights marked as read'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: mark_read, mark_all_read' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}