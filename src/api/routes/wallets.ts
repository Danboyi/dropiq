import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/db';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requirePermission } from '@/middleware/auth';
import { generalRateLimiter } from '@/middleware/rateLimiter';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { ZAI } from 'z-ai-web-dev-sdk';
import { Wallet, WalletAnalysis, Chain } from '@prisma/client';

const router = Router();

// Validation schemas
const createWalletSchema = {
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    chain: z.nativeEnum(Chain),
    label: z.string().min(1).max(50).optional(),
    isPrimary: z.boolean().default(false)
  })
};

const updateWalletSchema = {
  body: z.object({
    label: z.string().min(1).max(50).optional(),
    isPrimary: z.boolean().optional()
  })
};

const walletQuerySchema = {
  query: z.object({
    chain: z.nativeEnum(Chain).optional(),
    isPrimary: z.string().transform(val => val === 'true').optional(),
    search: z.string().optional()
  }).merge(commonSchemas.pagination.query)
};

// Get user's wallets
router.get('/',
  authenticateToken,
  requirePermission('read:wallet'),
  validateRequest(walletQuerySchema),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const { chain, isPrimary, search, page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    // Build where clause
    const where: any = { userId };
    if (chain) where.chain = chain;
    if (isPrimary !== undefined) where.isPrimary = isPrimary;
    if (search) {
      where.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'balance') {
      orderBy.balance = sortOrder;
    } else if (sortBy === 'label') {
      orderBy.label = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [wallets, total] = await Promise.all([
      db.wallet.findMany({
        where,
        include: {
          analyses: {
            orderBy: { analyzedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              totalValue: true,
              tokenCount: true,
              analyzedAt: true,
              airdropEligibility: true,
              riskScore: true
            }
          },
          _count: {
            select: {
              airdropParticipations: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      db.wallet.count({ where })
    ]);

    res.json({
      wallets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Get wallet by ID
router.get('/:id',
  authenticateToken,
  requirePermission('read:wallet'),
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;

    const wallet = await db.wallet.findFirst({
      where: {
        id,
        userId
      },
      include: {
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            totalValue: true,
            tokenCount: true,
            analyzedAt: true,
            airdropEligibility: true,
            riskScore: true,
            recommendations: true,
            tokenHoldings: true
          }
        },
        airdropParticipations: {
          include: {
            airdrop: {
              select: {
                id: true,
                title: true,
                status: true,
                endDate: true,
                project: {
                  select: {
                    name: true,
                    logo: true
                  }
                }
              }
            }
          },
          orderBy: { participatedAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            airdropParticipations: true,
            analyses: true
          }
        }
      }
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    res.json({
      wallet
    });
  })
);

// Create new wallet
router.post('/',
  authenticateToken,
  requirePermission('create:wallet'),
  validateRequest(createWalletSchema),
  asyncHandler(async (req: any, res: any) => {
    const { address, chain, label, isPrimary } = req.body;
    const userId = req.user.id;

    // Check if wallet already exists for this user
    const existingWallet = await db.wallet.findFirst({
      where: {
        userId,
        address,
        chain
      }
    });

    if (existingWallet) {
      throw new ConflictError('Wallet already added');
    }

    // If setting as primary, unset other primary wallets
    if (isPrimary) {
      await db.wallet.updateMany({
        where: {
          userId,
          chain,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    // Create wallet
    const wallet = await db.wallet.create({
      data: {
        address,
        chain,
        label,
        isPrimary,
        userId
      }
    });

    logger.info('Wallet added', {
      walletId: wallet.id,
      userId,
      address,
      chain,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Wallet added successfully',
      wallet
    });
  })
);

// Update wallet
router.put('/:id',
  authenticateToken,
  requirePermission('update:wallet'),
  validateRequest({
    params: commonSchemas.idParam.params,
    body: updateWalletSchema.body
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { label, isPrimary } = req.body;
    const userId = req.user.id;

    // Check if wallet exists and belongs to user
    const existingWallet = await db.wallet.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingWallet) {
      throw new NotFoundError('Wallet not found');
    }

    // If setting as primary, unset other primary wallets
    if (isPrimary) {
      await db.wallet.updateMany({
        where: {
          userId,
          chain: existingWallet.chain,
          isPrimary: true,
          id: { not: id }
        },
        data: {
          isPrimary: false
        }
      });
    }

    // Update wallet
    const wallet = await db.wallet.update({
      where: { id },
      data: {
        label,
        isPrimary
      }
    });

    logger.info('Wallet updated', {
      walletId: id,
      userId,
      changes: { label, isPrimary }
    });

    res.json({
      message: 'Wallet updated successfully',
      wallet
    });
  })
);

// Delete wallet
router.delete('/:id',
  authenticateToken,
  requirePermission('delete:wallet'),
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if wallet exists and belongs to user
    const wallet = await db.wallet.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    await db.wallet.delete({
      where: { id }
    });

    logger.info('Wallet deleted', {
      walletId: id,
      userId,
      address: wallet.address
    });

    res.json({
      message: 'Wallet deleted successfully'
    });
  })
);

// Analyze wallet
router.post('/:id/analyze',
  authenticateToken,
  requirePermission('analyze:wallet'),
  validateRequest(commonSchemas.idParam),
  generalRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if wallet exists and belongs to user
    const wallet = await db.wallet.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    try {
      // Initialize ZAI SDK
      const zai = await ZAI.create();

      // Get wallet analysis from AI
      const analysisPrompt = `
        Analyze this Ethereum wallet address: ${wallet.address}
        
        Provide a comprehensive analysis including:
        1. Current portfolio value and token holdings
        2. Airdrop eligibility based on current holdings
        3. Risk assessment and security recommendations
        4. Potential airdrop opportunities
        5. Wallet activity patterns
        
        Format the response as JSON with the following structure:
        {
          "totalValue": number,
          "tokenCount": number,
          "tokenHoldings": [{"symbol": string, "balance": number, "value": number}],
          "airdropEligibility": [{"project": string, "probability": number, "reason": string}],
          "riskScore": number,
          "recommendations": [string],
          "activityPattern": string,
          "securityIssues": [string]
        }
      `;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain analyst specializing in wallet analysis and airdrop opportunities. Provide detailed, accurate analysis in JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const analysisData = JSON.parse(completion.choices[0].message.content || '{}');

      // Save analysis to database
      const analysis = await db.walletAnalysis.create({
        data: {
          walletId: id,
          totalValue: analysisData.totalValue || 0,
          tokenCount: analysisData.tokenCount || 0,
          tokenHoldings: analysisData.tokenHoldings || [],
          airdropEligibility: analysisData.airdropEligibility || [],
          riskScore: analysisData.riskScore || 0,
          recommendations: analysisData.recommendations || [],
          activityPattern: analysisData.activityPattern || 'unknown',
          securityIssues: analysisData.securityIssues || [],
          analyzedAt: new Date()
        }
      });

      // Update wallet balance
      await db.wallet.update({
        where: { id },
        data: {
          balance: analysisData.totalValue || 0,
          lastAnalyzedAt: new Date()
        }
      });

      logger.info('Wallet analysis completed', {
        walletId: id,
        userId,
        totalValue: analysisData.totalValue,
        riskScore: analysisData.riskScore
      });

      res.json({
        message: 'Wallet analysis completed',
        analysis
      });

    } catch (error) {
      logger.error('Wallet analysis failed', {
        walletId: id,
        userId,
        error: error.message
      });

      throw new ValidationError('Failed to analyze wallet. Please try again later.');
    }
  })
);

// Get wallet analysis history
router.get('/:id/analyses',
  authenticateToken,
  requirePermission('read:wallet'),
  validateRequest({
    params: commonSchemas.idParam.params,
    query: commonSchemas.pagination.query
  }),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { page, limit } = req.query;
    const userId = req.user.id;

    // Check if wallet exists and belongs to user
    const wallet = await db.wallet.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    const [analyses, total] = await Promise.all([
      db.walletAnalysis.findMany({
        where: { walletId: id },
        orderBy: { analyzedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.walletAnalysis.count({ where: { walletId: id } })
    ]);

    res.json({
      analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Get wallet airdrop recommendations
router.get('/:id/recommendations',
  authenticateToken,
  requirePermission('read:wallet'),
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if wallet exists and belongs to user
    const wallet = await db.wallet.findFirst({
      where: {
        id,
        userId
      },
      include: {
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 1,
          select: {
            airdropEligibility: true,
            recommendations: true,
            riskScore: true
          }
        }
      }
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    const latestAnalysis = wallet.analyses[0];
    
    if (!latestAnalysis) {
      res.json({
        message: 'No analysis available. Please analyze the wallet first.',
        recommendations: [],
        eligibility: []
      });
      return;
    }

    // Get recommended airdrops based on analysis
    const recommendedAirdrops = await db.airdrop.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        tags: {
          hasSome: latestAnalysis.recommendations.slice(0, 5) // Use top 5 recommendations as tags
        }
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
        totalAmount: 'desc'
      },
      take: 10
    });

    res.json({
      eligibility: latestAnalysis.airdropEligibility,
      recommendations: latestAnalysis.recommendations,
      riskScore: latestAnalysis.riskScore,
      recommendedAirdrops,
      lastAnalyzedAt: latestAnalysis.analyzedAt
    });
  })
);

// Get wallet statistics
router.get('/:id/stats',
  authenticateToken,
  requirePermission('read:wallet'),
  validateRequest(commonSchemas.idParam),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if wallet exists and belongs to user
    const wallet = await db.wallet.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    const [
      airdropStats,
      analysisStats,
      participationValue
    ] = await Promise.all([
      // Airdrop participation stats
      db.airdropParticipation.groupBy({
        by: ['status'],
        where: { walletAddress: wallet.address },
        _count: true
      }),
      
      // Analysis stats
      db.walletAnalysis.aggregate({
        where: { walletId: id },
        _count: { id: true },
        _avg: { totalValue: true, riskScore: true },
        _max: { totalValue: true, analyzedAt: true },
        _min: { totalValue: true, riskScore: true }
      }),
      
      // Calculate potential airdrop value
      db.airdropParticipation.aggregate({
        where: {
          walletAddress: wallet.address,
          status: 'COMPLETED'
        },
        _count: { id: true }
      })
    ]);

    const stats = {
      airdrops: {
        total: airdropStats.reduce((sum, stat) => sum + stat._count, 0),
        byStatus: airdropStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>)
      },
      analyses: {
        total: analysisStats._count.id,
        averageValue: analysisStats._avg.totalValue || 0,
        averageRiskScore: analysisStats._avg.riskScore || 0,
        highestValue: analysisStats._max.totalValue || 0,
        lowestRiskScore: analysisStats._min.riskScore || 0,
        lastAnalyzedAt: analysisStats._max.analyzedAt
      },
      participations: {
        completed: participationValue._count.id
      }
    };

    res.json({
      stats
    });
  })
);

export default router;