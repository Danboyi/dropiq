import { db } from '@/lib/db';
import type { 
  Strategy, 
  StrategyShare, 
  StrategyComment, 
  StrategyRating,
  StrategyCreateData,
  StrategyUpdateData,
  StrategyFilter
} from '@/types/user-profile';

export class StrategyService {
  // 创建策略
  static async createStrategy(authorId: string, data: StrategyCreateData): Promise<Strategy> {
    try {
      const strategy = await db.strategy.create({
        data: {
          title: data.title,
          description: data.description,
          content: data.content,
          category: data.category,
          difficulty: data.difficulty,
          estimatedTime: data.estimatedTime,
          requiredActions: data.requiredActions,
          potentialReward: data.potentialReward,
          riskLevel: data.riskLevel,
          tags: data.tags,
          authorId,
          isPublic: data.isPublic ?? false,
          isVerified: false,
          views: 0,
          likes: 0,
          shares: 0,
          successRate: 0,
          estimatedProfit: data.estimatedProfit || 0
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              reputation: true
            }
          },
          comments: {
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
              createdAt: 'desc'
            }
          },
          ratings: true
        }
      });

      return {
        id: strategy.id,
        title: strategy.title,
        description: strategy.description,
        category: strategy.category as any,
        difficulty: strategy.difficulty as any,
        estimatedTime: strategy.estimatedTime,
        requiredActions: strategy.requiredActions,
        potentialReward: strategy.potentialReward,
        riskLevel: strategy.riskLevel as any,
        tags: strategy.tags as string[],
        content: strategy.content,
        author: strategy.author,
        metrics: {
          views: strategy.views,
          likes: strategy.likes,
          shares: strategy.shares,
          successRate: strategy.successRate,
          estimatedProfit: strategy.estimatedProfit,
          difficulty: strategy.difficulty as any
        },
        comments: strategy.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          user: comment.user,
          createdAt: comment.createdAt,
          likes: comment.likes,
          replies: [] // 需要实现回复逻辑
        })),
        ratings: strategy.ratings.map(rating => ({
          id: rating.id,
          userId: rating.userId,
          rating: rating.rating,
          review: rating.review,
          createdAt: rating.createdAt
        })),
        isPublic: strategy.isPublic,
        isVerified: strategy.isVerified,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt
      };
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw new Error('Failed to create strategy');
    }
  }

  // 获取策略列表
  static async getStrategies(filter: StrategyFilter = {}): Promise<{ strategies: Strategy[], total: number }> {
    try {
      const where: any = {};
      
      if (filter.category) {
        where.category = filter.category;
      }
      
      if (filter.difficulty) {
        where.difficulty = filter.difficulty;
      }
      
      if (filter.riskLevel) {
        where.riskLevel = filter.riskLevel;
      }
      
      if (filter.isPublic !== undefined) {
        where.isPublic = filter.isPublic;
      }
      
      if (filter.isVerified !== undefined) {
        where.isVerified = filter.isVerified;
      }
      
      if (filter.authorId) {
        where.authorId = filter.authorId;
      }
      
      if (filter.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
          { tags: { has: filter.search } }
        ];
      }

      const orderBy: any = {};
      if (filter.sortBy) {
        orderBy[filter.sortBy] = filter.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [strategies, total] = await Promise.all([
        db.strategy.findMany({
          where,
          orderBy,
          skip: filter.offset || 0,
          take: filter.limit || 20,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
                reputation: true
              }
            },
            comments: {
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
                createdAt: 'desc'
              },
              take: 3
            },
            ratings: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            }
          }
        }),
        db.strategy.count({ where })
      ]);

      const formattedStrategies = strategies.map(strategy => ({
        id: strategy.id,
        title: strategy.title,
        description: strategy.description,
        category: strategy.category as any,
        difficulty: strategy.difficulty as any,
        estimatedTime: strategy.estimatedTime,
        requiredActions: strategy.requiredActions,
        potentialReward: strategy.potentialReward,
        riskLevel: strategy.riskLevel as any,
        tags: strategy.tags as string[],
        content: strategy.content,
        author: strategy.author,
        metrics: {
          views: strategy.views,
          likes: strategy.likes,
          shares: strategy.shares,
          successRate: strategy.successRate,
          estimatedProfit: strategy.estimatedProfit,
          difficulty: strategy.difficulty as any
        },
        comments: strategy.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          user: comment.user,
          createdAt: comment.createdAt,
          likes: comment.likes,
          replies: []
        })),
        ratings: strategy.ratings.map(rating => ({
          id: rating.id,
          userId: rating.userId,
          rating: rating.rating,
          review: rating.review,
          createdAt: rating.createdAt
        })),
        isPublic: strategy.isPublic,
        isVerified: strategy.isVerified,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt
      }));

      return { strategies: formattedStrategies, total };
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw new Error('Failed to fetch strategies');
    }
  }

  // 获取单个策略
  static async getStrategy(strategyId: string): Promise<Strategy | null> {
    try {
      const strategy = await db.strategy.findUnique({
        where: { id: strategyId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              reputation: true
            }
          },
          comments: {
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
              createdAt: 'desc'
            }
          },
          ratings: {
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
              createdAt: 'desc'
            }
          }
        }
      });

      if (!strategy) return null;

      // 增加浏览次数
      await db.strategy.update({
        where: { id: strategyId },
        data: {
          views: strategy.views + 1
        }
      });

      return {
        id: strategy.id,
        title: strategy.title,
        description: strategy.description,
        category: strategy.category as any,
        difficulty: strategy.difficulty as any,
        estimatedTime: strategy.estimatedTime,
        requiredActions: strategy.requiredActions,
        potentialReward: strategy.potentialReward,
        riskLevel: strategy.riskLevel as any,
        tags: strategy.tags as string[],
        content: strategy.content,
        author: strategy.author,
        metrics: {
          views: strategy.views + 1,
          likes: strategy.likes,
          shares: strategy.shares,
          successRate: strategy.successRate,
          estimatedProfit: strategy.estimatedProfit,
          difficulty: strategy.difficulty as any
        },
        comments: strategy.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          user: comment.user,
          createdAt: comment.createdAt,
          likes: comment.likes,
          replies: []
        })),
        ratings: strategy.ratings.map(rating => ({
          id: rating.id,
          userId: rating.userId,
          rating: rating.rating,
          review: rating.review,
          createdAt: rating.createdAt
        })),
        isPublic: strategy.isPublic,
        isVerified: strategy.isVerified,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt
      };
    } catch (error) {
      console.error('Error fetching strategy:', error);
      throw new Error('Failed to fetch strategy');
    }
  }

  // 更新策略
  static async updateStrategy(strategyId: string, authorId: string, data: StrategyUpdateData): Promise<Strategy> {
    try {
      // 验证权限
      const existingStrategy = await db.strategy.findUnique({
        where: { id: strategyId }
      });

      if (!existingStrategy) {
        throw new Error('Strategy not found');
      }

      if (existingStrategy.authorId !== authorId) {
        throw new Error('Not authorized to update this strategy');
      }

      const updatedStrategy = await db.strategy.update({
        where: { id: strategyId },
        data: {
          title: data.title,
          description: data.description,
          content: data.content,
          category: data.category,
          difficulty: data.difficulty,
          estimatedTime: data.estimatedTime,
          requiredActions: data.requiredActions,
          potentialReward: data.potentialReward,
          riskLevel: data.riskLevel,
          tags: data.tags,
          isPublic: data.isPublic,
          estimatedProfit: data.estimatedProfit
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              reputation: true
            }
          },
          comments: {
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
              createdAt: 'desc'
            }
          },
          ratings: true
        }
      });

      return {
        id: updatedStrategy.id,
        title: updatedStrategy.title,
        description: updatedStrategy.description,
        category: updatedStrategy.category as any,
        difficulty: updatedStrategy.difficulty as any,
        estimatedTime: updatedStrategy.estimatedTime,
        requiredActions: updatedStrategy.requiredActions,
        potentialReward: updatedStrategy.potentialReward,
        riskLevel: updatedStrategy.riskLevel as any,
        tags: updatedStrategy.tags as string[],
        content: updatedStrategy.content,
        author: updatedStrategy.author,
        metrics: {
          views: updatedStrategy.views,
          likes: updatedStrategy.likes,
          shares: updatedStrategy.shares,
          successRate: updatedStrategy.successRate,
          estimatedProfit: updatedStrategy.estimatedProfit,
          difficulty: updatedStrategy.difficulty as any
        },
        comments: updatedStrategy.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          user: comment.user,
          createdAt: comment.createdAt,
          likes: comment.likes,
          replies: []
        })),
        ratings: updatedStrategy.ratings.map(rating => ({
          id: rating.id,
          userId: rating.userId,
          rating: rating.rating,
          review: rating.review,
          createdAt: rating.createdAt
        })),
        isPublic: updatedStrategy.isPublic,
        isVerified: updatedStrategy.isVerified,
        createdAt: updatedStrategy.createdAt,
        updatedAt: updatedStrategy.updatedAt
      };
    } catch (error) {
      console.error('Error updating strategy:', error);
      throw new Error('Failed to update strategy');
    }
  }

  // 删除策略
  static async deleteStrategy(strategyId: string, authorId: string): Promise<void> {
    try {
      const existingStrategy = await db.strategy.findUnique({
        where: { id: strategyId }
      });

      if (!existingStrategy) {
        throw new Error('Strategy not found');
      }

      if (existingStrategy.authorId !== authorId) {
        throw new Error('Not authorized to delete this strategy');
      }

      await db.strategy.delete({
        where: { id: strategyId }
      });
    } catch (error) {
      console.error('Error deleting strategy:', error);
      throw new Error('Failed to delete strategy');
    }
  }

  // 点赞策略
  static async likeStrategy(strategyId: string, userId: string): Promise<void> {
    try {
      // 检查是否已经点赞
      const existingLike = await db.strategyLike.findUnique({
        where: {
          userId_strategyId: {
            userId,
            strategyId
          }
        }
      });

      if (existingLike) {
        // 取消点赞
        await db.strategyLike.delete({
          where: {
            userId_strategyId: {
              userId,
              strategyId
            }
          }
        });
        
        await db.strategy.update({
          where: { id: strategyId },
          data: {
            likes: {
              decrement: 1
            }
          }
        });
      } else {
        // 添加点赞
        await db.strategyLike.create({
          data: {
            userId,
            strategyId
          }
        });
        
        await db.strategy.update({
          where: { id: strategyId },
          data: {
            likes: {
              increment: 1
            }
          }
        });
      }
    } catch (error) {
      console.error('Error liking strategy:', error);
      throw new Error('Failed to like strategy');
    }
  }

  // 添加评论
  static async addComment(strategyId: string, userId: string, content: string): Promise<StrategyComment> {
    try {
      const comment = await db.strategyComment.create({
        data: {
          strategyId,
          userId,
          content
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      return {
        id: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt,
        likes: comment.likes,
        replies: []
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  // 评分策略
  static async rateStrategy(strategyId: string, userId: string, rating: number, review?: string): Promise<StrategyRating> {
    try {
      // 检查是否已经评分
      const existingRating = await db.strategyRating.findUnique({
        where: {
          userId_strategyId: {
            userId,
            strategyId
          }
        }
      });

      if (existingRating) {
        // 更新评分
        const updatedRating = await db.strategyRating.update({
          where: {
            userId_strategyId: {
              userId,
              strategyId
            }
          },
          data: {
            rating,
            review
          }
        });

        return {
          id: updatedRating.id,
          userId: updatedRating.userId,
          rating: updatedRating.rating,
          review: updatedRating.review,
          createdAt: updatedRating.createdAt
        };
      } else {
        // 创建新评分
        const newRating = await db.strategyRating.create({
          data: {
            strategyId,
            userId,
            rating,
            review
          }
        });

        return {
          id: newRating.id,
          userId: newRating.userId,
          rating: newRating.rating,
          review: newRating.review,
          createdAt: newRating.createdAt
        };
      }
    } catch (error) {
      console.error('Error rating strategy:', error);
      throw new Error('Failed to rate strategy');
    }
  }

  // 分享策略
  static async shareStrategy(strategyId: string, userId: string, platform: string): Promise<StrategyShare> {
    try {
      const share = await db.strategyShare.create({
        data: {
          strategyId,
          userId,
          platform
        }
      });

      // 更新分享次数
      await db.strategy.update({
        where: { id: strategyId },
        data: {
          shares: {
            increment: 1
          }
        }
      });

      return {
        id: share.id,
        strategyId: share.strategyId,
        userId: share.userId,
        platform: share.platform,
        sharedAt: share.sharedAt
      };
    } catch (error) {
      console.error('Error sharing strategy:', error);
      throw new Error('Failed to share strategy');
    }
  }

  // 获取热门策略
  static async getTrendingStrategies(limit: number = 10): Promise<Strategy[]> {
    try {
      const strategies = await db.strategy.findMany({
        where: {
          isPublic: true
        },
        orderBy: [
          { likes: 'desc' },
          { views: 'desc' },
          { shares: 'desc' }
        ],
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
              reputation: true
            }
          },
          comments: {
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
              createdAt: 'desc'
            },
            take: 3
          },
          ratings: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        }
      });

      return strategies.map(strategy => ({
        id: strategy.id,
        title: strategy.title,
        description: strategy.description,
        category: strategy.category as any,
        difficulty: strategy.difficulty as any,
        estimatedTime: strategy.estimatedTime,
        requiredActions: strategy.requiredActions,
        potentialReward: strategy.potentialReward,
        riskLevel: strategy.riskLevel as any,
        tags: strategy.tags as string[],
        content: strategy.content,
        author: strategy.author,
        metrics: {
          views: strategy.views,
          likes: strategy.likes,
          shares: strategy.shares,
          successRate: strategy.successRate,
          estimatedProfit: strategy.estimatedProfit,
          difficulty: strategy.difficulty as any
        },
        comments: strategy.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          user: comment.user,
          createdAt: comment.createdAt,
          likes: comment.likes,
          replies: []
        })),
        ratings: strategy.ratings.map(rating => ({
          id: rating.id,
          userId: rating.userId,
          rating: rating.rating,
          review: rating.review,
          createdAt: rating.createdAt
        })),
        isPublic: strategy.isPublic,
        isVerified: strategy.isVerified,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching trending strategies:', error);
      throw new Error('Failed to fetch trending strategies');
    }
  }
}