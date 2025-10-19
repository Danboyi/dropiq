import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/db';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requirePermission, optionalAuth } from '@/middleware/auth';
import { generalRateLimiter, sensitiveOperationRateLimiter } from '@/middleware/rateLimiter';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { ShillingStatus, ShillingType, ParticipationStatus } from '@prisma/client';

const router = Router();

// Validation schemas
const createShillingSchema = {
  body: z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    type: z.nativeEnum(ShillingType),
    targetPlatforms: z.array(z.string()).min(1),
    requirements: z.array(z.string()).min(1),
    rewardPerAction: z.number().positive(),
    maxParticipants: z.number().positive(),
    budget: z.number().positive(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    verificationRequirements: z.object({
      minFollowers: z.number().optional(),
      accountAge: z.number().optional(),
      verificationRequired: z.boolean().default(false)
    }).optional(),
    contentGuidelines: z.array(z.string()).optional(),
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional()
  })
};

const participateShillingSchema = {
  body: z.object({
    platform: z.string().min(1),
    content: z.string().min(1).max(1000),
    proofUrl: z.string().url().optional(),
    screenshots: z.array(z.string().url()).optional(),
    additionalInfo: z.string().max(500).optional()
  })
};

const shillingQuerySchema = {
  query: z.object({
    status: z.nativeEnum(ShillingStatus).optional(),
    type: z.nativeEnum(ShillingType).optional(),
    platform: z.string().optional(),
    minReward: z.string().transform(Number).optional(),
    maxReward: z.string().transform(Number).optional(),
    projectId: z.string().uuid().optional(),
    search: z.string().optional(),
    active: z.string().transform(val => val === 'true').optional(),
    endingSoon: z.string().transform(val => val === 'true').optional()
  }).merge(commonSchemas.pagination.query)
};

// Get all shilling campaigns (public endpoint)
router.get('/',
  optionalAuth,
  validateRequest(shillingQuerySchema),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const {
      status,
      type,
      platform,
      minReward,
      maxReward,
      projectId,
      search,
      active,
      endingSoon,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const userId = req.user?.id;

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (minReward || maxReward) {
      where.rewardPerAction = {};
      if (minReward) where.rewardPerAction.gte = minReward;
      if (maxReward) where.rewardPerAction.lte = maxReward;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { project: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (active) {
      where.status = ShillingStatus.ACTIVE;
      where.startDate = { lte: new Date() };
      where.endDate = { gte: new Date() };
    }
    if (endingSoon) {
      where.endDate = {
        lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Next 3 days
      };
    }
    if (platform) {
      where.targetPlatforms = {
        has: platform
      };
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'reward') {
      orderBy.rewardPerAction = sortOrder;
    } else if (sortBy === 'participants') {
      orderBy.participationCount = sortOrder;
    } else if (sortBy === 'endDate') {
      orderBy.endDate = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute query
    const [shillingCampaigns, total] = await Promise.all([
      db.shillingCampaign.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              logo: true,
              chain: true,
              isVerified: true
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              participations: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      db.shillingCampaign.count({ where })
    ]);

    // Add user participation status if authenticated
    let campaignsWithUserStatus = shillingCampaigns;
    if (userId) {
      const userParticipations = await db.shillingParticipation.findMany({
        where: {
          userId,
          campaignId: { in: shillingCampaigns.map(c => c.id) }
        },
        select: {
          campaignId: true,
          status: true,
          participatedAt: true,
          earnings: true
        }
      });

      const participationMap = userParticipations.reduce((acc, p) => {
        acc[p.campaignId] = p;
        return acc;
      }, {} as Record<string, any>);

      campaignsWithUserStatus = shillingCampaigns.map(campaign => ({
        ...campaign,
        userParticipation: participationMap[campaign.id] || null
      }));
    }

    res.json({
      campaigns: campaignsWithUserStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Get shilling campaign by ID
router.get('/:id',
  optionalAuth,
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const campaign = await db.shillingCampaign.findUnique({
      where: {
        id,
        deletedAt: null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            website: true,
            twitter: true,
            chain: true,
            isVerified: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            reputation: true
          }
        },
        participations: {
          where: {
            status: ParticipationStatus.APPROVED
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: {
            participatedAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            participations: true
          }
        }
      }
    });

    if (!campaign) {
      throw new NotFoundError('Shilling campaign not found');
    }

    // Add user participation status if authenticated
    let userParticipation = null;
    if (userId) {
      userParticipation = await db.shillingParticipation.findUnique({
        where: {
          userId_campaignId: {
            userId,
            campaignId: id
          }
        },
        select: {
          id: true,
          status: true,
          participatedAt: true,
          earnings: true,
          platform: true,
          content: true,
          proofUrl: true,
          feedback: true
        }
      });
    }

    res.json({
      campaign: {
        ...campaign,
        userParticipation
      }
    });
  })
);

// Create new shilling campaign
router.post('/',
  authenticateToken,
  requirePermission('create:shilling'),
  validateRequest(createShillingSchema),
  sensitiveOperationRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const campaignData = req.body;
    const userId = req.user.id;

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: campaignData.projectId }
    });

    if (!project) {
      throw new ValidationError('Project not found');
    }

    // Check user's reputation for creating campaigns
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { reputation: true }
    });

    if (!user || user.reputation < 50) {
      throw new ValidationError('Insufficient reputation to create shilling campaigns');
    }

    // Create campaign
    const campaign = await db.shillingCampaign.create({
      data: {
        ...campaignData,
        creatorId: userId,
        startDate: new Date(campaignData.startDate),
        endDate: new Date(campaignData.endDate),
        status: ShillingStatus.PENDING,
        participationCount: 0,
        remainingBudget: campaignData.budget
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            logo: true,
            chain: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    logger.info('Shilling campaign created', {
      campaignId: campaign.id,
      projectId: campaignData.projectId,
      creatorId: userId,
      budget: campaignData.budget
    });

    res.status(201).json({
      message: 'Shilling campaign created successfully',
      campaign
    });
  })
);

// Participate in shilling campaign
router.post('/:id/participate',
  authenticateToken,
  requirePermission('participate:shilling'),
  validateRequest({
    params: commonSchemas.idParam.params,
    body: participateShillingSchema.body
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { platform, content, proofUrl, screenshots, additionalInfo } = req.body;
    const userId = req.user.id;

    // Check if campaign exists and is active
    const campaign = await db.shillingCampaign.findUnique({
      where: {
        id,
        status: ShillingStatus.ACTIVE,
        deletedAt: null
      }
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found or not active');
    }

    // Check if campaign has ended
    if (campaign.endDate < new Date()) {
      throw new ValidationError('Campaign has ended');
    }

    // Check if platform is supported
    if (!campaign.targetPlatforms.includes(platform)) {
      throw new ValidationError('Platform not supported for this campaign');
    }

    // Check if user has already participated
    const existingParticipation = await db.shillingParticipation.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: id
        }
      }
    });

    if (existingParticipation) {
      throw new ConflictError('You have already participated in this campaign');
    }

    // Check if max participants reached
    if (campaign.participationCount >= campaign.maxParticipants) {
      throw new ValidationError('Campaign has reached maximum participants');
    }

    // Check if budget allows more participants
    if (campaign.remainingBudget < campaign.rewardPerAction) {
      throw new ValidationError('Campaign budget exhausted');
    }

    // Create participation
    const participation = await db.shillingParticipation.create({
      data: {
        userId,
        campaignId: id,
        platform,
        content,
        proofUrl,
        screenshots,
        additionalInfo,
        status: ParticipationStatus.PENDING,
        participatedAt: new Date()
      }
    });

    // Update campaign stats
    await db.shillingCampaign.update({
      where: { id },
      data: {
        participationCount: {
          increment: 1
        },
        remainingBudget: {
          decrement: campaign.rewardPerAction
        }
      }
    });

    logger.info('User participated in shilling campaign', {
      userId,
      campaignId: id,
      platform,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Participation submitted successfully',
      participation
    });
  })
);

// Get user's shilling participations
router.get('/my/participations',
  authenticateToken,
  requirePermission('read:shilling'),
  validateRequest(commonSchemas.pagination),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    const [participations, total] = await Promise.all([
      db.shillingParticipation.findMany({
        where: { userId },
        include: {
          campaign: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  chain: true
                }
              }
            }
          }
        },
        orderBy: {
          participatedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.shillingParticipation.count({ where: { userId } })
    ]);

    res.json({
      participations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Approve/reject participation (campaign creator only)
router.put('/:campaignId/participations/:participationId',
  authenticateToken,
  requirePermission('manage:shilling'),
  validateRequest({
    params: z.object({
      campaignId: z.string().uuid(),
      participationId: z.string().uuid()
    }),
    body: z.object({
      status: z.nativeEnum(ParticipationStatus),
      feedback: z.string().max(1000).optional(),
      earnings: z.number().positive().optional()
    })
  }),
  asyncHandler(async (req: any, res: any) => {
    const { campaignId, participationId } = req.params;
    const { status, feedback, earnings } = req.body;
    const userId = req.user.id;

    // Check if campaign exists and belongs to user
    const campaign = await db.shillingCampaign.findUnique({
      where: {
        id: campaignId,
        creatorId: userId
      }
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found or access denied');
    }

    // Get participation
    const participation = await db.shillingParticipation.findUnique({
      where: { id: participationId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            reputation: true
          }
        }
      }
    });

    if (!participation || participation.campaignId !== campaignId) {
      throw new NotFoundError('Participation not found');
    }

    // Calculate earnings if approved
    let finalEarnings = earnings;
    if (status === ParticipationStatus.APPROVED && !earnings) {
      finalEarnings = campaign.rewardPerAction;
    }

    // Update participation
    const updatedParticipation = await db.shillingParticipation.update({
      where: { id: participationId },
      data: {
        status,
        feedback,
        earnings: finalEarnings,
        reviewedAt: new Date(),
        reviewedBy: userId
      }
    });

    // Update user reputation if approved
    if (status === ParticipationStatus.APPROVED) {
      await db.user.update({
        where: { id: participation.userId },
        data: {
          reputation: {
            increment: 5
          }
        }
      });
    }

    logger.info('Shilling participation reviewed', {
      campaignId,
      participationId,
      reviewerId: userId,
      participantId: participation.userId,
      status,
      earnings: finalEarnings
    });

    res.json({
      message: `Participation ${status.toLowerCase()}`,
      participation: updatedParticipation
    });
  })
);

// Get campaign statistics (creator only)
router.get('/:id/stats',
  authenticateToken,
  requirePermission('read:shilling'),
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if campaign exists and belongs to user
    const campaign = await db.shillingCampaign.findUnique({
      where: {
        id,
        creatorId: userId
      }
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found or access denied');
    }

    const [
      participationStats,
      platformStats,
      earningsStats
    ] = await Promise.all([
      // Participation status breakdown
      db.shillingParticipation.groupBy({
        by: ['status'],
        where: { campaignId: id },
        _count: true,
        _sum: { earnings: true }
      }),
      
      // Platform breakdown
      db.shillingParticipation.groupBy({
        by: ['platform'],
        where: { campaignId: id },
        _count: true
      }),
      
      // Earnings stats
      db.shillingParticipation.aggregate({
        where: { campaignId: id },
        _count: { id: true },
        _sum: { earnings: true },
        _avg: { earnings: true }
      })
    ]);

    const stats = {
      participations: {
        total: participationStats.reduce((sum, stat) => sum + stat._count, 0),
        byStatus: participationStats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat._count,
            totalEarnings: stat._sum.earnings || 0
          };
          return acc;
        }, {} as Record<string, any>)
      },
      platforms: platformStats.reduce((acc, stat) => {
        acc[stat.platform] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      earnings: {
        total: earningsStats._sum.earnings || 0,
        average: earningsStats._avg.earnings || 0,
        totalParticipations: earningsStats._count.id
      },
      budget: {
        total: campaign.budget,
        remaining: campaign.remainingBudget,
        spent: campaign.budget - campaign.remainingBudget
      }
    };

    res.json({
      stats
    });
  })
);

// Update campaign (creator only)
router.put('/:id',
  authenticateToken,
  requirePermission('manage:shilling'),
  validateRequest({
    params: commonSchemas.idParam.params,
    body: z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(2000).optional(),
      status: z.nativeEnum(ShillingStatus).optional(),
      maxParticipants: z.number().positive().optional(),
      budget: z.number().positive().optional()
    })
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    // Check if campaign exists and belongs to user
    const existingCampaign = await db.shillingCampaign.findUnique({
      where: {
        id,
        creatorId: userId
      }
    });

    if (!existingCampaign) {
      throw new NotFoundError('Campaign not found or access denied');
    }

    const campaign = await db.shillingCampaign.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            logo: true,
            chain: true
          }
        }
      }
    });

    logger.info('Shilling campaign updated', {
      campaignId: id,
      updatedBy: userId,
      changes: updateData
    });

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });
  })
);

export default router;