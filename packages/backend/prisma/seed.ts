import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await cleanDatabase();

  // Create seed data
  await createUsers();
  await createProjects();
  await createTokens();
  await createAirdrops();
  await createAirdropRequirements();
  await createShillingCampaigns();
  await createSecurityAlerts();
  await createMarketData();
  await createSystemMetrics();

  console.log('✅ Database seeding completed successfully!');
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');
  
  // Delete in order of dependencies
  await prisma.userActivityLog.deleteMany();
  await prisma.userNotification.deleteMany();
  await prisma.userAirdropParticipation.deleteMany();
  await prisma.userRequirementCompletion.deleteMany();
  await prisma.airdropMetrics.deleteMany();
  await prisma.airdropHistoricalData.deleteMany();
  await prisma.airdropRequirement.deleteMany();
  await prisma.airdrop.deleteMany();
  await prisma.shillingMetrics.deleteMany();
  await prisma.shillingPayment.deleteMany();
  await prisma.shillingParticipation.deleteMany();
  await prisma.shillingCampaign.deleteMany();
  await prisma.auditReport.deleteMany();
  await prisma.securityAlert.deleteMany();
  await prisma.scamReport.deleteMany();
  await prisma.marketData.deleteMany();
  await prisma.systemMetrics.deleteMany();
  await prisma.token.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userWallet.deleteMany();
  await prisma.userSubscription.deleteMany();
  await prisma.userSecuritySettings.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.user.deleteMany();
}

async function createUsers() {
  console.log('👥 Creating users...');

  const hashedPassword = await hash('password123');

  const users = [
    {
      email: 'admin@dropiq.io',
      username: 'admin',
      displayName: 'DropIQ Admin',
      bio: 'Platform administrator',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isPremium: true,
      referralCode: 'ADMIN2024',
    },
    {
      email: 'john.doe@example.com',
      username: 'johndoe',
      displayName: 'John Doe',
      bio: 'Crypto enthusiast and airdrop hunter',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isPremium: false,
      referralCode: 'JOHN2024',
      referredBy: 'ADMIN2024',
    },
    {
      email: 'jane.smith@example.com',
      username: 'janesmith',
      displayName: 'Jane Smith',
      bio: 'DeFi researcher and content creator',
      walletAddress: '0x8ba1f109551bD432803012645Hac136c',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isPremium: true,
      referralCode: 'JANE2024',
    },
    {
      email: 'crypto.whale@example.com',
      username: 'cryptowhale',
      displayName: 'Crypto Whale',
      bio: 'Professional airdrop participant',
      walletAddress: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isPremium: true,
      referralCode: 'WHALE2024',
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.create({ data: userData });
    
    // Create user preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        airdropAlerts: true,
        priceAlerts: user.isPremium,
        weeklyDigest: true,
        securityAlerts: true,
        marketingEmails: false,
        showWalletAddress: false,
        showAirdropHistory: true,
        autoJoinAirdrops: false,
        minRewardThreshold: 10,
        preferredBlockchains: ['ethereum', 'polygon', 'bsc'],
        preferredCategories: ['defi', 'gaming', 'infrastructure'],
      },
    });

    // Create user security settings
    await prisma.userSecuritySettings.create({
      data: {
        userId: user.id,
        twoFactorEnabled: user.username === 'admin',
        sessionTimeout: 24,
        securityScore: 80,
      },
    });

    // Create user subscription
    const plan = user.isPremium ? 'premium' : 'free';
    const status = user.isPremium ? 'active' : 'active';
    
    await prisma.userSubscription.create({
      data: {
        userId: user.id,
        plan,
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: user.isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        features: user.isPremium ? 
          ['advanced_analytics', 'priority_support', 'early_access', 'api_access'] : 
          ['basic_analytics', 'community_support'],
      },
    });

    // Create user wallets
    if (user.walletAddress) {
      await prisma.userWallet.create({
        data: {
          userId: user.id,
          address: user.walletAddress,
          blockchain: 'ethereum',
          nickname: 'Main Wallet',
          isPrimary: true,
          isVerified: true,
          balance: Math.random() * 10,
        },
      });
    }

    console.log(`✅ Created user: ${user.username}`);
  }
}

async function createProjects() {
  console.log('🚀 Creating projects...');

  const projects = [
    {
      name: 'Ethereum Layer 2',
      slug: 'ethereum-layer2',
      description: 'Next-generation layer 2 scaling solution for Ethereum with instant transactions and low fees.',
      website: 'https://ethereum-layer2.example.com',
      logo: 'https://example.com/logos/ethereum-layer2.png',
      category: 'infrastructure',
      blockchain: 'ethereum',
      contractAddress: '0x1234567890123456789012345678901234567890',
      trustScore: 95,
      verificationStatus: 'verified',
      featured: true,
      tags: ['layer2', 'scaling', 'ethereum', 'defi'],
      socialLinks: {
        twitter: 'https://twitter.com/ethereumlayer2',
        discord: 'https://discord.gg/ethereumlayer2',
        telegram: 'https://t.me/ethereumlayer2',
      },
    },
    {
      name: 'GameFi Protocol',
      slug: 'gamefi-protocol',
      description: 'Decentralized gaming protocol that enables play-to-earn mechanics and NFT integration.',
      website: 'https://gamefi.example.com',
      logo: 'https://example.com/logos/gamefi.png',
      category: 'gaming',
      blockchain: 'polygon',
      contractAddress: '0x2345678901234567890123456789012345678901',
      trustScore: 88,
      verificationStatus: 'verified',
      featured: true,
      tags: ['gaming', 'nft', 'play-to-earn', 'metaverse'],
      socialLinks: {
        twitter: 'https://twitter.com/gamefiprotocol',
        discord: 'https://discord.gg/gamefiprotocol',
      },
    },
    {
      name: 'DeFi Yield Optimizer',
      slug: 'defi-yield-optimizer',
      description: 'Automated yield farming protocol that optimizes returns across multiple DeFi platforms.',
      website: 'https://defiyield.example.com',
      logo: 'https://example.com/logos/defiyield.png',
      category: 'defi',
      blockchain: 'bsc',
      contractAddress: '0x3456789012345678901234567890123456789012',
      trustScore: 92,
      verificationStatus: 'verified',
      featured: false,
      tags: ['defi', 'yield', 'farming', 'automation'],
      socialLinks: {
        twitter: 'https://twitter.com/defiyield',
        discord: 'https://discord.gg/defiyield',
        telegram: 'https://t.me/defiyield',
      },
    },
    {
      name: 'NFT Marketplace Pro',
      slug: 'nft-marketplace-pro',
      description: 'Advanced NFT marketplace with reduced fees, enhanced features, and creator tools.',
      website: 'https://nftmarket.example.com',
      logo: 'https://example.com/logos/nftmarket.png',
      category: 'nft',
      blockchain: 'ethereum',
      contractAddress: '0x4567890123456789012345678901234567890123',
      trustScore: 85,
      verificationStatus: 'verified',
      featured: false,
      tags: ['nft', 'marketplace', 'art', 'collectibles'],
      socialLinks: {
        twitter: 'https://twitter.com/nftmarketpro',
        discord: 'https://discord.gg/nftmarketpro',
      },
    },
  ];

  for (const projectData of projects) {
    const project = await prisma.project.create({ data: projectData });
    console.log(`✅ Created project: ${project.name}`);
  }
}

async function createTokens() {
  console.log('🪙 Creating tokens...');

  const projects = await prisma.project.findMany();
  
  const tokens = [
    {
      projectId: projects[0].id, // Ethereum Layer 2
      symbol: 'EL2',
      name: 'Ethereum Layer 2 Token',
      contractAddress: '0x1234567890123456789012345678901234567890',
      decimals: 18,
      totalSupply: '1000000000',
      circulatingSupply: '500000000',
      price: 2.50,
      marketCap: 1250000000,
      volume24h: 25000000,
      priceChange24h: 5.2,
      blockchain: 'ethereum',
      coingeckoId: 'ethereum-layer-2',
    },
    {
      projectId: projects[1].id, // GameFi Protocol
      symbol: 'GAME',
      name: 'GameFi Protocol Token',
      contractAddress: '0x2345678901234567890123456789012345678901',
      decimals: 18,
      totalSupply: '1000000000',
      circulatingSupply: '300000000',
      price: 0.85,
      marketCap: 255000000,
      volume24h: 8500000,
      priceChange24h: -2.1,
      blockchain: 'polygon',
      coingeckoId: 'gamefi-protocol',
    },
    {
      projectId: projects[2].id, // DeFi Yield Optimizer
      symbol: 'YIELD',
      name: 'DeFi Yield Optimizer Token',
      contractAddress: '0x3456789012345678901234567890123456789012',
      decimals: 18,
      totalSupply: '100000000',
      circulatingSupply: '75000000',
      price: 15.75,
      marketCap: 1181250000,
      volume24h: 12000000,
      priceChange24h: 8.7,
      blockchain: 'bsc',
      coingeckoId: 'defi-yield-optimizer',
    },
    {
      projectId: projects[3].id, // NFT Marketplace Pro
      symbol: 'NFTMP',
      name: 'NFT Marketplace Pro Token',
      contractAddress: '0x4567890123456789012345678901234567890123',
      decimals: 18,
      totalSupply: '500000000',
      circulatingSupply: '200000000',
      price: 1.25,
      marketCap: 250000000,
      volume24h: 3500000,
      priceChange24h: 3.4,
      blockchain: 'ethereum',
      coingeckoId: 'nft-marketplace-pro',
    },
  ];

  for (const tokenData of tokens) {
    const token = await prisma.token.create({ data: tokenData });
    console.log(`✅ Created token: ${token.symbol}`);
  }
}

async function createAirdrops() {
  console.log('🎯 Creating airdrops...');

  const projects = await prisma.project.findMany();
  const tokens = await prisma.token.findMany();

  const airdrops = [
    {
      title: 'Ethereum Layer 2 Mainnet Launch',
      slug: 'ethereum-layer2-mainnet-launch',
      description: 'Celebrate the launch of Ethereum Layer 2 mainnet with a massive airdrop to early supporters and community members.',
      shortDescription: 'Join the EL2 ecosystem and receive tokens',
      projectId: projects[0].id,
      tokenId: tokens[0].id,
      status: 'active',
      type: 'standard',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      claimDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      totalAmount: '10000000',
      tokenSymbol: 'EL2',
      maxParticipants: 50000,
      minRewardAmount: 100,
      maxRewardAmount: 1000,
      averageReward: 200,
      rewardDistribution: 'tiered',
      verificationRequired: true,
      kycRequired: false,
      gasRequired: false,
      trustScore: 95,
      featured: true,
      trending: true,
      tags: ['layer2', 'ethereum', 'scaling', 'defi'],
      socialLinks: {
        twitter: 'https://twitter.com/ethereumlayer2',
        discord: 'https://discord.gg/ethereumlayer2',
      },
    },
    {
      title: 'GameFi Protocol Gaming Airdrop',
      slug: 'gamefi-protocol-gaming-airdrop',
      description: 'Exclusive airdrop for gamers and NFT collectors. Complete gaming tasks to earn GAME tokens.',
      shortDescription: 'Play games, earn tokens',
      projectId: projects[1].id,
      tokenId: tokens[1].id,
      status: 'upcoming',
      type: 'nft',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      claimDeadline: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
      totalAmount: '5000000',
      tokenSymbol: 'GAME',
      maxParticipants: 25000,
      minRewardAmount: 50,
      maxRewardAmount: 500,
      averageReward: 150,
      rewardDistribution: 'proportional',
      verificationRequired: false,
      kycRequired: false,
      gasRequired: true,
      estimatedGas: 0.01,
      trustScore: 88,
      featured: true,
      trending: false,
      tags: ['gaming', 'nft', 'play-to-earn'],
    },
    {
      title: 'DeFi Yield Optimizer Early Adopter',
      slug: 'defi-yield-optimizer-early-adopter',
      description: 'Reward early adopters of the DeFi Yield Optimizer protocol with YIELD tokens.',
      shortDescription: 'Early adopter rewards',
      projectId: projects[2].id,
      tokenId: tokens[2].id,
      status: 'active',
      type: 'token',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      claimDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAmount: '1000000',
      tokenSymbol: 'YIELD',
      maxParticipants: 10000,
      minRewardAmount: 25,
      maxRewardAmount: 250,
      averageReward: 100,
      rewardDistribution: 'equal',
      verificationRequired: true,
      kycRequired: true,
      gasRequired: false,
      trustScore: 92,
      featured: false,
      trending: true,
      tags: ['defi', 'yield', 'farming'],
    },
  ];

  for (const airdropData of airdrops) {
    const airdrop = await prisma.airdrop.create({ data: airdropData });
    console.log(`✅ Created airdrop: ${airdrop.title}`);
  }
}

async function createAirdropRequirements() {
  console.log('📋 Creating airdrop requirements...');

  const airdrops = await prisma.airdrop.findMany();

  const requirements = [
    // Ethereum Layer 2 Requirements
    {
      airdropId: airdrops[0].id,
      type: 'twitter_follow',
      title: 'Follow Ethereum Layer 2 on Twitter',
      description: 'Follow our official Twitter account to stay updated with the latest news and announcements.',
      instructions: 'Click the button below to follow our Twitter account.',
      points: 10,
      isRequired: true,
      order: 1,
    },
    {
      airdropId: airdrops[0].id,
      type: 'discord_join',
      title: 'Join Discord Community',
      description: 'Join our Discord server to connect with the community and get support.',
      instructions: 'Click the invite link to join our Discord server.',
      points: 15,
      isRequired: true,
      order: 2,
    },
    {
      airdropId: airdrops[0].id,
      type: 'wallet_connect',
      title: 'Connect Your Wallet',
      description: 'Connect your Ethereum wallet to receive airdrop rewards.',
      instructions: 'Connect your wallet using the wallet connector.',
      points: 25,
      isRequired: true,
      order: 3,
    },
    {
      airdropId: airdrops[0].id,
      type: 'visit_website',
      title: 'Visit Our Website',
      description: 'Learn more about Ethereum Layer 2 by visiting our official website.',
      instructions: 'Visit our website and explore the features.',
      points: 5,
      isRequired: false,
      order: 4,
    },

    // GameFi Protocol Requirements
    {
      airdropId: airdrops[1].id,
      type: 'twitter_follow',
      title: 'Follow GameFi Protocol',
      description: 'Follow GameFi Protocol on Twitter for gaming updates.',
      points: 10,
      isRequired: true,
      order: 1,
    },
    {
      airdropId: airdrops[1].id,
      type: 'telegram_join',
      title: 'Join Telegram Group',
      description: 'Join our Telegram group for gaming discussions.',
      points: 15,
      isRequired: true,
      order: 2,
    },
    {
      airdropId: airdrops[1].id,
      type: 'complete_quiz',
      title: 'Complete Gaming Quiz',
      description: 'Test your knowledge about GameFi and blockchain gaming.',
      points: 20,
      isRequired: true,
      order: 3,
    },

    // DeFi Yield Optimizer Requirements
    {
      airdropId: airdrops[2].id,
      type: 'wallet_connect',
      title: 'Connect DeFi Wallet',
      description: 'Connect your wallet to interact with DeFi protocols.',
      points: 20,
      isRequired: true,
      order: 1,
    },
    {
      airdropId: airdrops[2].id,
      type: 'hold_token',
      title: 'Hold Minimum 0.1 ETH',
      description: 'Hold at least 0.1 ETH in your wallet to qualify.',
      points: 30,
      isRequired: true,
      order: 2,
    },
    {
      airdropId: airdrops[2].id,
      type: 'subscribe_newsletter',
      title: 'Subscribe to Newsletter',
      description: 'Subscribe to our newsletter for DeFi insights.',
      points: 10,
      isRequired: false,
      order: 3,
    },
  ];

  for (const reqData of requirements) {
    const requirement = await prisma.airdropRequirement.create({ data: reqData });
    console.log(`✅ Created requirement: ${requirement.title}`);
  }
}

async function createShillingCampaigns() {
  console.log('💰 Creating shilling campaigns...');

  const users = await prisma.user.findMany({ where: { isPremium: true } });
  const projects = await prisma.project.findMany();

  const campaigns = [
    {
      title: 'Ethereum Layer 2 Social Media Campaign',
      description: 'Promote Ethereum Layer 2 across social media platforms and earn rewards.',
      campaignType: 'social_media',
      projectId: projects[0].id,
      creatorId: users[1].id, // john.doe
      budget: 5000,
      currency: 'USD',
      paymentMethod: 'crypto',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxParticipants: 50,
      currentParticipants: 12,
      rewardPerAction: 25,
      rewardType: 'fixed',
      verificationNeeded: true,
      escrowEnabled: true,
      tags: ['social-media', 'promotion', 'ethereum'],
    },
    {
      title: 'GameFi Protocol Content Creation',
      description: 'Create high-quality content about GameFi Protocol and earn rewards.',
      campaignType: 'review',
      projectId: projects[1].id,
      creatorId: users[2].id, // jane.smith
      budget: 3000,
      currency: 'USD',
      paymentMethod: 'platform_tokens',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      maxParticipants: 25,
      currentParticipants: 8,
      rewardPerAction: 100,
      rewardType: 'tiered',
      verificationNeeded: true,
      autoApproval: false,
      escrowEnabled: true,
      tags: ['content', 'review', 'gaming'],
    },
  ];

  for (const campaignData of campaigns) {
    const campaign = await prisma.shillingCampaign.create({ data: campaignData });
    console.log(`✅ Created campaign: ${campaign.title}`);
  }
}

async function createSecurityAlerts() {
  console.log('🚨 Creating security alerts...');

  const alerts = [
    {
      type: 'scam_detected',
      severity: 'high',
      title: 'Phishing Alert: Fake Ethereum Layer 2 Airdrop',
      message: 'A phishing website is impersonating Ethereum Layer 2 and asking for private keys. Never share your private keys.',
      targetAudience: 'all',
      isActive: true,
      dismissible: true,
      actionRequired: true,
      actionUrl: 'https://dropiq.io/security/eth-layer2-phishing',
      actionText: 'Learn More',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'security_breach',
      severity: 'medium',
      title: 'Security Update: Wallet Connection',
      message: 'We recommend updating your wallet connection settings for enhanced security.',
      targetAudience: 'premium',
      isActive: true,
      dismissible: true,
      actionRequired: false,
      actionUrl: 'https://dropiq.io/settings/security',
      actionText: 'Update Settings',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'announcement',
      severity: 'low',
      title: 'New Feature: Advanced Airdrop Analytics',
      message: 'Premium users now have access to advanced airdrop analytics and insights.',
      targetAudience: 'premium',
      isActive: true,
      dismissible: true,
      actionRequired: false,
      actionUrl: 'https://dropiq.io/analytics',
      actionText: 'View Analytics',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const alertData of alerts) {
    const alert = await prisma.securityAlert.create({ data: alertData });
    console.log(`✅ Created security alert: ${alert.title}`);
  }
}

async function createMarketData() {
  console.log('📊 Creating market data...');

  const marketData = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.75,
      marketCap: 845000000000,
      volume24h: 23000000000,
      priceChange1h: 0.5,
      priceChange24h: 2.3,
      priceChange7d: -1.2,
      circulatingSupply: 19500000,
      totalSupply: 21000000,
      source: 'coingecko',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2280.50,
      marketCap: 274000000000,
      volume24h: 12000000000,
      priceChange1h: 0.8,
      priceChange24h: 3.1,
      priceChange7d: 2.5,
      circulatingSupply: 120000000,
      totalSupply: 120000000,
      source: 'coingecko',
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      price: 0.85,
      marketCap: 7800000000,
      volume24h: 350000000,
      priceChange1h: -0.3,
      priceChange24h: 1.8,
      priceChange7d: 5.2,
      circulatingSupply: 9200000000,
      totalSupply: 10000000000,
      source: 'coingecko',
    },
  ];

  for (const data of marketData) {
    const market = await prisma.marketData.create({ data });
    console.log(`✅ Created market data: ${market.symbol}`);
  }
}

async function createSystemMetrics() {
  console.log('📈 Creating system metrics...');

  const metrics = [
    {
      metric: 'daily_users',
      value: 1250,
      unit: 'users',
    },
    {
      metric: 'active_airdrops',
      value: 15,
      unit: 'airdrops',
    },
    {
      metric: 'total_participants',
      value: 45678,
      unit: 'participants',
    },
    {
      metric: 'total_value_distributed',
      value: 2500000,
      unit: 'USD',
    },
    {
      metric: 'platform_trust_score',
      value: 92.5,
      unit: 'percentage',
    },
    {
      metric: 'premium_conversion_rate',
      value: 12.5,
      unit: 'percentage',
    },
  ];

  for (const metricData of metrics) {
    const metric = await prisma.systemMetrics.create({ data: metricData });
    console.log(`✅ Created system metric: ${metric.metric}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });