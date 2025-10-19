import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get user privacy settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let privacySettings = await db.dataPrivacySettings.findUnique({
      where: { userId }
    });

    // Create default settings if none exist
    if (!privacySettings) {
      privacySettings = await db.dataPrivacySettings.create({
        data: {
          userId,
          analyticsConsent: true,
          behaviorTracking: true,
          personalization: true,
          dataSharing: false,
          thirdPartyTracking: false,
          cookiesConsent: true,
          retentionPeriod: 365,
          anonymizationLevel: 'partial'
        }
      });
    }

    return NextResponse.json({ privacySettings });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

// Update privacy settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      analyticsConsent,
      behaviorTracking,
      personalization,
      dataSharing,
      thirdPartyTracking,
      cookiesConsent,
      retentionPeriod,
      anonymizationLevel,
      dataDeletionRequested
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Update privacy settings
    const privacySettings = await db.dataPrivacySettings.upsert({
      where: { userId },
      update: {
        analyticsConsent,
        behaviorTracking,
        personalization,
        dataSharing,
        thirdPartyTracking,
        cookiesConsent,
        retentionPeriod,
        anonymizationLevel,
        dataDeletionRequested,
        dataDeletionAt: dataDeletionRequested ? new Date() : null,
        privacyVersion: '1.1'
      },
      create: {
        userId,
        analyticsConsent: analyticsConsent ?? true,
        behaviorTracking: behaviorTracking ?? true,
        personalization: personalization ?? true,
        dataSharing: dataSharing ?? false,
        thirdPartyTracking: thirdPartyTracking ?? false,
        cookiesConsent: cookiesConsent ?? true,
        retentionPeriod: retentionPeriod ?? 365,
        anonymizationLevel: anonymizationLevel ?? 'partial',
        dataDeletionRequested: dataDeletionRequested ?? false,
        dataDeletionAt: dataDeletionRequested ? new Date() : null
      }
    });

    // If user revoked consent, anonymize existing data
    if (analyticsConsent === false || behaviorTracking === false) {
      await anonymizeUserData(userId, anonymizationLevel || 'partial');
    }

    // If user requested data deletion, schedule deletion
    if (dataDeletionRequested) {
      await scheduleDataDeletion(userId);
    }

    return NextResponse.json({
      success: true,
      privacySettings,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}

// Export user data (GDPR compliance)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Collect all user data
    const userData = await collectAllUserData(userId);

    // Create export record
    const exportRecord = await db.analyticsReport.create({
      data: {
        userId,
        reportType: 'data_export',
        title: 'User Data Export',
        description: 'Complete export of user data as requested',
        reportData: userData,
        format: 'json',
        status: 'ready',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return NextResponse.json({
      success: true,
      exportId: exportRecord.id,
      data: userData,
      message: 'User data exported successfully'
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

// Delete user data (GDPR compliance)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const confirmed = searchParams.get('confirmed') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!confirmed) {
      return NextResponse.json(
        { error: 'Deletion must be confirmed' },
        { status: 400 }
      );
    }

    // Perform data deletion
    await deleteUserData(userId);

    return NextResponse.json({
      success: true,
      message: 'User data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}

// Anonymize user data based on privacy level
async function anonymizeUserData(userId: string, level: string) {
  try {
    switch (level) {
      case 'partial':
        // Remove personally identifiable information but keep analytics data
        await db.user.update({
          where: { id: userId },
          data: {
            email: null,
            username: null,
            displayName: `User_${userId.slice(0, 8)}`,
            walletAddress: null,
            bio: null,
            avatar: null
          }
        });

        // Anonymize behavior data
        await db.userBehavior.updateMany({
          where: { userId },
          data: {
            userId: `anon_${userId.slice(0, 8)}`,
            ipAddress: null,
            userAgent: null,
            geolocation: null
          }
        });

        // Anonymize recommendations
        await db.personalizedRecommendation.updateMany({
          where: { userId },
          data: {
            userId: `anon_${userId.slice(0, 8)}`
          }
        });

        break;

      case 'full':
        // Complete anonymization - replace user ID with random hash
        const anonymousId = `anon_${Math.random().toString(36).substring(2, 15)}`;

        await db.userBehavior.updateMany({
          where: { userId },
          data: {
            userId: anonymousId,
            ipAddress: null,
            userAgent: null,
            geolocation: null,
            sessionId: null
          }
        });

        await db.personalizedRecommendation.updateMany({
          where: { userId },
          data: {
            userId: anonymousId
          }
        });

        await db.userPortfolio.updateMany({
          where: { userId },
          data: {
            userId: anonymousId
          }
        });

        await db.userPreferences.updateMany({
          where: { userId },
          data: {
            userId: anonymousId
          }
        });

        await db.dataPrivacySettings.updateMany({
          where: { userId },
          data: {
            userId: anonymousId
          }
        });

        break;
    }
  } catch (error) {
    console.error('Error anonymizing user data:', error);
    throw error;
  }
}

// Schedule data deletion
async function scheduleDataDeletion(userId: string) {
  try {
    // Set deletion date for 30 days from now (grace period)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await db.dataPrivacySettings.update({
      where: { userId },
      data: {
        dataDeletionAt: deletionDate
      }
    });

    // In a real implementation, this would trigger a background job
    console.log(`Data deletion scheduled for user ${userId} on ${deletionDate}`);
  } catch (error) {
    console.error('Error scheduling data deletion:', error);
    throw error;
  }
}

// Collect all user data for export
async function collectAllUserData(userId: string) {
  try {
    const userData: any = {};

    // Basic user information
    userData.user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        walletAddress: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Privacy settings
    userData.privacySettings = await db.dataPrivacySettings.findUnique({
      where: { userId }
    });

    // User preferences
    userData.preferences = await db.userPreferences.findUnique({
      where: { userId }
    });

    // User behavior data
    userData.behavior = await db.userBehavior.findMany({
      where: { userId },
      select: {
        id: true,
        eventType: true,
        eventName: true,
        pageUrl: true,
        pageTitle: true,
        timestamp: true,
        duration: true,
        scrollDepth: true
      },
      orderBy: { timestamp: 'desc' },
      take: 1000 // Limit to last 1000 events
    });

    // Portfolio data
    userData.portfolio = await db.userPortfolio.findUnique({
      where: { userId }
    });

    // Recommendations
    userData.recommendations = await db.personalizedRecommendation.findMany({
      where: { userId },
      select: {
        id: true,
        recommendationType: true,
        title: true,
        description: true,
        score: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Reports
    userData.reports = await db.analyticsReport.findMany({
      where: { userId },
      select: {
        id: true,
        reportType: true,
        title: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Auth sessions (active ones only)
    userData.sessions = await db.authSession.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        role: true,
        lastActiveAt: true,
        ipAddress: true,
        createdAt: true
      }
    });

    return {
      exportedAt: new Date().toISOString(),
      userId,
      data: userData,
      summary: {
        behaviorEvents: userData.behavior.length,
        recommendations: userData.recommendations.length,
        reports: userData.reports.length,
        activeSessions: userData.sessions.length
      }
    };
  } catch (error) {
    console.error('Error collecting user data:', error);
    throw error;
  }
}

// Delete user data completely
async function deleteUserData(userId: string) {
  try {
    // Delete in order to respect foreign key constraints

    // Delete behavior data
    await db.userBehavior.deleteMany({
      where: { userId }
    });

    // Delete recommendations
    await db.personalizedRecommendation.deleteMany({
      where: { userId }
    });

    // Delete portfolio
    await db.userPortfolio.deleteMany({
      where: { userId }
    });

    // Delete preferences
    await db.userPreferences.deleteMany({
      where: { userId }
    });

    // Delete privacy settings
    await db.dataPrivacySettings.deleteMany({
      where: { userId }
    });

    // Delete reports
    await db.analyticsReport.deleteMany({
      where: { userId }
    });

    // Delete auth sessions
    await db.authSession.deleteMany({
      where: { userId }
    });

    // Finally delete the user
    await db.user.delete({
      where: { id: userId }
    });

    console.log(`All data deleted for user ${userId}`);
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}

// Cleanup old data based on retention policies
export async function cleanupOldData() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // 1 year default

    // Get users with custom retention periods
    const privacySettings = await db.dataPrivacySettings.findMany({
      where: {
        retentionPeriod: { not: 365 }
      }
    });

    // Delete behavior data older than retention period
    for (const settings of privacySettings) {
      const userCutoffDate = new Date();
      userCutoffDate.setDate(userCutoffDate.getDate() - settings.retentionPeriod);

      await db.userBehavior.deleteMany({
        where: {
          userId: settings.userId,
          timestamp: {
            lt: userCutoffDate
          }
        }
      });
    }

    // Delete old reports
    await db.analyticsReport.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    // Delete old predictions that are no longer relevant
    const predictionCutoffDate = new Date();
    predictionCutoffDate.setDate(predictionCutoffDate.getDate() - 90); // 3 months

    await db.mLPrediction.deleteMany({
      where: {
        createdAt: {
          lt: predictionCutoffDate
        },
        isTrainingData: false
      }
    });

    console.log('Old data cleanup completed');
  } catch (error) {
    console.error('Error during data cleanup:', error);
  }
}