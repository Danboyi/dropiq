import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidentResponseSystem } from '@/lib/security/incident-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' | 'year' || 'month';

    // Get incident metrics
    const incidentMetrics = await incidentResponseSystem.getIncidentMetrics(timeframe);

    // Get active alerts count
    const activeAlerts = await db.securityAlert.count({
      where: {
        status: 'active',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    // Get recent incidents
    const recentIncidents = await db.securityIncident.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        incidentType: true,
        severity: true,
        title: true,
        status: true,
        createdAt: true,
        affectedUsers: true,
        estimatedLoss: true
      }
    });

    // Get scam reports count
    const scamReports = await db.scamReport.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Get drainer detections count
    const drainerDetections = await db.drainerDetection.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        },
        status: 'confirmed'
      }
    });

    // Get phishing detections count
    const phishingDetections = await db.phishingDetection.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        },
        status: 'confirmed'
      }
    });

    // Get blacklist entries count
    const blacklistEntries = await db.blacklistEntry.count({
      where: {
        status: 'active'
      }
    });

    // Calculate security score (mock calculation)
    const totalThreats = scamReports + drainerDetections + phishingDetections;
    const securityScore = Math.max(0, Math.min(100, 100 - (totalThreats * 2)));

    const homeData = {
      overview: {
        securityScore,
        activeAlerts,
        totalIncidents: incidentMetrics.totalIncidents,
        openIncidents: incidentMetrics.openIncidents,
        resolvedIncidents: incidentMetrics.resolvedIncidents
      },
      threats: {
        scamReports,
        drainerDetections,
        phishingDetections,
        blacklistEntries
      },
      impact: {
        affectedUsers: incidentMetrics.affectedUsers,
        estimatedLosses: incidentMetrics.estimatedLosses,
        averageResolutionTime: incidentMetrics.averageResolutionTime
      },
      incidents: {
        metrics: incidentMetrics,
        recent: recentIncidents
      },
      trends: incidentMetrics.trends
    };

    return NextResponse.json({
      success: true,
      data: homeData
    });

  } catch (error) {
    console.error('Home data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}