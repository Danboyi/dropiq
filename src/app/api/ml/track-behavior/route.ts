import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mlInfrastructure } from '@/lib/ml/infrastructure';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventType, eventName, eventData, sessionId, duration } = body;

    // Validate input
    if (!eventType || !eventName) {
      return NextResponse.json(
        { error: 'eventType and eventName are required' },
        { status: 400 }
      );
    }

    // Track user behavior
    await mlInfrastructure.trackUserBehavior(session.user.id, {
      eventType,
      eventName,
      eventData,
      sessionId,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
      duration,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Behavior tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}