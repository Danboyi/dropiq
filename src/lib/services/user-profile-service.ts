import { db } from '@/lib/db';
import type { 
  UserProfile, 
  Achievement, 
  UserAchievement, 
  Badge, 
  UserBadge,
  UserStats,
  LeaderboardEntry,
  UserProgress,
  Strategy,
  StrategyShare,
  StrategyComment,
  StrategyRating,
  UserFollow
} from '@/types/user-profile';

export class UserProfileService {
  // 获取用户完整档案
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await db.user.findUnique({
        where: { id: userId },
        include: {
          userAchievements: {
            include: {
              achievement: true
            },
            orderBy: {
              unlockedAt: 'desc'
            }
          },
          userBadges: {
            include: {
              badge: true
            },
            orderBy: {
              earnedAt: 'desc'
            }
          },
          strategies: {
            where: {
              isPublic: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 3
          },
          followers: {
            include: {
              follower: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  reputation: true
                }
              }
            }
          },
          following: {
            include: {
              following: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  reputation: true
                }
              }
            }
          }
        }
      });

      if (!profile) return null;

      // 获取用户统计信息
      const stats = await this.getUserStats(userId);
      
      // 获取关注状态
      const followersCount = await db.userFollow.count({
        where: { followingId: userId }
      });
      
      const followingCount = await db.userFollow.count({
        where: { followerId: userId }
      });

      return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
        reputation: profile.reputation,
        level: profile.level,
        experience: profile.experience,
        joinDate: profile.createdAt,
        lastActive: profile.lastActive,
        bio: profile.bio,
        preferences: profile.preferences as any,
        achievements: profile.userAchievements.map(ua => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          category: ua.achievement.category as any,
          rarity: ua.achievement.rarity as any,
          points: ua.achievement.points,
          unlockedAt: ua.unlockedAt,
          progress: ua.progress
        })),
        badges: profile.userBadges.map(ub => ({
          id: ub.badge.id,
          name: ub.badge.name,
          description: ub.badge.description,
          icon: ub.badge.icon,
          category: ub.badge.category as any,
          rarity: ub.badge.rarity as any,
          earnedAt: ub.earnedAt,
          isActive: ub.isActive
        })),
        stats,
        followersCount,
        followingCount,
        recentStrategies: profile.strategies.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          category: s.category as any,
          difficulty: s.difficulty as any,
          estimatedTime: s.estimatedTime,
          requiredActions: s.requiredActions,
          potentialReward: s.potentialReward,
          riskLevel: s.riskLevel as any,
          tags: s.tags as string[],
          author: {
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            reputation: profile.reputation
          },
          metrics: {
            views: s.views,
            likes: s.likes,
            shares: s.shares,
            successRate: s.successRate,
            estimatedProfit: s.estimatedProfit,
            difficulty: s.difficulty as any
          },
          isPublic: s.isPublic,
          isVerified: s.isVerified,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })),
        followers: profile.followers.map(f => f.follower),
        following: profile.following.map(f => f.following)
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // 获取用户统计信息
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      const [
        totalTasks,
        completedTasks,
        totalAirdrops,
        completedAirdrops,
        totalStrategies,
        totalEarnings,
        successRate
      ] = await Promise.all([
        db.userTaskProgress.count({
          where: { userId }
        }),
        db.userTaskProgress.count({
          where: { 
            userId,
            status: 'COMPLETED'
          }
        }),
        db.airdropCollection.count({
          where: { userId }
        }),
        db.airdropCollection.count({
          where: { 
            userId,
            status: 'COMPLETED'
          }
        }),
        db.strategy.count({
          where: { authorId: userId }
        }),
        db.userTaskProgress.aggregate({
          where: { 
            userId,
            status: 'COMPLETED'
          },
          _sum: {
            reward: true
          }
        }),
        this.calculateSuccessRate(userId)
      ]);

      return {
        totalTasks,
        completedTasks,
        totalAirdrops,
        completedAirdrops,
        totalStrategies,
        totalEarnings: totalEarnings._sum.reward || 0,
        successRate,
        joinDate: new Date(), // 需要从用户表获取
        lastActive: new Date()  // 需要从用户表获取
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user stats');
    }
  }

  // 计算成功率
  private static async calculateSuccessRate(userId: string): Promise<number> {
    try {
      const total = await db.userTaskProgress.count({
        where: { userId }
      });
      
      if (total === 0) return 0;
      
      const completed = await db.userTaskProgress.count({
        where: { 
          userId,
          status: 'COMPLETED'
        }
      });
      
      return Math.round((completed / total) * 100);
    } catch (error) {
      console.error('Error calculating success rate:', error);
      return 0;
    }
  }

  // 更新用户档案
  static async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const updatedProfile = await db.user.update({
        where: { id: userId },
        data: {
          username: data.username,
          avatar: data.avatar,
          bio: data.bio,
          preferences: data.preferences,
          lastActive: new Date()
        },
        include: {
          userAchievements: {
            include: {
              achievement: true
            }
          },
          userBadges: {
            include: {
              badge: true
            }
          }
        }
      });

      return await this.getUserProfile(userId) as UserProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // 解锁成就
  static async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    try {
      // 检查是否已经解锁
      const existing = await db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        }
      });

      if (existing) {
        throw new Error('Achievement already unlocked');
      }

      // 获取成就信息
      const achievement = await db.achievement.findUnique({
        where: { id: achievementId }
      });

      if (!achievement) {
        throw new Error('Achievement not found');
      }

      // 创建用户成就记录
      const userAchievement = await db.userAchievement.create({
        data: {
          userId,
          achievementId,
          progress: 100,
          unlockedAt: new Date()
        },
        include: {
          achievement: true
        }
      });

      // 更新用户经验值
      await this.updateUserExperience(userId, achievement.points);

      return {
        id: userAchievement.id,
        userId: userAchievement.userId,
        achievementId: userAchievement.achievementId,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category as any,
          rarity: achievement.rarity as any,
          points: achievement.points
        },
        progress: userAchievement.progress,
        unlockedAt: userAchievement.unlockedAt
      };
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw new Error('Failed to unlock achievement');
    }
  }

  // 更新用户经验值
  private static async updateUserExperience(userId: string, experience: number): Promise<void> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId }
      });

      if (!user) return;

      const newExperience = user.experience + experience;
      const newLevel = Math.floor(newExperience / 100) + 1; // 每100经验升一级

      await db.user.update({
        where: { id: userId },
        data: {
          experience: newExperience,
          level: newLevel,
          reputation: user.reputation + Math.floor(experience / 10) // 经验值的10%作为声望
        }
      });
    } catch (error) {
      console.error('Error updating user experience:', error);
    }
  }

  // 获取排行榜
  static async getLeaderboard(type: 'reputation' | 'earnings' | 'achievements', limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      let orderBy: any = {};
      
      switch (type) {
        case 'reputation':
          orderBy = { reputation: 'desc' };
          break;
        case 'earnings':
          // 需要计算总收益
          orderBy = { reputation: 'desc' }; // 临时使用声望排序
          break;
        case 'achievements':
          orderBy = { experience: 'desc' };
          break;
      }

      const users = await db.user.findMany({
        orderBy,
        take: limit,
        select: {
          id: true,
          username: true,
          avatar: true,
          reputation: true,
          level: true,
          experience: true,
          createdAt: true
        }
      });

      // 获取排名和成就数量
      const leaderboard = await Promise.all(
        users.map(async (user, index) => {
          const achievementsCount = await db.userAchievement.count({
            where: { userId: user.id }
          });

          return {
            rank: index + 1,
            user: {
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              reputation: user.reputation,
              level: user.level
            },
            value: type === 'reputation' ? user.reputation : 
                   type === 'achievements' ? achievementsCount : 
                   user.experience,
            change: 0 // 需要实现排名变化逻辑
          };
        })
      );

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error('Failed to fetch leaderboard');
    }
  }

  // 关注用户
  static async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }

      await db.userFollow.create({
        data: {
          followerId,
          followingId
        }
      });
    } catch (error) {
      console.error('Error following user:', error);
      throw new Error('Failed to follow user');
    }
  }

  // 取消关注
  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      await db.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw new Error('Failed to unfollow user');
    }
  }

  // 获取用户进度
  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      const userTasks = await db.userTaskProgress.findMany({
        where: { userId },
        include: {
          task: {
            include: {
              airdrop: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return userTasks.map(task => ({
        id: task.id,
        type: 'task',
        name: task.task.title,
        description: task.task.description,
        currentProgress: task.progress,
        maxProgress: 100,
        status: task.status as any,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        estimatedReward: task.reward,
        priority: 'medium' as any,
        dueDate: task.task.deadline,
        category: task.task.category as any,
        tags: task.task.tags as string[]
      }));
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch user progress');
    }
  }
}