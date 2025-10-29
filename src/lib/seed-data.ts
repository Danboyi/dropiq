import { db } from '@/lib/db';

export async function seedSampleData() {
  try {
    // Create sample users
    const users = await Promise.all([
      db.user.upsert({
        where: { username: 'crypto_whale' },
        update: {},
        create: {
          username: 'crypto_whale',
          email: 'whale@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto_whale',
          bio: 'Professional airdrop farmer with 5+ years of experience',
          reputation: 2500,
          level: 15,
          experience: 1500,
        }
      }),
      db.user.upsert({
        where: { username: 'defi_degen' },
        update: {},
        create: {
          username: 'defi_degen',
          email: 'degen@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=defi_degen',
          bio: 'DeFi enthusiast and airdrop chaser',
          reputation: 1800,
          level: 12,
          experience: 1200,
        }
      }),
      db.user.upsert({
        where: { username: 'nft_collector' },
        update: {},
        create: {
          username: 'nft_collector',
          email: 'collector@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nft_collector',
          bio: 'NFT collector and airdrop participant',
          reputation: 1200,
          level: 8,
          experience: 800,
        }
      })
    ]);

    // Create sample achievements
    const achievements = await Promise.all([
      db.achievement.upsert({
        where: { name: 'first_steps' },
        update: {},
        create: {
          name: 'first_steps',
          title: 'First Steps',
          description: 'Complete your first airdrop task',
          icon: 'Trophy',
          category: 'milestone',
          rarity: 'common',
          points: 10,
          requirement: { type: 'first_task' },
        }
      }),
      db.achievement.upsert({
        where: { name: 'airdrop_hunter' },
        update: {},
        create: {
          name: 'airdrop_hunter',
          title: 'Airdrop Hunter',
          description: 'Complete 10 airdrop tasks',
          icon: 'Target',
          category: 'milestone',
          rarity: 'uncommon',
          points: 50,
          requirement: { type: 'complete_tasks', count: 10 },
        }
      }),
      db.achievement.upsert({
        where: { name: 'strategy_master' },
        update: {},
        create: {
          name: 'strategy_master',
          title: 'Strategy Master',
          description: 'Create a strategy with 100+ likes',
          icon: 'Star',
          category: 'social',
          rarity: 'rare',
          points: 100,
          requirement: { type: 'strategy_likes', count: 100 },
        }
      })
    ]);

    // Create sample badges
    const badges = await Promise.all([
      db.badge.upsert({
        where: { name: 'early_adopter' },
        update: {},
        create: {
          name: 'early_adopter',
          title: 'Early Adopter',
          description: 'Joined DROPIQ in the first month',
          icon: 'Zap',
          category: 'special',
          type: 'special',
          rarity: 'legendary',
          requirements: { join_date: 'first_month' },
        }
      }),
      db.badge.upsert({
        where: { name: 'top_contributor' },
        update: {},
        create: {
          name: 'top_contributor',
          title: 'Top Contributor',
          description: 'Top 10 contributor of the month',
          icon: 'Award',
          category: 'community',
          type: 'automatic',
          rarity: 'epic',
          requirements: { rank: 10, period: 'monthly' },
        }
      })
    ]);

    // Create sample strategies
    const strategies = await Promise.all([
      db.strategy.create({
        data: {
          title: 'Complete Guide to Layer 2 Airdrops',
          description: 'Step-by-step strategy for maximizing Layer 2 airdrop potential',
          content: 'This comprehensive guide covers all major Layer 2 airdrops...',
          category: 'layer2',
          difficulty: 'intermediate',
          riskLevel: 'medium',
          estimatedTime: 120,
          requiredActions: 8,
          potentialReward: 5000,
          estimatedProfit: 3000,
          successRate: 75,
          steps: [
            { step: 1, action: 'Research Layer 2 projects', description: 'Identify promising L2 projects' },
            { step: 2, action: 'Set up wallets', description: 'Configure wallets for each L2' },
            { step: 3, action: 'Bridge funds', description: 'Move assets to L2 networks' },
            { step: 4, action: 'Interact with protocols', description: 'Use dApps on each L2' }
          ],
          tags: ['layer2', 'arbitrum', 'optimism', 'zk'],
          isPublic: true,
          isVerified: true,
          views: 1250,
          likes: 89,
          shares: 23,
          authorId: users[0].id,
        }
      }),
      db.strategy.create({
        data: {
          title: 'NFT Minting Airdrop Strategy',
          description: 'How to identify and participate in NFT project airdrops',
          content: 'NFT projects often have airdrops for early minters...',
          category: 'nft',
          difficulty: 'beginner',
          riskLevel: 'high',
          estimatedTime: 60,
          requiredActions: 5,
          potentialReward: 2000,
          estimatedProfit: 800,
          successRate: 60,
          steps: [
            { step: 1, action: 'Find new NFT projects', description: 'Research upcoming NFT launches' },
            { step: 2, action: 'Join communities', description: 'Become active in Discord/Telegram' },
            { step: 3, action: 'Mint NFTs', description: 'Participate in minting events' },
            { step: 4, action: 'Hold tokens', description: 'Keep NFTs for potential airdrops' }
          ],
          tags: ['nft', 'minting', 'opensea', 'blur'],
          isPublic: true,
          isVerified: false,
          views: 850,
          likes: 56,
          shares: 15,
          authorId: users[1].id,
        }
      }),
      db.strategy.create({
        data: {
          title: 'DeFi Liquidity Mining Airdrops',
          description: 'Maximize returns through DeFi liquidity mining programs',
          content: 'Liquidity mining can be a great source of airdrops...',
          category: 'defi',
          difficulty: 'advanced',
          riskLevel: 'high',
          estimatedTime: 180,
          requiredActions: 12,
          potentialReward: 10000,
          estimatedProfit: 5000,
          successRate: 65,
          steps: [
            { step: 1, action: 'Research DeFi protocols', description: 'Find high-yield opportunities' },
            { step: 2, action: 'Provide liquidity', description: 'Add liquidity to pools' },
            { step: 3, action: 'Stake LP tokens', description: 'Lock liquidity provider tokens' },
            { step: 4, action: 'Compound rewards', description: 'Reinvest earnings' }
          ],
          tags: ['defi', 'liquidity', 'uniswap', 'curve'],
          isPublic: true,
          isVerified: true,
          views: 2100,
          likes: 143,
          shares: 41,
          authorId: users[2].id,
        }
      })
    ]);

    // Unlock some achievements for users
    await Promise.all([
      db.userAchievement.upsert({
        where: { userId_achievementId: { userId: users[0].id, achievementId: achievements[0].id } },
        update: {},
        create: {
          userId: users[0].id,
          achievementId: achievements[0].id,
          progress: 100,
          isUnlocked: true,
          unlockedAt: new Date(),
        }
      }),
      db.userAchievement.upsert({
        where: { userId_achievementId: { userId: users[0].id, achievementId: achievements[1].id } },
        update: {},
        create: {
          userId: users[0].id,
          achievementId: achievements[1].id,
          progress: 100,
          isUnlocked: true,
          unlockedAt: new Date(),
        }
      }),
      db.userAchievement.upsert({
        where: { userId_achievementId: { userId: users[1].id, achievementId: achievements[0].id } },
        update: {},
        create: {
          userId: users[1].id,
          achievementId: achievements[0].id,
          progress: 100,
          isUnlocked: true,
          unlockedAt: new Date(),
        }
      })
    ]);

    // Award some badges
    await Promise.all([
      db.userBadge.upsert({
        where: { userId_badgeId: { userId: users[0].id, badgeId: badges[0].id } },
        update: {},
        create: {
          userId: users[0].id,
          badgeId: badges[0].id,
          isActive: true,
        }
      }),
      db.userBadge.upsert({
        where: { userId_badgeId: { userId: users[1].id, badgeId: badges[1].id } },
        update: {},
        create: {
          userId: users[1].id,
          badgeId: badges[1].id,
          isActive: true,
        }
      })
    ]);

    console.log('Sample data seeded successfully!');
    return { users, achievements, badges, strategies };
  } catch (error) {
    console.error('Error seeding sample data:', error);
    throw error;
  }
}