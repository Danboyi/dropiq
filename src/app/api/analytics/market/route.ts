import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Collect market data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, blockchains } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'symbols array is required' },
        { status: 400 }
      );
    }

    const results = [];

    // Collect data for each symbol and blockchain combination
    for (const symbol of symbols) {
      for (const blockchain of blockchains || ['ethereum', 'bsc', 'polygon']) {
        try {
          const marketData = await collectMarketData(symbol, blockchain);
          if (marketData) {
            results.push(marketData);
          }
        } catch (error) {
          console.error(`Error collecting data for ${symbol} on ${blockchain}:`, error);
        }
      }
    }

    // Analyze market trends with AI
    const marketInsights = await analyzeMarketTrends(results);

    return NextResponse.json({
      success: true,
      data: results,
      insights: marketInsights,
      collected: results.length
    });
  } catch (error) {
    console.error('Error collecting market data:', error);
    return NextResponse.json(
      { error: 'Failed to collect market data' },
      { status: 500 }
    );
  }
}

// Get market analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const blockchain = searchParams.get('blockchain');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: any = {};
    if (symbol) where.symbol = symbol;
    if (blockchain) where.blockchain = blockchain;
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const marketData = await db.marketData.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    // Generate market insights
    const insights = await generateMarketInsights(marketData);

    return NextResponse.json({
      data: marketData,
      insights,
      total: marketData.length
    });
  } catch (error) {
    console.error('Error fetching market analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market analytics' },
      { status: 500 }
    );
  }
}

// Collect market data for a specific symbol and blockchain
async function collectMarketData(symbol: string, blockchain: string) {
  try {
    const zai = await ZAI.create();

    // Use web search to get current market data
    const searchResult = await zai.functions.invoke("web_search", {
      query: `${symbol} token price market cap ${blockchain} cryptocurrency`,
      num: 5
    });

    // Extract market data from search results
    const marketInfo = await extractMarketDataFromSearch(searchResult, symbol, blockchain);
    
    if (!marketInfo) {
      return null;
    }

    // Generate sentiment analysis
    const sentiment = await analyzeSentiment(symbol, blockchain);

    // Create market data record
    const marketData = await db.marketData.create({
      data: {
        symbol,
        blockchain,
        price: marketInfo.price,
        marketCap: marketInfo.marketCap,
        volume24h: marketInfo.volume24h,
        change24h: marketInfo.change24h,
        change7d: marketInfo.change7d,
        change30d: marketInfo.change30d,
        circulatingSupply: marketInfo.circulatingSupply,
        totalSupply: marketInfo.totalSupply,
        holders: marketInfo.holders,
        transactions24h: marketInfo.transactions24h,
        gasPrice: marketInfo.gasPrice,
        networkUtilization: marketInfo.networkUtilization,
        sentiment: sentiment.score,
        trendingScore: marketInfo.trendingScore,
        predictionScore: await generatePredictionScore(symbol, blockchain),
        metadata: {
          source: 'web_search',
          searchResults: searchResult,
          extractedAt: new Date().toISOString()
        }
      }
    });

    return marketData;
  } catch (error) {
    console.error(`Error collecting market data for ${symbol}:`, error);
    return null;
  }
}

// Extract market data from search results
async function extractMarketDataFromSearch(searchResult: any[], symbol: string, blockchain: string) {
  try {
    const zai = await ZAI.create();

    const extraction = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction expert. Extract cryptocurrency market data from search results and return as JSON.'
        },
        {
          role: 'user',
          content: `Extract market data for ${symbol} on ${blockchain} from these search results:
          ${JSON.stringify(searchResult, null, 2)}
          
          Return a JSON object with these fields:
          - price (current price in USD)
          - marketCap (market capitalization)
          - volume24h (24h trading volume)
          - change24h (24h price change percentage)
          - change7d (7d price change percentage)
          - change30d (30d price change percentage)
          - circulatingSupply (circulating supply)
          - totalSupply (total supply)
          - holders (number of holders)
          - transactions24h (24h transaction count)
          - gasPrice (current gas price)
          - networkUtilization (network utilization percentage)
          - trendingScore (trending score 0-100)
          
          If data is not available, use null for that field.`
        }
      ]
    });

    const content = extraction.choices[0]?.message?.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing market data JSON:', parseError);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting market data:', error);
    return null;
  }
}

// Analyze market sentiment
async function analyzeSentiment(symbol: string, blockchain: string) {
  try {
    const zai = await ZAI.create();

    const sentimentAnalysis = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a cryptocurrency sentiment analyst. Analyze market sentiment and provide a score from -1 (very negative) to 1 (very positive).'
        },
        {
          role: 'user',
          content: `Analyze the current market sentiment for ${symbol} on ${blockchain}. 
          
          Consider:
          - Recent price movements
          - Social media sentiment
          - News and developments
          - Technical indicators
          - Market conditions
          
          Provide a sentiment score from -1 to 1 and explain your reasoning.`
        }
      ]
    });

    const content = sentimentAnalysis.choices[0]?.message?.content;
    if (content) {
      // Extract score from response
      const scoreMatch = content.match(/(-?\d+\.?\d*)/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
      
      return {
        score: Math.max(-1, Math.min(1, score)), // Clamp between -1 and 1
        reasoning: content
      };
    }

    return { score: 0, reasoning: 'Unable to analyze sentiment' };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { score: 0, reasoning: 'Error analyzing sentiment' };
  }
}

// Generate prediction score using AI
async function generatePredictionScore(symbol: string, blockchain: string) {
  try {
    const zai = await ZAI.create();

    const prediction = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a cryptocurrency prediction expert. Predict short-term price movement potential and provide a confidence score from 0 to 100.'
        },
        {
          role: 'user',
          content: `Predict the short-term (next 7 days) price movement potential for ${symbol} on ${blockchain}.
          
          Consider:
          - Historical price patterns
          - Market conditions
          - Technical indicators
          - Upcoming events
          - Overall market sentiment
          
          Provide a prediction score from 0 (very bearish) to 100 (very bullish) and explain your reasoning.`
        }
      ]
    });

    const content = prediction.choices[0]?.message?.content;
    if (content) {
      // Extract score from response
      const scoreMatch = content.match(/(\d+\.?\d*)/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 50;
      
      return Math.max(0, Math.min(100, score)); // Clamp between 0 and 100
    }

    return 50; // Neutral prediction
  } catch (error) {
    console.error('Error generating prediction score:', error);
    return 50;
  }
}

// Analyze market trends
async function analyzeMarketTrends(marketData: any[]) {
  try {
    const zai = await ZAI.create();

    const trends = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a market trends analyst. Analyze cryptocurrency market data and identify key trends and patterns.'
        },
        {
          role: 'user',
          content: `Analyze these market data points and identify key trends:
          ${marketData.slice(0, 10).map(data => 
            `${data.symbol} (${data.blockchain}): Price $${data.price}, 24h Change: ${data.change24h}%, Volume: $${data.volume24h}`
          ).join('\n')}
          
          Provide insights on:
          1. Overall market sentiment
          2. Top performing tokens
          3. Notable patterns
          4. Risk indicators
          5. Investment opportunities`
        }
      ]
    });

    return {
      analysis: trends.choices[0]?.message?.content || 'Unable to analyze trends',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing market trends:', error);
    return {
      analysis: 'Error analyzing market trends',
      timestamp: new Date().toISOString()
    };
  }
}

// Generate market insights
async function generateMarketInsights(marketData: any[]) {
  const insights = {
    totalTokens: new Set(marketData.map(d => d.symbol)).size,
    totalBlockchains: new Set(marketData.map(d => d.blockchain)).size,
    avgPrice: 0,
    avgVolume24h: 0,
    avgChange24h: 0,
    topGainers: [] as any[],
    topLosers: [] as any[],
    highestVolume: [] as any[],
    marketSentiment: 'neutral',
    volatilityIndex: 0
  };

  if (marketData.length === 0) return insights;

  // Calculate averages
  const prices = marketData.filter(d => d.price).map(d => d.price!);
  const volumes = marketData.filter(d => d.volume24h).map(d => d.volume24h!);
  const changes = marketData.filter(d => d.change24h).map(d => d.change24h!);

  if (prices.length > 0) {
    insights.avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  }
  
  if (volumes.length > 0) {
    insights.avgVolume24h = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  }
  
  if (changes.length > 0) {
    insights.avgChange24h = changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  // Sort for top gainers and losers
  const sortedByChange = [...marketData]
    .filter(d => d.change24h)
    .sort((a, b) => b.change24h! - a.change24h!);

  insights.topGainers = sortedByChange.slice(0, 5);
  insights.topLosers = sortedByChange.slice(-5).reverse();

  // Sort by volume
  const sortedByVolume = [...marketData]
    .filter(d => d.volume24h)
    .sort((a, b) => b.volume24h! - a.volume24h!);

  insights.highestVolume = sortedByVolume.slice(0, 5);

  // Calculate market sentiment
  if (insights.avgChange24h > 2) {
    insights.marketSentiment = 'bullish';
  } else if (insights.avgChange24h < -2) {
    insights.marketSentiment = 'bearish';
  }

  // Calculate volatility index (standard deviation of price changes)
  if (changes.length > 1) {
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / changes.length;
    insights.volatilityIndex = Math.sqrt(variance);
  }

  return insights;
}