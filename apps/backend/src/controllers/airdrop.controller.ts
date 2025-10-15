import { Request, Response } from 'express';
import { db } from '@/lib/db';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { 
  AirdropStatus, 
  RiskLevel, 
  UserAirdropStatusType,
  DiscoveryStatus 
} from '@prisma/client';

export class AirdropController {
  /**
   * GET /api/airdrops
   * Fetch paginated list of vetted airdrops
   */
  static async getAirdrops(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        category,
        blockchain,
        riskLevel,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const where: any = {
        status: AirdropStatus.ACTIVE, // Only show active airdrops by default
      };

      if (status && status !== 'all') {
        where.status = status as AirdropStatus;
      }

      if (category && category !== 'all') {
        where.category = category as string;
      }

      if (blockchain && blockchain !== 'all') {
        where.blockchain = blockchain as string;
      }

      if (riskLevel && riskLevel !== 'all') {
        where.riskLevel = riskLevel as RiskLevel;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { tokenSymbol: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder as string;

      // Execute queries in parallel
      const [airdrops, totalCount] = await Promise.all([
        db.airdrop.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
          include: {
            vettingReports: {
              orderBy: { generatedAt: 'desc' }
            },
            _count: {
              select: {
                userAirdropStatuses: true
              }
            }
          }
        }),
        db.airdrop.count({ where })
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      // Transform data for frontend
      const transformedAirdrops = airdrops.map(airdrop => ({
        ...airdrop,
        participantCount: airdrop._count.userAirdropStatuses,
        averageVettingScore: airdrop.vettingReports.length > 0
          ? airdrop.vettingReports.reduce((sum, report) => sum + report.score, 0) / airdrop.vettingReports.length
          : null,
        _count: undefined // Remove internal count
      }));

      res.json({
        success: true,
        data: {
          airdrops: transformedAirdrops,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum,
            hasNextPage,
            hasPrevPage
          }
        }
      });

    } catch (error) {
      console.error('Error fetching airdrops:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch airdrops'
      });
    }
  }

  /**
   * GET /api/airdrops/:id
   * Fetch details for a single airdrop
   */
  static async getAirdropById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const airdrop = await db.airdrop.findUnique({
        where: { id },
        include: {
          vettingReports: {
            orderBy: { generatedAt: 'desc' }
          },
          userAirdropStatuses: {
            where: req.user ? { userId: (req as AuthenticatedRequest).user.id } : undefined,
            take: 1
          },
          _count: {
            select: {
              userAirdropStatuses: true
            }
          }
        }
      });

      if (!airdrop) {
        return res.status(404).json({
          success: false,
          error: 'Airdrop not found'
        });
      }

      // Parse JSON fields
      const parsedAirdrop = {
        ...airdrop,
        requirements: typeof airdrop.requirements === 'string' 
          ? JSON.parse(airdrop.requirements) 
          : airdrop.requirements,
        eligibility: typeof airdrop.eligibility === 'string' 
          ? JSON.parse(airdrop.eligibility) 
          : airdrop.eligibility,
        participantCount: airdrop._count.userAirdropStatuses,
        userStatus: airdrop.userAirdropStatuses[0] || null,
        averageVettingScore: airdrop.vettingReports.length > 0
          ? airdrop.vettingReports.reduce((sum, report) => sum + report.score, 0) / airdrop.vettingReports.length
          : null,
        _count: undefined,
        userAirdropStatuses: undefined
      };

      res.json({
        success: true,
        data: parsedAirdrop
      });

    } catch (error) {
      console.error('Error fetching airdrop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch airdrop'
      });
    }
  }

  /**
   * POST /api/user/airdrop-status
   * Update user's interaction status with an airdrop
   */
  static async updateAirdropStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { airdropId, status, notes, completedRequirements } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!airdropId || !status) {
        return res.status(400).json({
          success: false,
          error: 'Airdrop ID and status are required'
        });
      }

      if (!Object.values(UserAirdropStatusType).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      // Check if airdrop exists
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId }
      });

      if (!airdrop) {
        return res.status(404).json({
          success: false,
          error: 'Airdrop not found'
        });
      }

      // Calculate progress percentage
      let progressPercentage = 0;
      if (completedRequirements && Array.isArray(completedRequirements)) {
        const totalRequirements = Array.isArray(airdrop.requirements) 
          ? airdrop.requirements.length 
          : JSON.parse(airdrop.requirements as string)?.length || 0;
        progressPercentage = totalRequirements > 0 
          ? (completedRequirements.length / totalRequirements) * 100 
          : 0;
      }

      // Upsert user airdrop status
      const userAirdropStatus = await db.userAirdropStatus.upsert({
        where: {
          userId_airdropId: {
            userId,
            airdropId
          }
        },
        update: {
          status,
          notes: notes || null,
          completedRequirements: completedRequirements || null,
          progressPercentage,
          startedAt: status === UserAirdropStatusType.IN_PROGRESS ? new Date() : undefined,
          completedAt: status === UserAirdropStatusType.COMPLETED ? new Date() : undefined,
          updatedAt: new Date()
        },
        create: {
          userId,
          airdropId,
          status,
          notes: notes || null,
          completedRequirements: completedRequirements || null,
          progressPercentage,
          startedAt: status === UserAirdropStatusType.IN_PROGRESS ? new Date() : null,
          completedAt: status === UserAirdropStatusType.COMPLETED ? new Date() : null
        }
      });

      res.json({
        success: true,
        data: userAirdropStatus
      });

    } catch (error) {
      console.error('Error updating airdrop status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update airdrop status'
      });
    }
  }

  /**
   * GET /api/user/airdrop-statuses
   * Get user's airdrop statuses
   */
  static async getUserAirdropStatuses(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, page = '1', limit = '20' } = req.query;
      const userId = req.user.id;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { userId };
      if (status && status !== 'all') {
        where.status = status as UserAirdropStatusType;
      }

      const [userAirdropStatuses, totalCount] = await Promise.all([
        db.userAirdropStatus.findMany({
          where,
          include: {
            airdrop: {
              include: {
                _count: {
                  select: {
                    userAirdropStatuses: true
                  }
                }
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limitNum
        }),
        db.userAirdropStatus.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,
        data: {
          statuses: userAirdropStatuses,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user airdrop statuses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user airdrop statuses'
      });
    }
  }

  /**
   * GET /api/airdrops/stats
   * Get airdrop statistics
   */
  static async getAirdropStats(req: Request, res: Response) {
    try {
      const [
        totalAirdrops,
        activeAirdrops,
        completedAirdrops,
        airdropsByCategory,
        airdropsByBlockchain,
        airdropsByRiskLevel
      ] = await Promise.all([
        db.airdrop.count(),
        db.airdrop.count({ where: { status: AirdropStatus.ACTIVE } }),
        db.airdrop.count({ where: { status: AirdropStatus.COMPLETED } }),
        db.airdrop.groupBy({
          by: ['category'],
          where: { status: AirdropStatus.ACTIVE },
          _count: true
        }),
        db.airdrop.groupBy({
          by: ['blockchain'],
          where: { status: AirdropStatus.ACTIVE },
          _count: true
        }),
        db.airdrop.groupBy({
          by: ['riskLevel'],
          where: { status: AirdropStatus.ACTIVE },
          _count: true
        })
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            total: totalAirdrops,
            active: activeAirdrops,
            completed: completedAirdrops
          },
          byCategory: airdropsByCategory,
          byBlockchain: airdropsByBlockchain,
          byRiskLevel: airdropsByRiskLevel
        }
      });

    } catch (error) {
      console.error('Error fetching airdrop stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch airdrop statistics'
      });
    }
  }
}