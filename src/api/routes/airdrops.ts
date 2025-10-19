import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/db';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requirePermission, optionalAuth } from '@/middleware/auth';
import { generalRateLimiter } from '@/middleware/rateLimiter';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { AirdropStatus, AirdropType, ParticipationStatus } from '@prisma/client';

const router = Router();

// Validation schemas
const createAirdropSchema = {
  body: z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    type: z.nativeEnum(AirdropType),
    totalAmount: z.number().positive(),
    tokenSymbol: z.string().min(1).max(20),
    eligibilityCriteria: z.object({
      minHoldings: z.number().optional(),
      requiredTokens: z.array(z.string()).optional(),
      socialTasks: z.array(z.string()).optional(),
      minFollowers: z.number().optional(),
      whitelistOnly: z.boolean().default(false)
    }),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    maxParticipants: z.number().positive().optional(),
    requirements: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  })
};

const participateAirdropSchema = {
  body: z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    socialProfiles: z.object({
      twitter: z.string().optional(),
      discord: z.string().optional(),
      telegram: z.string().optional()
    }).optional(),
    answers: z.array(z.string()).optional()
  })
};

const airdropQuerySchema = {
  query: z.object({
    status: z.nativeEnum(AirdropStatus).optional(),
    type: z.nativeEnum(AirdropType).optional(),
    chain: z.string().optional(),
    minAmount: z.string().transform(Number).optional(),
    maxAmount: z.string().transform(Number).optional(),
    tags: z.string().optional().transform(val => val ? val.split(',') : undefined),
    search: z.string().optional(),
    featured: z.string().transform(val => val === 'true').optional(),
    endingSoon: z.string().transform(val => val === 'true').optional(),
    new: z.string().transform(val => val === 'true').optional()
  }).merge(commonSchemas.pagination.query)
};

// Get all airdrops (public endpoint)
router.get('/',
  optionalAuth,
  validateRequest(airdropQuerySchema),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const {
      status,
      type,
      chain,
      minAmount,
      maxAmount,
      tags,
      search,
      featured,
      endingSoon,
      new: isNew,
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
    if (chain) where.project = { chain };
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = minAmount;
      if (maxAmount) where.totalAmount.lte = maxAmount;
    }
    if (tags) {
      where.tags = {
        hasEvery: tags
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { project: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (featured) where.featured = true;
    if (endingSoon) {
      where.endDate = {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      };
    }
    if (isNew) {
      where.createdAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      };
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'amount') {
      orderBy.totalAmount = sortOrder;
    } else if (sortBy === 'endDate') {
      orderBy.endDate = sortOrder;
    } else if (sortBy === 'participants') {
      orderBy.participationCount = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute query
    const [airdrops, total] = await Promise.all([
      db.airdrop.findMany({
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
          token: {
            select: {
              symbol: true,
              name: true,
              logo: true,
              currentPrice: true
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
      db.airdrop.count({ where })
    ]);

    // Add user participation status if authenticated
    let airdropsWithUserStatus = airdrops;
    if (userId) {
      const userParticipations = await db.airdropParticipation.findMany({
        where: {
          userId,
          airdropId: { in: airdrops.map(a => a.id) }
        },
        select: {
          airdropId: true,
          status: true,
          participatedAt: true
        }
      });

      const participationMap = userParticipations.reduce((acc, p) => {
        acc[p.airdropId] = p;
        return acc;
      }, {} as Record<string, any>);

      airdropsWithUserStatus = airdrops.map(airdrop => ({
        ...airdrop,
        userParticipation: participationMap[airdrop.id] || null
      }));
    }

    res.json({
      airdrops: airdropsWithUserStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Get featured airdrops
router.get('/featured',
  optionalAuth,
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const featuredAirdrops = await db.airdrop.findMany({
      where: {
        featured: true,
        status: AirdropStatus.ACTIVE,
        deletedAt: null
      },
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
        token: {
          select: {
            symbol: true,
            name: true,
            logo: true,
            currentPrice: true
          }
        },
        _count: {
          select: {
            participations: true
          }
        }
      },
      orderBy: {
        totalAmount: 'desc'
      },
      take: 10
    });

    res.json({
      featuredAirdrops
    });
  })
);

// Get airdrop by ID
router.get('/:id',
  optionalAuth,
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const airdrop = await db.airdrop.findUnique({
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
            discord: true,
            chain: true,
            isVerified: true,
            trustScore: true
          }
        },
        token: {
          select: {
            symbol: true,
            name: true,
            logo: true,
            currentPrice: true,
            marketCap: true,
            totalSupply: true
          }
        },
        requirements: true,
        _count: {
          select: {
            participations: true
          }
        }
      }
    });

    if (!airdrop) {
      throw new NotFoundError('Airdrop not found');
    }

    // Add user participation status if authenticated
    let userParticipation = null;
    if (userId) {
      userParticipation = await db.airdropParticipation.findUnique({
        where: {
          userId_airdropId: {
            userId,
            airdropId: id
          }
        },
        select: {
          id: true,
          status: true,
          participatedAt: true,
          walletAddress: true,
          socialProfiles: true,
          answers: true
        }
      });
    }

    res.json({
      airdrop: {
        ...airdrop,
        userParticipation
      }
    });
  })
);

// Create new airdrop (admin/moderator only)
router.post('/',
  authenticateToken,
  requirePermission('create:airdrop'),
  validateRequest(createAirdropSchema),
  asyncHandler(async (req: any, res: any) => {
    const airdropData = req.body;

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: airdropData.projectId }
    });

    if (!project) {
      throw new ValidationError('Project not found');
    }

    // Create airdrop
    const airdrop = await db.airdrop.create({
      data: {
        ...airdropData,
        startDate: new Date(airdropData.startDate),
        endDate: new Date(airdropData.endDate),
        status: AirdropStatus.UPCOMING,
        participationCount: 0
      },
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

    logger.info('Airdrop created', {
      airdropId: airdrop.id,
      projectId: airdropData.projectId,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Airdrop created successfully',
      airdrop
    });
  })
);

// Participate in airdrop
router.post('/:id/participate',
  authenticateToken,
  requirePermission('participate:airdrops'),
  validateRequest({
    params: commonSchemas.idParam.params,
    body: participateAirdropSchema.body
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { walletAddress, socialProfiles, answers } = req.body;
    const userId = req.user.id;

    // Check if airdrop exists and is active
    const airdrop = await db.airdrop.findUnique({
      where: {
        id,
        status: AirdropStatus.ACTIVE,
        deletedAt: null
      }
    });

    if (!airdrop) {
      throw new NotFoundError('Airdrop not found or not active');
    }

    // Check if airdrop has ended
    if (airdrop.endDate < new Date()) {
      throw new ValidationError('Airdrop has ended');
    }

    // Check if user has already participated
    const existingParticipation = await db.airdropParticipation.findUnique({
      where: {
        userId_airdropId: {
          userId,
          airdropId: id
        }
      }
    });

    if (existingParticipation) {
      throw new ConflictError('You have already participated in this airdrop');
    }

    // Check if max participants reached
    if (airdrop.maxParticipants) {
      const currentParticipants = await db.airdropParticipation.count({
        where: { airdropId: id }
      });

      if (currentParticipants >= airdrop.maxParticipants) {
        throw new ValidationError('Airdrop has reached maximum participants');
      }
    }

    // Create participation
    const participation = await db.airdropParticipation.create({
      data: {
        userId,
        airdropId: id,
        walletAddress,
        socialProfiles,
        answers,
        status: ParticipationStatus.PENDING,
        participatedAt: new Date()
      }
    });

    // Update participation count
    await db.airdrop.update({
      where: { id },
      data: {
        participationCount: {
          increment: 1
        }
      }
    });

    logger.info('User participated in airdrop', {
      userId,
      airdropId: id,
      walletAddress,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Participation successful',
      participation
    });
  })
);

// Get user's airdrop participations
router.get('/my/participations',
  authenticateToken,
  requirePermission('read:airdrops'),
  validateRequest(commonSchemas.pagination),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    const [participations, total] = await Promise.all([
      db.airdropParticipation.findMany({
        where: { userId },
        include: {
          airdrop: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  chain: true
                }
              },
              token: {
                select: {
                  symbol: true,
                  name: true,
                  currentPrice: true
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
      db.airdropParticipation.count({ where: { userId } })
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

// Update airdrop (admin/moderator only)
router.put('/:id',
  authenticateToken,
  requirePermission('manage:airdrops'),
  validateRequest({
    params: commonSchemas.idParam.params,
    body: z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(2000).optional(),
      status: z.nativeEnum(AirdropStatus).optional(),
      featured: z.boolean().optional(),
      maxParticipants: z.number().positive().optional()
    })
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body;

    const airdrop = await db.airdrop.update({
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

    logger.info('Airdrop updated', {
      airdropId: id,
      updatedBy: req.user.id,
      changes: updateData
    });

    res.json({
      message: 'Airdrop updated successfully',
      airdrop
    });
  })
);

// Delete airdrop (admin only)
router.delete('/:id',
  authenticateToken,
  requirePermission('delete:airdrops'),
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    await db.airdrop.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    logger.warn('Airdrop deleted', {
      airdropId: id,
      deletedBy: req.user.id
    });

    res.json({
      message: 'Airdrop deleted successfully'
    });
  })
);

export default router;