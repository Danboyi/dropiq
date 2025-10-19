import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/db';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requirePermission, requireMinimumRole } from '@/middleware/auth';
import { generalRateLimiter } from '@/middleware/rateLimiter';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { ZAI } from 'z-ai-web-dev-sdk';

const router = Router();

// Validation schemas
const analyticsQuerySchema = {
  query: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
    metrics: z.string().optional().transform(val => val ? val.split(',') : undefined),
    filters: z.string().optional().transform(val => val ? JSON.parse(val) : undefined)
  })
};

const reportConfigSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    type: z.enum(['user_activity', 'airdrop_performance', 'financial_summary', 'security_overview', 'custom']),
    parameters: z.object({
      metrics: z.array(z.string()),
      filters: z.object({}).optional(),
      granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
      dateRange: z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime()
      })
    }),
    schedule: z.object({
      enabled: z.boolean().default(false),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      recipients: z.array(z.string().email()).optional()
    }).optional()
  })
};

// Get platform overview analytics (admin/moderator only)
router.get('/overview',
  authenticateToken,
  requireMinimumRole('MODERATOR'),
  validateRequest(analyticsQuerySchema),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const { startDate, endDate, granularity, metrics, filters } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Default metrics if not specified
    const requestedMetrics = metrics || [
      'users', 'airdrops', 'participations', 'wallets', 'scam_reports', 'revenue'
    ];

    const analytics: any = {
      period: { startDate: start, endDate: end, granularity },
      metrics: {}
    };

    // User metrics
    if (requestedMetrics.includes('users')) {
      const [totalUsers, newUsers, activeUsers] = await Promise.all([
        db.user.count({
          where: {
            createdAt: { gte: start, lte: end },
            deletedAt: null
          }
        }),
        db.user.count({
          where: {
            createdAt: { gte: start, lte: end },
            deletedAt: null
          }
        }),
        db.user.count({
          where: {
            lastLoginAt: { gte: start },
            deletedAt: null
          }
        })
      ]);

      analytics.metrics.users = {
        total: totalUsers,
        new: newUsers,
        active: activeUsers
      };
    }

    // Airdrop metrics
    if (requestedMetrics.includes('airdrops')) {
      const [totalAirdrops, activeAirdrops, completedAirdrops] = await Promise.all([
        db.airdrop.count({
          where: {
            createdAt: { gte: start, lte: end },
            deletedAt: null
          }
        }),
        db.airdrop.count({
          where: {
            status: 'ACTIVE',
            deletedAt: null
          }
        }),
        db.airdrop.count({
          where: {
            status: 'COMPLETED',
            deletedAt: null
          }
        })
      ]);

      analytics.metrics.airdrops = {
        total: totalAirdrops,
        active: activeAirdrops,
        completed: completedAirdrops
      };
    }

    // Participation metrics
    if (requestedMetrics.includes('participations')) {
      const participationsByStatus = await db.airdropParticipation.groupBy({
        by: ['status'],
        where: {
          participatedAt: { gte: start, lte: end }
        },
        _count: true
      });

      analytics.metrics.participations = {
        total: participationsByStatus.reduce((sum, stat) => sum + stat._count, 0),
        byStatus: participationsByStatus.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>)
      };
    }

    // Wallet metrics
    if (requestedMetrics.includes('wallets')) {
      const [totalWallets, activeWallets] = await Promise.all([
        db.wallet.count({
          where: {
            createdAt: { gte: start, lte: end }
          }
        }),
        db.wallet.count({
          where: {
            lastAnalyzedAt: { gte: start }
          }
        })
      ]);

      analytics.metrics.wallets = {
        total: totalWallets,
        active: activeWallets
      };
    }

    // Security metrics
    if (requestedMetrics.includes('scam_reports')) {
      const scamReportsByStatus = await db.scamReport.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end },
          deletedAt: null
        },
        _count: true
      });

      analytics.metrics.scam_reports = {
        total: scamReportsByStatus.reduce((sum, stat) => sum + stat._count, 0),
        byStatus: scamReportsByStatus.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>)
      };
    }

    // Revenue metrics (if applicable)
    if (requestedMetrics.includes('revenue')) {
      const shillingRevenue = await db.shillingParticipation.aggregate({
        where: {
          status: 'APPROVED',
          reviewedAt: { gte: start, lte: end }
        },
        _sum: { earnings: true }
      });

      analytics.metrics.revenue = {
        total: shillingRevenue._sum.earnings || 0
      };
    }

    res.json({
      analytics,
      generatedAt: new Date()
    });
  })
);

// Get user analytics (for own data or admin)
router.get('/users/:userId?',
  authenticateToken,
  requirePermission('read:analytics:own'),
  validateRequest({
    params: z.object({
      userId: z.string().uuid().optional()
    }).merge(analyticsQuerySchema.query)
  }),
  asyncHandler(async (req: any, res: any) => {
    const { userId } = req.params;
    const { startDate, endDate, granularity } = req.query;
    const requestedUserId = userId || req.user.id;

    // Check if user can access this data
    if (requestedUserId !== req.user.id && !req.user.permissions.includes('read:analytics:all')) {
      throw new ValidationError('Access denied');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const analytics: any = {
      userId: requestedUserId,
      period: { startDate: start, endDate: end, granularity }
    };

    // User's airdrop participation history
    const participationsByStatus = await db.airdropParticipation.groupBy({
      by: ['status'],
      where: {
        userId: requestedUserId,
        participatedAt: { gte: start, lte: end }
      },
      _count: true
    });

    analytics.airdropParticipations = {
      total: participationsByStatus.reduce((sum, stat) => sum + stat._count, 0),
      byStatus: participationsByStatus.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>)
    };

    // User's wallet analysis trends
    const walletAnalyses = await db.walletAnalysis.findMany({
      where: {
        wallet: {
          userId: requestedUserId
        },
        analyzedAt: { gte: start, lte: end }
      },
      orderBy: { analyzedAt: 'asc' },
      select: {
        totalValue: true,
        tokenCount: true,
        riskScore: true,
        analyzedAt: true
      }
    });

    analytics.walletTrends = {
      analyses: walletAnalyses,
      currentValue: walletAnalyses[walletAnalyses.length - 1]?.totalValue || 0,
      averageRiskScore: walletAnalyses.reduce((sum, a) => sum + a.riskScore, 0) / (walletAnalyses.length || 1)
    };

    // User's shilling performance
    const shillingStats = await db.shillingParticipation.aggregate({
      where: {
        userId: requestedUserId,
        participatedAt: { gte: start, lte: end }
      },
      _count: { id: true },
      _sum: { earnings: true },
      _avg: { earnings: true }
    });

    analytics.shillingPerformance = {
      participations: shillingStats._count.id,
      totalEarnings: shillingStats._sum.earnings || 0,
      averageEarnings: shillingStats._avg.earnings || 0
    };

    res.json({
      analytics,
      generatedAt: new Date()
    });
  })
);

// Get airdrop performance analytics
router.get('/airdrops/:id?',
  authenticateToken,
  requirePermission('read:analytics'),
  validateRequest({
    params: z.object({
      id: z.string().uuid().optional()
    }).merge(analyticsQuerySchema.query)
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { startDate, endDate, granularity } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    let analytics: any = {
      period: { startDate: start, endDate: end, granularity }
    };

    if (id) {
      // Specific airdrop analytics
      const airdrop = await db.airdrop.findUnique({
        where: { id },
        include: {
          participations: {
            where: {
              participatedAt: { gte: start, lte: end }
            },
            _count: true
          },
          project: {
            select: {
              name: true,
              chain: true
            }
          }
        }
      });

      if (!airdrop) {
        throw new NotFoundError('Airdrop not found');
      }

      analytics = {
        ...analytics,
        airdropId: id,
        airdropTitle: airdrop.title,
        project: airdrop.project
      };

      // Participation trends over time
      const participationTrends = await db.airdropParticipation.findMany({
        where: {
          airdropId: id,
          participatedAt: { gte: start, lte: end }
        },
        select: {
          participatedAt: true,
          status: true
        },
        orderBy: { participatedAt: 'asc' }
      });

      analytics.participationTrends = participationTrends;

    } else {
      // Overall airdrop analytics
      const airdropsByStatus = await db.airdrop.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end },
          deletedAt: null
        },
        _count: true,
        _sum: { totalAmount: true }
      });

      analytics.overview = {
        total: airdropsByStatus.reduce((sum, stat) => sum + stat._count, 0),
        totalValue: airdropsByStatus.reduce((sum, stat) => sum + (stat._sum.totalAmount || 0), 0),
        byStatus: airdropsByStatus.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat._count,
            totalValue: stat._sum.totalAmount || 0
          };
          return acc;
        }, {} as Record<string, any>)
      };

      // Top performing airdrops
      const topAirdrops = await db.airdrop.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          deletedAt: null
        },
        include: {
          project: {
            select: {
              name: true,
              logo: true
            }
          },
          _count: {
            select: {
              participations: true
            }
          }
        },
        orderBy: {
          participationCount: 'desc'
        },
        take: 10
      });

      analytics.topAirdrops = topAirdrops;
    }

    res.json({
      analytics,
      generatedAt: new Date()
    });
  })
);

// Generate AI-powered insights
router.post('/insights',
  authenticateToken,
  requirePermission('read:analytics'),
  validateRequest({
    body: z.object({
      type: z.enum(['platform_health', 'user_behavior', 'market_trends', 'security_risks']),
      timeframe: z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime()
      }),
      focus: z.string().optional()
    })
  }),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const { type, timeframe, focus } = req.body;

    try {
      // Initialize ZAI SDK
      const zai = await ZAI.create();

      // Get relevant data based on type
      let dataPrompt = '';
      
      switch (type) {
        case 'platform_health':
          const [userStats, airdropStats, participationStats] = await Promise.all([
            db.user.count({ where: { deletedAt: null } }),
            db.airdrop.count({ where: { deletedAt: null } }),
            db.airdropParticipation.count()
          ]);
          dataPrompt = `Platform Health Data:
          - Total Users: ${userStats}
          - Total Airdrops: ${airdropStats}
          - Total Participations: ${participationStats}
          - Timeframe: ${timeframe.startDate} to ${timeframe.endDate}`;
          break;

        case 'user_behavior':
          const recentParticipations = await db.airdropParticipation.findMany({
            where: {
              participatedAt: {
                gte: new Date(timeframe.startDate),
                lte: new Date(timeframe.endDate)
              }
            },
            take: 100,
            include: {
              user: {
                select: {
                  role: true,
                  createdAt: true
                }
              }
            }
          });
          dataPrompt = `User Behavior Data:
          - Recent Participations: ${recentParticipations.length}
          - User roles distribution: ${JSON.stringify(recentParticipations.reduce((acc, p) => {
            acc[p.user.role] = (acc[p.user.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>))}`;
          break;

        case 'market_trends':
          const activeAirdrops = await db.airdrop.findMany({
            where: {
              status: 'ACTIVE',
              deletedAt: null
            },
            include: {
              project: {
                select: {
                  chain: true
                }
              },
              _count: {
                select: {
                  participations: true
                }
              }
            },
            take: 50
          });
          dataPrompt = `Market Trends Data:
          - Active Airdrops: ${activeAirdrops.length}
          - Chain distribution: ${JSON.stringify(activeAirdrops.reduce((acc, a) => {
            acc[a.project.chain] = (acc[a.project.chain] || 0) + 1;
            return acc;
          }, {} as Record<string, number>))}
          - Average participation: ${activeAirdrops.reduce((sum, a) => sum + a._count.participations, 0) / (activeAirdrops.length || 1)}`;
          break;

        case 'security_risks':
          const scamReports = await db.scamReport.findMany({
            where: {
              createdAt: {
                gte: new Date(timeframe.startDate),
                lte: new Date(timeframe.endDate)
              },
              deletedAt: null
            },
            take: 50
          });
          dataPrompt = `Security Risks Data:
          - Scam Reports: ${scamReports.length}
          - Severity distribution: ${JSON.stringify(scamReports.reduce((acc, r) => {
            acc[r.severity] = (acc[r.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>))}`;
          break;
      }

      const insightPrompt = `
        Analyze this ${type.replace('_', ' ')} data and provide actionable insights:
        
        ${dataPrompt}
        
        ${focus ? `Focus area: ${focus}` : ''}
        
        Please provide:
        1. Key trends and patterns
        2. Potential opportunities
        3. Risk factors or concerns
        4. Recommendations for improvement
        5. Predictions for the next period
        
        Format as JSON:
        {
          "summary": string,
          "keyTrends": [string],
          "opportunities": [string],
          "risks": [string],
          "recommendations": [string],
          "predictions": [string],
          "metrics": {
            "healthScore": number (0-100),
            "growthRate": number,
            "riskLevel": "LOW" | "MEDIUM" | "HIGH"
          }
        }
      `;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst specializing in cryptocurrency and airdrop platforms. Provide detailed, actionable insights in JSON format.'
          },
          {
            role: 'user',
            content: insightPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const insights = JSON.parse(completion.choices[0].message.content || '{}');

      logger.info('Analytics insights generated', {
        userId: req.user.id,
        type,
        timeframe,
        focus
      });

      res.json({
        insights,
        generatedAt: new Date(),
        type,
        timeframe
      });

    } catch (error) {
      logger.error('Failed to generate insights', {
        userId: req.user.id,
        type,
        error: error.message
      });

      throw new ValidationError('Failed to generate insights. Please try again later.');
    }
  })
);

// Create scheduled report
router.post('/reports',
  authenticateToken,
  requirePermission('create:reports'),
  validateRequest(reportConfigSchema),
  asyncHandler(async (req: any, res: any) => {
    const reportData = req.body;
    const userId = req.user.id;

    const report = await db.analyticsReport.create({
      data: {
        ...reportData,
        createdBy: userId,
        isActive: true,
        lastGeneratedAt: null
      }
    });

    logger.info('Analytics report created', {
      reportId: report.id,
      userId,
      type: reportData.type
    });

    res.status(201).json({
      message: 'Report created successfully',
      report
    });
  })
);

// Get user's reports
router.get('/reports',
  authenticateToken,
  requirePermission('read:reports'),
  validateRequest(commonSchemas.pagination),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    const [reports, total] = await Promise.all([
      db.analyticsReport.findMany({
        where: {
          createdBy: userId
        },
        include: {
          _count: {
            select: {
              generations: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.analyticsReport.count({
        where: {
          createdBy: userId
        }
      })
    ]);

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Generate report on demand
router.post('/reports/:id/generate',
  authenticateToken,
  requirePermission('read:reports'),
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if report exists and belongs to user
    const report = await db.analyticsReport.findFirst({
      where: {
        id,
        createdBy: userId,
        isActive: true
      }
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Generate report data based on configuration
    const reportData = await generateReportData(report.parameters);

    // Save report generation
    const generation = await db.reportGeneration.create({
      data: {
        reportId: id,
        data: reportData,
        generatedAt: new Date(),
        status: 'COMPLETED'
      }
    });

    // Update last generated timestamp
    await db.analyticsReport.update({
      where: { id },
      data: {
        lastGeneratedAt: new Date()
      }
    });

    logger.info('Report generated', {
      reportId: id,
      userId,
      generationId: generation.id
    });

    res.json({
      message: 'Report generated successfully',
      reportData,
      generatedAt: generation.generatedAt
    });
  })
);

// Helper function to generate report data
async function generateReportData(parameters: any) {
  const { metrics, filters, granularity, dateRange } = parameters;
  const { startDate, endDate } = dateRange;

  const data: any = {
    parameters,
    generatedAt: new Date(),
    data: {}
  };

  // Generate data for each requested metric
  for (const metric of metrics) {
    switch (metric) {
      case 'user_growth':
        data.data.user_growth = await getUserGrowthData(startDate, endDate, granularity);
        break;
      case 'airdrop_performance':
        data.data.airdrop_performance = await getAirdropPerformanceData(startDate, endDate, granularity);
        break;
      case 'participation_trends':
        data.data.participation_trends = await getParticipationTrendsData(startDate, endDate, granularity);
        break;
      case 'revenue_summary':
        data.data.revenue_summary = await getRevenueSummaryData(startDate, endDate, granularity);
        break;
      // Add more metric handlers as needed
    }
  }

  return data;
}

// Helper functions for data generation
async function getUserGrowthData(startDate: string, endDate: string, granularity: string) {
  // Implementation for user growth data
  return {
    totalUsers: 0,
    newUsers: 0,
    growthRate: 0,
    timeline: []
  };
}

async function getAirdropPerformanceData(startDate: string, endDate: string, granularity: string) {
  // Implementation for airdrop performance data
  return {
    totalAirdrops: 0,
    activeAirdrops: 0,
    totalValue: 0,
    performance: []
  };
}

async function getParticipationTrendsData(startDate: string, endDate: string, granularity: string) {
  // Implementation for participation trends data
  return {
    totalParticipations: 0,
    successRate: 0,
    trends: []
  };
}

async function getRevenueSummaryData(startDate: string, endDate: string, granularity: string) {
  // Implementation for revenue summary data
  return {
    totalRevenue: 0,
    revenueStreams: {},
    trends: []
  };
}

export default router;