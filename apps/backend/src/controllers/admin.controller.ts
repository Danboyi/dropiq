import { Request, Response } from 'express';
import { db } from '@/lib/db';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { 
  DiscoveryStatus, 
  DiscoveryPriority,
  JobStatus,
  AirdropStatus,
  UserRole 
} from '@prisma/client';

export class AdminController {
  /**
   * Middleware to check if user is admin
   */
  static requireAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    next();
  }

  /**
   * GET /api/admin/discovered-airdrops
   * Get discovered airdrops awaiting review
   */
  static async getDiscoveredAirdrops(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        priority,
        source
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status && status !== 'all') {
        where.status = status as DiscoveryStatus;
      }
      if (priority && priority !== 'all') {
        where.priority = priority as DiscoveryPriority;
      }
      if (source && source !== 'all') {
        where.source = { name: source as string };
      }

      const [discoveredAirdrops, totalCount] = await Promise.all([
        db.discoveredAirdrop.findMany({
          where,
          include: {
            source: true,
            airdrop: true,
            vettingJobs: {
              orderBy: { createdAt: 'desc' },
              take: 5
            },
            _count: {
              select: {
                vettingJobs: true
              }
            }
          },
          orderBy: { discoveredAt: 'desc' },
          skip,
          take: limitNum
        }),
        db.discoveredAirdrop.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,
        data: {
          discoveredAirdrops,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum
          }
        }
      });

    } catch (error) {
      console.error('Error fetching discovered airdrops:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch discovered airdrops'
      });
    }
  }

  /**
   * POST /api/admin/appve-airdrop
   * Approve a discovered airdrop and create official airdrop
   */
  static async approveAirdrop(req: AuthenticatedRequest, res: Response) {
    try {
      const { discoveredAirdropId, airdropData } = req.body;

      if (!discoveredAirdropId || !airdropData) {
        return res.status(400).json({
          success: false,
          error: 'Discovered airdrop ID and airdrop data are required'
        });
      }

      // Get discovered airdrop
      const discoveredAirdrop = await db.discoveredAirdrop.findUnique({
        where: { id: discoveredAirdropId },
        include: { source: true }
      });

      if (!discoveredAirdrop) {
        return res.status(404).json({
          success: false,
          error: 'Discovered airdrop not found'
        });
      }

      // Create official airdrop
      const airdrop = await db.airdrop.create({
        data: {
          ...airdropData,
          status: AirdropStatus.ACTIVE
        }
      });

      // Update discovered airdrop status
      await db.discoveredAirdrop.update({
        where: { id: discoveredAirdropId },
        data: {
          status: DiscoveryStatus.APPROVED,
          airdropId: airdrop.id
        }
      });

      res.json({
        success: true,
        data: {
          airdrop,
          discoveredAirdrop: {
            ...discoveredAirdrop,
            status: DiscoveryStatus.APPROVED,
            airdropId: airdrop.id
          }
        }
      });

    } catch (error) {
      console.error('Error approving airdrop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve airdrop'
      });
    }
  }

  /**
   * POST /api/admin/reject-airdrop
   * Reject a discovered airdrop
   */
  static async rejectAirdrop(req: AuthenticatedRequest, res: Response) {
    try {
      const { discoveredAirdropId, reason } = req.body;

      if (!discoveredAirdropId) {
        return res.status(400).json({
          success: false,
          error: 'Discovered airdrop ID is required'
        });
      }

      const discoveredAirdrop = await db.discoveredAirdrop.update({
        where: { id: discoveredAirdropId },
        data: {
          status: DiscoveryStatus.REJECTED,
          rawContent: {
            ...discoveredAirdrop.rawContent,
            rejectionReason: reason || 'Rejected by admin'
          }
        }
      });

      res.json({
        success: true,
        data: discoveredAirdrop
      });

    } catch (error) {
      console.error('Error rejecting airdrop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject airdrop'
      });
    }
  }

  /**
   * GET /api/admin/vetting-jobs
   * Get vetting jobs status
   */
  static async getVettingJobs(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        type
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status && status !== 'all') {
        where.status = status as JobStatus;
      }
      if (type && type !== 'all') {
        where.type = type as string;
      }

      const [vettingJobs, totalCount] = await Promise.all([
        db.vettingJob.findMany({
          where,
          include: {
            discoveredAirdrop: {
              include: { source: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum
        }),
        db.vettingJob.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,
        data: {
          vettingJobs,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum
          }
        }
      });

    } catch (error) {
      console.error('Error fetching vetting jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vetting jobs'
      });
    }
  }

  /**
   * POST /api/admin/trigger-scraping
   * Trigger scraping job manually
   */
  static async triggerScraping(req: AuthenticatedRequest, res: Response) {
    try {
      const { sourceType, config } = req.body;

      if (!sourceType) {
        return res.status(400).json({
          success: false,
          error: 'Source type is required'
        });
      }

      // Create scraping job
      const job = await db.vettingJob.create({
        data: {
          type: `SCRAPE_${sourceType.toUpperCase()}`,
          status: JobStatus.PENDING,
          priority: 1, // High priority for manual triggers
          config: config || {},
          discoveredAirdropId: 'manual-trigger' // This would be handled differently in a real implementation
        }
      });

      // In a real implementation, you would add this to your job queue
      // For now, we'll just return the job creation confirmation

      res.json({
        success: true,
        data: {
          job,
          message: 'Scraping job created successfully'
        }
      });

    } catch (error) {
      console.error('Error triggering scraping:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger scraping'
      });
    }
  }

  /**
   * GET /api/admin/dashboard
   * Get admin dashboard statistics
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
      const [
        totalDiscovered,
        pendingReview,
        approvedToday,
        rejectedToday,
        activeJobs,
        completedJobs,
        failedJobs
      ] = await Promise.all([
        db.discoveredAirdrop.count(),
        db.discoveredAirdrop.count({ 
          where: { status: DiscoveryStatus.DISCOVERED }
        }),
        db.discoveredAirdrop.count({
          where: {
            status: DiscoveryStatus.APPROVED,
            discoveredAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        db.discoveredAirdrop.count({
          where: {
            status: DiscoveryStatus.REJECTED,
            discoveredAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        db.vettingJob.count({
          where: { status: JobStatus.RUNNING }
        }),
        db.vettingJob.count({
          where: { status: JobStatus.COMPLETED }
        }),
        db.vettingJob.count({
          where: { status: JobStatus.FAILED }
        })
      ]);

      res.json({
        success: true,
        data: {
          discovery: {
            total: totalDiscovered,
            pending: pendingReview,
            approvedToday,
            rejectedToday
          },
          jobs: {
            active: activeJobs,
            completed: completedJobs,
            failed: failedJobs
          }
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard statistics'
      });
    }
  }
}