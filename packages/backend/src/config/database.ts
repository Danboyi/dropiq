import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      errorFormat: 'pretty',
    });

    // Set up logging
    this.prisma.$on('query', (e) => {
      logger.debug('Query: ' + e.query);
      logger.debug('Params: ' + e.params);
      logger.debug('Duration: ' + e.duration + 'ms');
    });

    this.prisma.$on('error', (e) => {
      logger.error('Database error:', e);
    });

    this.prisma.$on('info', (e) => {
      logger.info('Database info:', e.message);
    });

    this.prisma.$on('warn', (e) => {
      logger.warn('Database warning:', e.message);
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public get client(): PrismaClient {
    return this.prisma;
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('✅ Database disconnected successfully');
    } catch (error) {
      logger.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  // ========================================
  // USER OPERATIONS
  // ========================================

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
        securitySettings: true,
        subscription: true,
        wallets: true,
      },
    });
  }

  async findUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
        securitySettings: true,
        subscription: true,
        wallets: true,
      },
    });
  }

  async findUserByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
      include: {
        preferences: true,
        securitySettings: true,
        subscription: true,
        wallets: true,
      },
    });
  }

  async findUserByWalletAddress(walletAddress: string) {
    return await this.prisma.user.findUnique({
      where: { walletAddress },
      include: {
        preferences: true,
        securitySettings: true,
        subscription: true,
        wallets: true,
      },
    });
  }

  async createUser(userData: any) {
    return await this.prisma.user.create({
      data: userData,
      include: {
        preferences: true,
        securitySettings: true,
        subscription: true,
        wallets: true,
      },
    });
  }

  async updateUser(id: string, userData: any) {
    return await this.prisma.user.update({
      where: { id },
      data: userData,
      include: {
        preferences: true,
        securitySettings: true,
        subscription: true,
        wallets: true,
      },
    });
  }

  // ========================================
  // AIRDROP OPERATIONS
  // ========================================

  async findActiveAirdrops(limit = 20, offset = 0) {
    return await this.prisma.airdrop.findMany({
      where: {
        status: 'active',
        project: {
          isActive: true,
          isScam: false,
        },
      },
      include: {
        project: {
          include: {
            tokens: true,
          },
        },
        token: true,
        requirementsList: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            participations: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { trustScore: 'desc' },
        { participantsCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }

  async findFeaturedAirdrops(limit = 10) {
    return await this.prisma.airdrop.findMany({
      where: {
        featured: true,
        status: 'active',
        project: {
          isActive: true,
          isScam: false,
        },
      },
      include: {
        project: {
          include: {
            tokens: true,
          },
        },
        token: true,
        requirementsList: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            participations: true,
          },
        },
      },
      orderBy: [
        { trustScore: 'desc' },
        { participantsCount: 'desc' },
      ],
      take: limit,
    });
  }

  async findTrendingAirdrops(limit = 10) {
    return await this.prisma.airdrop.findMany({
      where: {
        trending: true,
        status: 'active',
        project: {
          isActive: true,
          isScam: false,
        },
      },
      include: {
        project: {
          include: {
            tokens: true,
          },
        },
        token: true,
        requirementsList: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            participations: true,
          },
        },
      },
      orderBy: [
        { participantsCount: 'desc' },
        { trustScore: 'desc' },
      ],
      take: limit,
    });
  }

  async findAirdropById(id: string) {
    return await this.prisma.airdrop.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            tokens: true,
          },
        },
        token: true,
        requirementsList: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        participations: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
          orderBy: { registeredAt: 'desc' },
          take: 10,
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        _count: {
          select: {
            participations: true,
            requirementsList: true,
          },
        },
      },
    });
  }

  async findAirdropBySlug(slug: string) {
    return await this.prisma.airdrop.findUnique({
      where: { slug },
      include: {
        project: {
          include: {
            tokens: true,
          },
        },
        token: true,
        requirementsList: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            participations: true,
            requirementsList: true,
          },
        },
      },
    });
  }

  async searchAirdrops(query: string, filters: any = {}, limit = 20, offset = 0) {
    const where: any = {
      AND: [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { shortDescription: { contains: query, mode: 'insensitive' } },
            { project: { name: { contains: query, mode: 'insensitive' } } },
            { token: { name: { contains: query, mode: 'insensitive' } } },
            { token: { symbol: { contains: query, mode: 'insensitive' } } },
          ],
        },
        {
          project: {
            isActive: true,
            isScam: false,
          },
        },
      ],
    };

    // Apply filters
    if (filters.status) {
      where.AND.push({ status: filters.status });
    }
    if (filters.category) {
      where.AND.push({ project: { category: filters.category } });
    }
    if (filters.blockchain) {
      where.AND.push({ project: { blockchain: filters.blockchain } });
    }
    if (filters.minReward) {
      where.AND.push({ minRewardAmount: { gte: filters.minReward } });
    }
    if (filters.tags && filters.tags.length > 0) {
      where.AND.push({ tags: { hasSome: filters.tags } });
    }

    return await this.prisma.airdrop.findMany({
      where,
      include: {
        project: {
          include: {
            tokens: true,
          },
        },
        token: true,
        requirementsList: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            participations: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { trustScore: 'desc' },
        { participantsCount: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }

  // ========================================
  // USER PARTICIPATION OPERATIONS
  // ========================================

  async findUserParticipations(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.prisma.userAirdropParticipation.findMany({
      where,
      include: {
        airdrop: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                category: true,
                trustScore: true,
              },
            },
            token: {
              select: {
                symbol: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async createParticipation(participationData: any) {
    return await this.prisma.userAirdropParticipation.create({
      data: participationData,
      include: {
        airdrop: {
          include: {
            project: true,
            token: true,
          },
        },
      },
    });
  }

  async updateParticipation(id: string, data: any) {
    return await this.prisma.userAirdropParticipation.update({
      where: { id },
      data,
      include: {
        airdrop: {
          include: {
            project: true,
            token: true,
          },
        },
      },
    });
  }

  // ========================================
  // PROJECT OPERATIONS
  // ========================================

  async findProjects(limit = 50, offset = 0) {
    return await this.prisma.project.findMany({
      where: {
        isActive: true,
      },
      include: {
        tokens: true,
        airdrops: {
          where: { status: 'active' },
          select: {
            id: true,
            title: true,
            status: true,
            participantsCount: true,
            trustScore: true,
          },
        },
        _count: {
          select: {
            airdrops: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { trustScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }

  async findProjectById(id: string) {
    return await this.prisma.project.findUnique({
      where: { id },
      include: {
        tokens: true,
        airdrops: {
          include: {
            _count: {
              select: {
                participations: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findProjectBySlug(slug: string) {
    return await this.prisma.project.findUnique({
      where: { slug },
      include: {
        tokens: true,
        airdrops: {
          where: { status: 'active' },
          include: {
            _count: {
              select: {
                participations: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // ========================================
  // ANALYTICS OPERATIONS
  // ========================================

  async getAirdropMetrics(airdropId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.prisma.airdropMetrics.findMany({
      where: {
        airdropId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getDailyStats(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      activeAirdrops,
      totalParticipations,
      newUsers,
      newParticipations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.airdrop.count({
        where: { status: 'active' },
      }),
      this.prisma.userAirdropParticipation.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.userAirdropParticipation.count({
        where: {
          registeredAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    return {
      date,
      totalUsers,
      activeAirdrops,
      totalParticipations,
      newUsers,
      newParticipations,
    };
  }

  async getUserActivityStats(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.prisma.userActivityLog.groupBy({
      by: ['action'],
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    });
  }

  // ========================================
  // SECURITY OPERATIONS
  // ========================================

  async findSecurityAlerts(activeOnly = true) {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    return await this.prisma.securityAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findScamReports(limit = 20, offset = 0) {
    return await this.prisma.scamReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  async updateAirdropParticipantCount(airdropId: string) {
    const count = await this.prisma.userAirdropParticipation.count({
      where: { airdropId },
    });

    return await this.prisma.airdrop.update({
      where: { id: airdropId },
      data: { participantsCount: count },
    });
  }

  async softDeleteModel(model: string, id: string) {
    // Generic soft delete for models that have isActive field
    const data = { isActive: false };
    
    switch (model) {
      case 'user':
        return await this.prisma.user.update({
          where: { id },
          data,
        });
      case 'project':
        return await this.prisma.project.update({
          where: { id },
          data,
        });
      case 'airdrop':
        return await this.prisma.airdrop.update({
          where: { id },
          data,
        });
      default:
        throw new Error(`Model ${model} not supported for soft delete`);
    }
  }

  async bulkUpdate<T>(model: string, where: any, data: any): Promise<{ count: number }> {
    switch (model) {
      case 'user':
        return await this.prisma.user.updateMany({ where, data });
      case 'project':
        return await this.prisma.project.updateMany({ where, data });
      case 'airdrop':
        return await this.prisma.airdrop.updateMany({ where, data });
      default:
        throw new Error(`Model ${model} not supported for bulk update`);
    }
  }

  // ========================================
  // TRANSACTION OPERATIONS
  // ========================================

  async transaction<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(callback);
  }

  async batch(operations: any[]) {
    return await this.prisma.$transaction(operations);
  }
}

export const db = DatabaseService.getInstance();
export { DatabaseService };