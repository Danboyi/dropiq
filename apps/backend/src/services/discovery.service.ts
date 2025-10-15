import { db } from '@/lib/db';
import { 
  DiscoverySource, 
  DiscoveredAirdrop, 
  DiscoveryStatus, 
  DiscoveryPriority,
  SourceType 
} from '@prisma/client';
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ScrapedAirdrop {
  name: string;
  description: string;
  url?: string;
  sourceUrl: string;
  rawContent: any;
  category?: string;
  blockchain?: string;
  requirements?: string[];
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    website?: string;
  };
}

export class DiscoveryService {
  /**
   * Create or get discovery source
   */
  static async getOrCreateSource(name: string, type: SourceType, url?: string): Promise<DiscoverySource> {
    const existingSource = await db.discoverySource.findFirst({
      where: { name }
    });

    if (existingSource) {
      return existingSource;
    }

    return await db.discoverySource.create({
      data: {
        name,
        type,
        url,
        config: {},
        isActive: true
      }
    });
  }

  /**
   * Save discovered airdrop
   */
  static async saveDiscoveredAirdrop(
    sourceId: string,
    scrapedData: ScrapedAirdrop,
    priority: DiscoveryPriority = DiscoveryPriority.MEDIUM
  ): Promise<DiscoveredAirdrop> {
    // Generate content hash for duplicate detection
    const contentHash = this.generateContentHash(scrapedData);

    // Check for duplicates
    const existingDuplicate = await db.discoveredAirdrop.findFirst({
      where: { hash: contentHash }
    });

    if (existingDuplicate) {
      return existingDuplicate;
    }

    return await db.discoveredAirdrop.create({
      data: {
        name: scrapedData.name,
        description: scrapedData.description,
        url: scrapedData.url || scrapedData.sourceUrl,
        rawContent: scrapedData,
        status: DiscoveryStatus.DISCOVERED,
        priority,
        hash: contentHash,
        sourceId,
        discoveredAt: new Date()
      }
    });
  }

  /**
   * Generate content hash for duplicate detection
   */
  private static generateContentHash(data: ScrapedAirdrop): string {
    const content = `${data.name.toLowerCase()}${data.description?.toLowerCase() || ''}`;
    return Buffer.from(content).toString('base64').substring(0, 16);
  }

  /**
   * Twitter/X scraper
   */
  static async scrapeTwitter(hashtags: string[] = ['airdrop', 'cryptoairdrop'], accounts: string[] = []): Promise<ScrapedAirdrop[]> {
    const results: ScrapedAirdrop[] = [];
    
    try {
      // Note: In a real implementation, you would use Twitter API
      // For demonstration, we'll simulate scraping results
      
      const simulatedTweets = [
        {
          text: "🚀 Exciting new airdrop from DeFiProject! Join now and get 100 free tokens. Requirements: Follow, retweet, and join Discord. #airdrop #defi",
          url: "https://twitter.com/defiproject/status/123456789",
          author: "defiproject",
          timestamp: new Date()
        },
        {
          text: "New gaming airdrop alert! GameFiChain is giving away 5000 tokens to early adopters. Limited spots available. #gaming #airdrop #crypto",
          url: "https://twitter.com/gamefichain/status/123456790",
          author: "gamefichain",
          timestamp: new Date()
        }
      ];

      for (const tweet of simulatedTweets) {
        const airdrop = this.parseTwitterContent(tweet);
        if (airdrop) {
          results.push(airdrop);
        }
      }

    } catch (error) {
      console.error('Error scraping Twitter:', error);
    }

    return results;
  }

  /**
   * Parse Twitter content for airdrop information
   */
  private static parseTwitterContent(tweet: any): ScrapedAirdrop | null {
    const text = tweet.text;
    
    // Look for airdrop keywords
    const airdropKeywords = ['airdrop', 'giveaway', 'free tokens', 'claim', 'reward'];
    const hasAirdropKeyword = airdropKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (!hasAirdropKeyword) {
      return null;
    }

    // Extract project name (simplified)
    const nameMatch = text.match(/from\s+([A-Za-z0-9]+)|([A-Za-z0-9]+)\s+is giving away/);
    const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'Unknown Project';

    // Extract requirements
    const requirements: string[] = [];
    if (text.toLowerCase().includes('follow')) requirements.push('Follow Twitter');
    if (text.toLowerCase().includes('retweet')) requirements.push('Retweet');
    if (text.toLowerCase().includes('discord')) requirements.push('Join Discord');
    if (text.toLowerCase().includes('telegram')) requirements.push('Join Telegram');

    return {
      name,
      description: text,
      sourceUrl: tweet.url,
      url: `https://twitter.com/${tweet.author}`,
      rawContent: tweet,
      requirements,
      socialLinks: {
        twitter: `https://twitter.com/${tweet.author}`
      }
    };
  }

  /**
   * Website scraper for project announcements
   */
  static async scrapeWebsite(url: string): Promise<ScrapedAirdrop | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Look for airdrop-related content
      const airdropKeywords = ['airdrop', 'giveaway', 'free tokens', 'claim', 'reward'];
      const pageText = $('body').text().toLowerCase();
      const hasAirdropKeyword = airdropKeywords.some(keyword => 
        pageText.includes(keyword)
      );

      if (!hasAirdropKeyword) {
        return null;
      }

      // Extract project information
      const title = $('title').text() || $('h1').first().text() || 'Unknown Project';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') ||
                         $('p').first().text() || '';

      // Look for social links
      const socialLinks: any = {};
      $('a[href*="twitter"]').each((i, el) => {
        socialLinks.twitter = $(el).attr('href');
      });
      $('a[href*="discord"]').each((i, el) => {
        socialLinks.discord = $(el).attr('href');
      });
      $('a[href*="telegram"]').each((i, el) => {
        socialLinks.telegram = $(el).attr('href');
      });

      return {
        name: title,
        description,
        sourceUrl: url,
        url,
        rawContent: {
          title,
          description,
          content: response.data.substring(0, 1000) // First 1000 chars
        },
        socialLinks
      };

    } catch (error) {
      console.error(`Error scraping website ${url}:`, error);
      return null;
    }
  }

  /**
   * Reddit scraper
   */
  static async scrapeReddit(subreddits: string[] = ['airdrops', 'CryptoAirdrops']): Promise<ScrapedAirdrop[]> {
    const results: ScrapedAirdrop[] = [];
    
    try {
      // Note: In a real implementation, you would use Reddit API
      // For demonstration, we'll simulate scraping results
      
      const simulatedPosts = [
        {
          title: "New DeFi Airdrop - ProjectX is giving away 10,000 tokens",
          url: "https://reddit.com/r/airdrops/comments/abc123",
          content: "ProjectX just announced their new airdrop campaign. They're giving away 10,000 tokens to community members. Requirements include joining Discord, following Twitter, and holding at least 0.1 ETH.",
          subreddit: "airdrops",
          author: "crypto_enthusiast"
        }
      ];

      for (const post of simulatedPosts) {
        const airdrop = this.parseRedditContent(post);
        if (airdrop) {
          results.push(airdrop);
        }
      }

    } catch (error) {
      console.error('Error scraping Reddit:', error);
    }

    return results;
  }

  /**
   * Parse Reddit content for airdrop information
   */
  private static parseRedditContent(post: any): ScrapedAirdrop | null {
    const title = post.title;
    const content = post.content;
    
    // Look for airdrop keywords
    const airdropKeywords = ['airdrop', 'giveaway', 'free tokens', 'claim', 'reward'];
    const text = `${title} ${content}`.toLowerCase();
    const hasAirdropKeyword = airdropKeywords.some(keyword => 
      text.includes(keyword)
    );

    if (!hasAirdropKeyword) {
      return null;
    }

    // Extract project name
    const nameMatch = title.match(/([A-Za-z0-9]+)\s+(airdrop|is giving away)/i);
    const name = nameMatch ? nameMatch[1] : 'Unknown Project';

    // Extract requirements
    const requirements: string[] = [];
    if (content.toLowerCase().includes('discord')) requirements.push('Join Discord');
    if (content.toLowerCase().includes('twitter')) requirements.push('Follow Twitter');
    if (content.toLowerCase().includes('hold')) requirements.push('Hold tokens');

    return {
      name,
      description: `${title}\n\n${content}`,
      sourceUrl: post.url,
      rawContent: post,
      requirements
    };
  }

  /**
   * Run discovery process for all sources
   */
  static async runDiscovery(): Promise<void> {
    console.log('Starting airdrop discovery process...');

    try {
      // Get active sources
      const sources = await db.discoverySource.findMany({
        where: { isActive: true }
      });

      for (const source of sources) {
        console.log(`Processing source: ${source.name}`);
        
        let scrapedAirdrops: ScrapedAirdrop[] = [];

        switch (source.type) {
          case SourceType.TWITTER:
            scrapedAirdrops = await this.scrapeTwitter();
            break;
          case SourceType.WEBSITE:
            if (source.url) {
              const result = await this.scrapeWebsite(source.url);
              scrapedAirdrops = result ? [result] : [];
            }
            break;
          case SourceType.REDDIT:
            scrapedAirdrops = await this.scrapeReddit();
            break;
          default:
            console.log(`Unsupported source type: ${source.type}`);
            continue;
        }

        // Save discovered airdrops
        for (const scrapedAirdrop of scrapedAirdrops) {
          await this.saveDiscoveredAirdrop(source.id, scrapedAirdrop);
        }

        // Update source last scraped time
        await db.discoverySource.update({
          where: { id: source.id },
          data: { lastScraped: new Date() }
        });

        console.log(`Discovered ${scrapedAirdrops.length} airdrops from ${source.name}`);
      }

      console.log('Discovery process completed');

    } catch (error) {
      console.error('Error in discovery process:', error);
    }
  }
}