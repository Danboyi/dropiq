import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    const where: any = {
      OR: [
        { targetAudience: 'all_users' },
        { userIds: { contains: userId || '' } }
      ]
    };

    if (severity) where.severity = severity;
    if (status) where.status = status;

    // Filter out expired alerts
    where.OR = [
      ...where.OR,
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];

    const alerts = await db.securityAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedAlerts = alerts.map(alert => ({
      ...alert,
      userIds: JSON.parse(alert.userIds || '[]'),
      acknowledgedBy: JSON.parse(alert.acknowledgedBy || '[]'),
      dismissedBy: JSON.parse(alert.dismissedBy || '[]')
    }));

    return NextResponse.json({
      success: true,
      data: formattedAlerts
    });

  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, userId, action } = body;

    if (!alertId || !userId || !action) {
      return NextResponse.json(
        { error: 'Alert ID, user ID, and action are required' },
        { status: 400 }
      );
    }

    if (!['acknowledge', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const alert = await db.securityAlert.findUnique({
      where: { id: alertId }
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const currentArray = action === 'acknowledge' 
      ? JSON.parse(alert.acknowledgedBy || '[]')
      : JSON.parse(alert.dismissedBy || '[]');

    if (!currentArray.includes(userId)) {
      currentArray.push(userId);
    }

    const updateData = action === 'acknowledge'
      ? { acknowledgedBy: JSON.stringify(currentArray) }
      : { dismissedBy: JSON.stringify(currentArray) };

    const updatedAlert = await db.securityAlert.update({
      where: { id: alertId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAlert,
        userIds: JSON.parse(updatedAlert.userIds || '[]'),
        acknowledgedBy: JSON.parse(updatedAlert.acknowledgedBy || '[]'),
        dismissedBy: JSON.parse(updatedAlert.dismissedBy || '[]')
      }
    });

  } catch (error) {
    console.error('Alert action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}