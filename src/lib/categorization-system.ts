import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  level: number; // 0 = root, 1 = subcategory, 2 = sub-subcategory
  isActive: boolean;
  sortOrder: number;
  metadata: any;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  color?: string;
  isActive: boolean;
  usageCount: number;
  metadata: any;
}

export interface CategorizationResult {
  primaryCategory: string;
  secondaryCategories: string[];
  tags: string[];
  confidence: number;
  reasoning: string;
  metadata: any;
}

export class CategorizationService {
  private zai: ZAI;
  private categoryCache: Map<string, Category[]> = new Map();
  private tagCache: Map<string, Tag[]> = new Map();

  constructor() {
    this.zai = new ZAI();
  }

  async initialize() {
    try {
      await this.initializeDefaultCategories();
      await this.initializeDefaultTags();
      await this.loadCaches();
      
      logger.info('Categorization system initialized');
    } catch (error) {
      logger.error('Failed to initialize categorization system:', error);
    }
  }

  private async initializeDefaultCategories() {
    const defaultCategories = [
      // Level 0 - Main categories
      {
        name: 'DeFi',
        slug: 'defi',
        description: 'Decentralized Finance protocols and platforms',
        level: 0,
        sortOrder: 1,
        isActive: true,
        metadata: { icon: '💰', color: '#3B82F6' }
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Blockchain gaming and metaverse projects',
        level: 0,
        sortOrder: 2,
        isActive: true,
        metadata: { icon: '🎮', color: '#10B981' }
      },
      {
        name: 'NFT',
        slug: 'nft',
        description: 'Non-Fungible Token projects and marketplaces',
        level: 0,
        sortOrder: 3,
        isActive: true,
        metadata: { icon: '🎨', color: '#8B5CF6' }
      },
      {
        name: 'Infrastructure',
        slug: 'infrastructure',
        description: 'Blockchain infrastructure and developer tools',
        level: 0,
        sortOrder: 4,
        isActive: true,
        metadata: { icon: '⚙️', color: '#6B7280' }
      },
      {
        name: 'Layer 2',
        slug: 'layer2',
        description: 'Layer 2 scaling solutions',
        level: 0,
        sortOrder: 5,
        isActive: true,
        metadata: { icon: '🚀', color: '#F59E0B' }
      },
      {
        name: 'DAO',
        slug: 'dao',
        description: 'Decentralized Autonomous Organizations',
        level: 0,
        sortOrder: 6,
        isActive: true,
        metadata: { icon: '🏛️', color: '#EF4444' }
      },
      {
        name: 'Exchange',
        slug: 'exchange',
        description: 'Centralized and decentralized exchanges',
        level: 0,
        sortOrder: 7,
        isActive: true,
        metadata: { icon: '📊', color: '#06B6D4' }
      },
      {
        name: 'Social',
        slug: 'social',
        description: 'Social media and communication platforms',
        level: 0,
        sortOrder: 8,
        isActive: true,
        metadata: { icon: '💬', color: '#EC4899' }
      }
    ];

    for (const category of defaultCategories) {
      await db.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: {
          ...category,
          id: `cat_${category.slug}`
        }
      });
    }

    // Initialize subcategories
    await this.initializeSubcategories();
  }

  private async initializeSubcategories() {
    const subcategories = [
      // DeFi subcategories
      { name: 'Lending', slug: 'lending', parentSlug: 'defi', description: 'Lending and borrowing protocols' },
      { name: 'DEX', slug: 'dex', parentSlug: 'defi', description: 'Decentralized exchanges' },
      { name: 'Yield Farming', slug: 'yield-farming', parentSlug: 'defi', description: 'Yield farming and liquidity mining' },
      { name: 'Stablecoins', slug: 'stablecoins', parentSlug: 'defi', description: 'Stablecoin projects' },
      { name: 'Insurance', slug: 'insurance', parentSlug: 'defi', description: 'DeFi insurance protocols' },
      { name: 'Asset Management', slug: 'asset-management', parentSlug: 'defi', description: 'Digital asset management platforms' },
      
      // Gaming subcategories
      { name: 'Play-to-Earn', slug: 'play-to-earn', parentSlug: 'gaming', description: 'Play-to-earn games' },
      { name: 'Metaverse', slug: 'metaverse', parentSlug: 'gaming', description: 'Metaverse platforms' },
      { name: 'GameFi', slug: 'gamefi', parentSlug: 'gaming', description: 'GameFi ecosystems' },
      { name: 'Virtual Worlds', slug: 'virtual-worlds', parentSlug: 'gaming', description: 'Virtual world projects' },
      
      // NFT subcategories
      { name: 'Art', slug: 'art', parentSlug: 'nft', description: 'Digital art NFTs' },
      { name: 'Collectibles', slug: 'collectibles', parentSlug: 'nft', description: 'Digital collectibles' },
      { name: 'Gaming NFTs', slug: 'gaming-nfts', parentSlug: 'nft', description: 'In-game NFT assets' },
      { name: 'Music', slug: 'music', parentSlug: 'nft', description: 'Music and audio NFTs' },
      { name: 'Real Estate', slug: 'real-estate', parentSlug: 'nft', description: 'Virtual real estate NFTs' },
      
      // Infrastructure subcategories
      { name: 'Oracle', slug: 'oracle', parentSlug: 'infrastructure', description: 'Oracle services' },
      { name: 'Storage', slug: 'storage', parentSlug: 'infrastructure', description: 'Decentralized storage' },
      { name: 'Identity', slug: 'identity', parentSlug: 'infrastructure', description: 'Digital identity solutions' },
      { name: 'Computing', slug: 'computing', parentSlug: 'infrastructure', description: 'Decentralized computing' },
      { name: 'Bridges', slug: 'bridges', parentSlug: 'infrastructure', description: 'Cross-chain bridges' }
    ];

    for (const subcat of subcategories) {
      const parent = await db.category.findUnique({
        where: { slug: subcat.parentSlug }
      });

      if (parent) {
        await db.category.upsert({
          where: { slug: subcat.slug },
          update: {
            name: subcat.name,
            description: subcat.description,
            parentId: parent.id,
            level: 1,
            sortOrder: 999,
            isActive: true
          },
          create: {
            id: `cat_${subcat.slug}`,
            name: subcat.name,
            slug: subcat.slug,
            description: subcat.description,
            parentId: parent.id,
            level: 1,
            sortOrder: 999,
            isActive: true,
            metadata: {}
          }
        });
      }
    }
  }

  private async initializeDefaultTags() {
    const defaultTags = [
      // Blockchain tags
      { name: 'Ethereum', slug: 'ethereum', category: 'blockchain', color: '#627EEA' },
      { name: 'Polygon', slug: 'polygon', category: 'blockchain', color: '#8247E5' },
      { name: 'BSC', slug: 'bsc', category: 'blockchain', color: '#F3BA2F' },
      { name: 'Arbitrum', slug: 'arbitrum', category: 'blockchain', color: '#28A0F0' },
      { name: 'Optimism', slug: 'optimism', category: 'blockchain', color: '#FF0420' },
      { name: 'Avalanche', slug: 'avalanche', category: 'blockchain', color: '#E84142' },
      { name: 'Solana', slug: 'solana', category: 'blockchain', color: '#00FFA3' },
      { name: 'Fantom', slug: 'fantom', category: 'blockchain', color: '#1969FF' },
      
      // Airdrop type tags
      { name: 'Token Airdrop', slug: 'token-airdrop', category: 'airdrop-type', color: '#10B981' },
      { name: 'NFT Airdrop', slug: 'nft-airdrop', category: 'airdrop-type', color: '#8B5CF6' },
      { name: 'Governance Token', slug: 'governance-token', category: 'airdrop-type', color: '#F59E0B' },
      { name: 'Utility Token', slug: 'utility-token', category: 'airdrop-type', color: '#3B82F6' },
      { name: 'Staking Rewards', slug: 'staking-rewards', category: 'airdrop-type', color: '#06B6D4' },
      { name: 'Liquidity Mining', slug: 'liquidity-mining', category: 'airdrop-type', color: '#EC4899' },
      
      // Requirement tags
      { name: 'KYC Required', slug: 'kyc-required', category: 'requirements', color: '#EF4444' },
      { name: 'No KYC', slug: 'no-kyc', category: 'requirements', color: '#10B981' },
      { name: 'Twitter Required', slug: 'twitter-required', category: 'requirements', color: '#1DA1F2' },
      { name: 'Discord Required', slug: 'discord-required', category: 'requirements', color: '#5865F2' },
      { name: 'Telegram Required', slug: 'telegram-required', category: 'requirements', color: '#0088CC' },
      { name: 'Wallet Connect', slug: 'wallet-connect', category: 'requirements', color: '#6B7280' },
      { name: 'Gas Fees', slug: 'gas-fees', category: 'requirements', color: '#F59E0B' },
      { name: 'No Gas', slug: 'no-gas', category: 'requirements', color: '#10B981' },
      
      // Status tags
      { name: 'Upcoming', slug: 'upcoming', category: 'status', color: '#3B82F6' },
      { name: 'Active', slug: 'active', category: 'status', color: '#10B981' },
      { name: 'Ending Soon', slug: 'ending-soon', category: 'status', color: '#F59E0B' },
      { name: 'High Value', slug: 'high-value', category: 'status', color: '#8B5CF6' },
      { name: 'Verified', slug: 'verified', category: 'status', color: '#06B6D4' },
      { name: 'Trending', slug: 'trending', category: 'status', color: '#EF4444' },
      { name: 'Featured', slug: 'featured', category: 'status', color: '#F59E0B' },
      
      // Difficulty tags
      { name: 'Easy', slug: 'easy', category: 'difficulty', color: '#10B981' },
      { name: 'Medium', slug: 'medium', category: 'difficulty', color: '#F59E0B' },
      { name: 'Hard', slug: 'hard', category: 'difficulty', color: '#EF4444' },
      { name: 'Expert', slug: 'expert', category: 'difficulty', color: '#6B7280' },
      
      // Value tags
      { name: 'High Potential', slug: 'high-potential', category: 'value', color: '#8B5CF6' },
      { name: 'Low Risk', slug: 'low-risk', category: 'value', color: '#10B981' },
      { name: 'New Project', slug: 'new-project', category: 'value', color: '#3B82F6' },
      { name: 'Established', slug: 'established', category: 'value', color: '#6B7280' }
    ];

    for (const tag of defaultTags) {
      await db.tag.upsert({
        where: { slug: tag.slug },
        update: {
          name: tag.name,
          category: tag.category,
          color: tag.color,
          isActive: true
        },
        create: {
          id: `tag_${tag.slug}`,
          name: tag.name,
          slug: tag.slug,
          category: tag.category,
          color: tag.color,
          isActive: true,
          usageCount: 0
        }
      });
    }
  }

  private async loadCaches() {
    try {
      const categories = await db.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      });
      
      const tags = await db.tag.findMany({
        where: { isActive: true },
        orderBy: { usageCount: 'desc' }
      });

      this.categoryCache.set('all', categories);
      this.tagCache.set('all', tags);

      logger.info(`Loaded ${categories.length} categories and ${tags.length} tags into cache`);
    } catch (error) {
      logger.error('Failed to load caches:', error);
    }
  }

  async categorizeAirdrop(airdropId: string): Promise<CategorizationResult> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          project: true,
          validations: true
        }
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      // Use AI to categorize the airdrop
      const aiCategorization = await this.aiCategorize(airdrop);
      
      // Enhance with rule-based categorization
      const ruleBasedCategorization = await this.ruleBasedCategorize(airdrop);
      
      // Merge and finalize categorization
      const finalCategorization = this.mergeCategorizations(aiCategorization, ruleBasedCategorization);

      // Update airdrop with categorization
      await this.updateAirdropCategorization(airdropId, finalCategorization);

      // Update tag usage counts
      await this.updateTagUsage(finalCategorization.tags);

      logger.info(`Categorized airdrop ${airdropId}: ${finalCategorization.primaryCategory}`);
      return finalCategorization;
    } catch (error) {
      logger.error(`Failed to categorize airdrop ${airdropId}:`, error);
      throw error;
    }
  }

  private async aiCategorize(airdrop: any): Promise<Partial<CategorizationResult>> {
    try {
      const categories = this.categoryCache.get('all') || [];
      const tags = this.tagCache.get('all') || [];

      const categoryList = categories.map(c => c.name).join(', ');
      const tagList = tags.map(t => t.name).join(', ');

      const prompt = `
        Analyze this airdrop and categorize it:

        Title: ${airdrop.title}
        Description: ${airdrop.description}
        Project: ${airdrop.project.name}
        Project Category: ${airdrop.project.category}
        Blockchain: ${airdrop.project.blockchain}
        Tags: ${airdrop.tags.join(', ')}

        Available Categories: ${categoryList}
        Available Tags: ${tagList}

        Provide a JSON response with:
        {
          "primaryCategory": "category_name",
          "secondaryCategories": ["category1", "category2"],
          "tags": ["tag1", "tag2", "tag3"],
          "confidence": 0-100,
          "reasoning": "Explanation of the categorization choices"
        }

        Guidelines:
        1. Choose the most appropriate primary category
        2. Select 0-2 secondary categories if applicable
        3. Choose 3-5 relevant tags
        4. Consider the project type, blockchain, and requirements
        5. Focus on accuracy over quantity
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at categorizing cryptocurrency airdrops based on their characteristics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      
      try {
        return JSON.parse(response || '{}');
      } catch {
        return {
          primaryCategory: 'DeFi',
          secondaryCategories: [],
          tags: ['ethereum', 'token-airdrop'],
          confidence: 50,
          reasoning: 'AI categorization failed, using defaults'
        };
      }
    } catch (error) {
      logger.error('AI categorization failed:', error);
      return {
        primaryCategory: 'DeFi',
        secondaryCategories: [],
        tags: ['ethereum', 'token-airdrop'],
        confidence: 0,
        reasoning: 'AI categorization error'
      };
    }
  }

  private async ruleBasedCategorize(airdrop: any): Promise<Partial<CategorizationResult>> {
    try {
      const categories: string[] = [];
      const tags: string[] = [];
      const content = `${airdrop.title} ${airdrop.description} ${airdrop.project.name}`.toLowerCase();

      // Rule-based category detection
      if (content.includes('defi') || content.includes('yield') || content.includes('lending') || content.includes('swap')) {
        categories.push('DeFi');
      }
      
      if (content.includes('game') || content.includes('play') || content.includes('nft') && content.includes('game')) {
        categories.push('Gaming');
      }
      
      if (content.includes('nft') || content.includes('collectible') || content.includes('art')) {
        categories.push('NFT');
      }
      
      if (content.includes('dao') || content.includes('governance') || content.includes('voting')) {
        categories.push('DAO');
      }
      
      if (content.includes('layer 2') || content.includes('l2') || content.includes('arbitrum') || content.includes('optimism')) {
        categories.push('Layer 2');
      }

      // Rule-based tag detection
      const tagRules = [
        { keywords: ['ethereum', 'eth'], tag: 'Ethereum' },
        { keywords: ['polygon', 'matic'], tag: 'Polygon' },
        { keywords: ['bsc', 'binance'], tag: 'BSC' },
        { keywords: ['arbitrum'], tag: 'Arbitrum' },
        { keywords: ['optimism', 'op'], tag: 'Optimism' },
        { keywords: ['avalanche', 'avax'], tag: 'Avalanche' },
        { keywords: ['solana'], tag: 'Solana' },
        { keywords: ['fantom', 'ftm'], tag: 'Fantom' },
        { keywords: ['kyc', 'verification'], tag: 'KYC Required' },
        { keywords: ['no kyc', 'anonymous'], tag: 'No KYC' },
        { keywords: ['twitter', 'x.com'], tag: 'Twitter Required' },
        { keywords: ['discord'], tag: 'Discord Required' },
        { keywords: ['telegram'], tag: 'Telegram Required' },
        { keywords: ['gas', 'transaction fee'], tag: 'Gas Fees' },
        { keywords: ['no gas', 'free'], tag: 'No Gas' },
        { keywords: ['staking'], tag: 'Staking Rewards' },
        { keywords: ['liquidity', 'lp'], tag: 'Liquidity Mining' },
        { keywords: ['governance', 'voting'], tag: 'Governance Token' },
        { keywords: ['utility', 'useful'], tag: 'Utility Token' }
      ];

      for (const rule of tagRules) {
        if (rule.keywords.some(keyword => content.includes(keyword))) {
          tags.push(rule.tag);
        }
      }

      // Add blockchain tag if not detected
      const blockchain = airdrop.project.blockchain;
      if (blockchain && !tags.some(tag => tag.toLowerCase().includes(blockchain.toLowerCase()))) {
        tags.push(blockchain.charAt(0).toUpperCase() + blockchain.slice(1));
      }

      return {
        primaryCategory: categories[0] || 'DeFi',
        secondaryCategories: categories.slice(1),
        tags: [...new Set(tags)], // Remove duplicates
        confidence: 75,
        reasoning: 'Rule-based categorization applied'
      };
    } catch (error) {
      logger.error('Rule-based categorization failed:', error);
      return {
        primaryCategory: 'DeFi',
        secondaryCategories: [],
        tags: [],
        confidence: 0,
        reasoning: 'Rule-based categorization error'
      };
    }
  }

  private mergeCategorizations(aiResult: Partial<CategorizationResult>, ruleResult: Partial<CategorizationResult>): CategorizationResult {
    try {
      // Use AI result as primary if confidence > 60, otherwise use rule-based
      const primarySource = (aiResult.confidence || 0) > 60 ? aiResult : ruleResult;
      
      const primaryCategory = primarySource.primaryCategory || 'DeFi';
      
      // Merge secondary categories
      const allSecondaryCategories = [
        ...(aiResult.secondaryCategories || []),
        ...(ruleResult.secondaryCategories || [])
      ];
      const secondaryCategories = [...new Set(allSecondaryCategories)].slice(0, 2);

      // Merge tags with priority to AI results
      const aiTags = aiResult.tags || [];
      const ruleTags = ruleResult.tags || [];
      const allTags = [...aiTags, ...ruleTags.filter(tag => !aiTags.includes(tag))];
      const tags = [...new Set(allTags)].slice(0, 8);

      // Calculate combined confidence
      const confidence = Math.round(((aiResult.confidence || 0) + (ruleResult.confidence || 0)) / 2);

      // Combine reasoning
      const reasoning = `AI: ${aiResult.reasoning || 'N/A'} | Rules: ${ruleResult.reasoning || 'N/A'}`;

      return {
        primaryCategory,
        secondaryCategories,
        tags,
        confidence,
        reasoning,
        metadata: {
          aiConfidence: aiResult.confidence,
          ruleConfidence: ruleResult.confidence,
          aiCategories: aiResult.secondaryCategories,
          ruleCategories: ruleResult.secondaryCategories,
          aiTags: aiResult.tags,
          ruleTags: ruleResult.tags
        }
      };
    } catch (error) {
      logger.error('Failed to merge categorizations:', error);
      return {
        primaryCategory: 'DeFi',
        secondaryCategories: [],
        tags: ['ethereum', 'token-airdrop'],
        confidence: 0,
        reasoning: 'Categorization merge failed',
        metadata: { error: error.message }
      };
    }
  }

  private async updateAirdropCategorization(airdropId: string, categorization: CategorizationResult) {
    try {
      await db.airdrop.update({
        where: { id: airdropId },
        data: {
          tags: categorization.tags,
          metadata: {
            categorization,
            lastCategorizedAt: new Date().toISOString()
          }
        }
      });

      // Update project category if different
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: { project: true }
      });

      if (airdrop && airdrop.project.category !== categorization.primaryCategory) {
        await db.project.update({
          where: { id: airdrop.project.id },
          data: {
            category: categorization.primaryCategory
          }
        });
      }
    } catch (error) {
      logger.error('Failed to update airdrop categorization:', error);
    }
  }

  private async updateTagUsage(tags: string[]) {
    try {
      for (const tagName of tags) {
        await db.tag.updateMany({
          where: { name: tagName },
          data: {
            usageCount: {
              increment: 1
            }
          }
        });
      }

      // Refresh tag cache
      const updatedTags = await db.tag.findMany({
        where: { isActive: true },
        orderBy: { usageCount: 'desc' }
      });
      this.tagCache.set('all', updatedTags);
    } catch (error) {
      logger.error('Failed to update tag usage:', error);
    }
  }

  async getCategories(parentId?: string): Promise<Category[]> {
    try {
      if (parentId) {
        return await db.category.findMany({
          where: { parentId, isActive: true },
          orderBy: { sortOrder: 'asc' }
        });
      } else {
        return await db.category.findMany({
          where: { level: 0, isActive: true },
          orderBy: { sortOrder: 'asc' }
        });
      }
    } catch (error) {
      logger.error('Failed to get categories:', error);
      return [];
    }
  }

  async getTags(category?: string, limit = 50): Promise<Tag[]> {
    try {
      const where: any = { isActive: true };
      if (category) where.category = category;

      return await db.tag.findMany({
        where,
        orderBy: { usageCount: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to get tags:', error);
      return [];
    }
  }

  async getPopularTags(limit = 20): Promise<Tag[]> {
    try {
      return await db.tag.findMany({
        where: { isActive: true },
        orderBy: { usageCount: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to get popular tags:', error);
      return [];
    }
  }

  async searchTags(query: string, limit = 10): Promise<Tag[]> {
    try {
      return await db.tag.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        orderBy: { usageCount: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to search tags:', error);
      return [];
    }
  }

  async createCustomTag(tagData: {
    name: string;
    category: string;
    description?: string;
    color?: string;
  }): Promise<Tag> {
    try {
      const slug = tagData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const tag = await db.tag.create({
        data: {
          id: `tag_${slug}_${Date.now()}`,
          name: tagData.name,
          slug,
          category: tagData.category,
          description: tagData.description,
          color: tagData.color || '#6B7280',
          isActive: true,
          usageCount: 0
        }
      });

      // Refresh cache
      await this.loadCaches();

      logger.info(`Created custom tag: ${tag.name}`);
      return tag;
    } catch (error) {
      logger.error('Failed to create custom tag:', error);
      throw error;
    }
  }

  async getCategorizationStats() {
    try {
      const categoryStats = await db.airdrop.groupBy({
        by: ['project'],
        _count: {
          id: true
        }
      });

      const tagStats = await db.tag.findMany({
        select: {
          name: true,
          usageCount: true,
          category: true
        },
        orderBy: { usageCount: 'desc' },
        take: 20
      });

      return {
        totalAirdrops: categoryStats.length,
        topTags: tagStats,
        categories: this.categoryCache.get('all')?.length || 0,
        totalTags: this.tagCache.get('all')?.length || 0
      };
    } catch (error) {
      logger.error('Failed to get categorization stats:', error);
      return {
        totalAirdrops: 0,
        topTags: [],
        categories: 0,
        totalTags: 0
      };
    }
  }

  async recategorizeAllAirdrops() {
    try {
      const airdrops = await db.airdrop.findMany({
        where: {
          OR: [
            { tags: { isEmpty: true } },
            { metadata: { path: ['categorification'], equals: undefined } }
          ]
        },
        take: 100 // Process in batches
      });

      logger.info(`Recategorizing ${airdrops.length} airdrops`);

      for (const airdrop of airdrops) {
        try {
          await this.categorizeAirdrop(airdrop.id);
        } catch (error) {
          logger.error(`Failed to recategorize airdrop ${airdrop.id}:`, error);
        }
      }

      logger.info('Recategorization batch completed');
    } catch (error) {
      logger.error('Failed to recategorize airdrops:', error);
    }
  }
}

export const categorizationService = new CategorizationService();