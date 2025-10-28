import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware/authenticateToken';
import { getServer } from '@/lib/socket';

interface BroadcastAlertRequest {
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  affectedPlatforms?: string[];
  recommendedActions?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request - only admins can broadcast alerts
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body: BroadcastAlertRequest = await request.json();
    const { type, title, message, affectedPlatforms, recommendedActions } = body;

    // Validate input
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      );
    }

    if (!['critical', 'high', 'medium', 'low'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      );
    }

    // Get Socket.IO server instance
    const io = getServer();
    if (!io) {
      return NextResponse.json(
        { error: 'Socket.IO server not available' },
        { status: 500 }
      );
    }

    // Import the broadcast function
    const { broadcastSecurityAlert } = await import('@/lib/socket');

    // Broadcast the alert
    broadcastSecurityAlert(io, {
      type,
      title,
      message,
      affectedPlatforms,
      recommendedActions
    });

    return NextResponse.json({
      success: true,
      message: 'Security alert broadcasted successfully',
      alert: {
        type,
        title,
        message,
        affectedPlatforms,
        recommendedActions
      }
    });

  } catch (error) {
    console.error('Broadcast alert error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to broadcast alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}