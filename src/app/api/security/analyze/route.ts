import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SecurityAnalysisRequest {
  contractAddress?: string;
  url?: string;
}

interface RedFlag {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityAnalysisResponse {
  riskScore: number; // 0-100
  recommendation: 'SAFE' | 'CAUTION' | 'AVOID';
  redFlags: RedFlag[];
  analysis: {
    blacklistCheck: boolean;
    goPlusAnalysis?: any;
    phishingCheck: boolean;
    additionalChecks: string[];
  };
}

// GoPlus Labs API integration
async function checkGoPlusSecurity(contractAddress: string): Promise<any> {
  try {
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${contractAddress}`
    );
    
    if (!response.ok) {
      throw new Error('GoPlus API request failed');
    }
    
    const data = await response.json();
    return data.result?.[contractAddress] || null;
  } catch (error) {
    console.error('GoPlus API error:', error);
    return null;
  }
}

// Extract domain from URL
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Check for typosquatting
function checkTyposquatting(domain: string): boolean {
  const popularDomains = [
    'ethereum.org',
    'uniswap.org',
    'pancakeswap.finance',
    'sushi.com',
    'curve.fi',
    'aave.com',
    'compound.finance',
    'metamask.io',
    'opensea.io',
    'discord.com',
    'telegram.org',
    'twitter.com'
  ];

  return popularDomains.some(popular => {
    // Check for common typosquatting techniques
    const levenshteinDistance = (s1: string, s2: string): number => {
      const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
      
      for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= s2.length; j++) {
        for (let i = 1; i <= s1.length; i++) {
          const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + indicator
          );
        }
      }
      
      return matrix[s2.length][s1.length];
    };

    const distance = levenshteinDistance(domain, popular);
    return distance <= 2 && distance > 0; // Close but not exact match
  });
}

// Additional URL security checks
function performURLSecurityChecks(url: string, domain: string): RedFlag[] {
  const redFlags: RedFlag[] = [];

  // Check for HTTPS
  if (!url.startsWith('https://')) {
    redFlags.push({
      type: 'NO_HTTPS',
      message: 'Not using HTTPS - data may not be encrypted',
      severity: 'medium'
    });
  }

  // Check for suspicious parameters
  const suspiciousParams = ['private_key', 'seed', 'mnemonic', 'secret', 'phrase'];
  const urlObj = new URL(url);
  
  suspiciousParams.forEach(param => {
    if (urlObj.searchParams.has(param)) {
      redFlags.push({
        type: 'SUSPICIOUS_PARAMS',
        message: `Contains suspicious parameter: ${param}`,
        severity: 'critical'
      });
    }
  });

  // Check domain length
  if (domain.length > 50) {
    redFlags.push({
      type: 'LONG_DOMAIN',
      message: 'Unusually long domain name',
      severity: 'medium'
    });
  }

  // Check for IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    redFlags.push({
      type: 'IP_ADDRESS',
      message: 'Using IP address instead of domain name',
      severity: 'high'
    });
  }

  // Check for suspicious TLDs
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.click', '.download'];
  if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
    redFlags.push({
      type: 'SUSPICIOUS_TLD',
      message: 'Uses suspicious top-level domain',
      severity: 'high'
    });
  }

  // Check for typosquatting
  if (checkTyposquatting(domain)) {
    redFlags.push({
      type: 'TYPOSQUATTING',
      message: 'Domain appears to be imitating a popular website',
      severity: 'high'
    });
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    { pattern: /wallet/i, type: 'WALLET_KEYWORD', severity: 'medium' as const },
    { pattern: /airdrop/i, type: 'AIRDROP_KEYWORD', severity: 'medium' as const },
    { pattern: /free.*crypto/i, type: 'FREE_CRYPTO_PROMISE', severity: 'high' as const },
    { pattern: /claim.*token/i, type: 'TOKEN_CLAIM', severity: 'medium' as const },
    { pattern: /[0-9]+\./, type: 'NUMBERS_IN_DOMAIN', severity: 'medium' as const },
  ];

  suspiciousPatterns.forEach(({ pattern, type, severity }) => {
    if (pattern.test(domain)) {
      redFlags.push({
        type,
        message: `Suspicious pattern detected in domain: ${type.replace('_', ' ').toLowerCase()}`,
        severity
      });
    }
  });

  return redFlags;
}

export async function POST(request: NextRequest) {
  try {
    const body: SecurityAnalysisRequest = await request.json();
    const { contractAddress, url } = body;

    if (!contractAddress && !url) {
      return NextResponse.json(
        { error: 'Either contractAddress or url must be provided' },
        { status: 400 }
      );
    }

    const redFlags: RedFlag[] = [];
    let riskScore = 0;
    const analysis = {
      blacklistCheck: false,
      goPlusAnalysis: null as any,
      phishingCheck: false,
      additionalChecks: [] as string[]
    };

    // Blacklist check
    if (contractAddress) {
      const blacklistedContract = await db.blacklist.findFirst({
        where: {
          type: 'contract_address',
          value: contractAddress.toLowerCase()
        }
      });

      if (blacklistedContract) {
        redFlags.push({
          type: 'BLACKLISTED_CONTRACT',
          message: `This contract address is on our blacklist (${blacklistedContract.source})`,
          severity: 'critical'
        });
        analysis.blacklistCheck = true;
        riskScore += 80;
      }
    }

    if (url) {
      const domain = extractDomain(url);
      if (domain) {
        const blacklistedDomain = await db.blacklist.findFirst({
          where: {
            type: 'domain',
            value: domain
          }
        });

        if (blacklistedDomain) {
          redFlags.push({
            type: 'BLACKLISTED_DOMAIN',
            message: `This domain is on our blacklist (${blacklistedDomain.source})`,
            severity: 'critical'
          });
          analysis.blacklistCheck = true;
          riskScore += 80;
        }
      }
    }

    // GoPlus Labs analysis for contracts
    if (contractAddress && !analysis.blacklistCheck) {
      const goPlusData = await checkGoPlusSecurity(contractAddress);
      analysis.goPlusAnalysis = goPlusData;

      if (goPlusData) {
        // Check various risk factors from GoPlus
        if (goPlusData.approval_risk === '1') {
          redFlags.push({
            type: 'UNLIMITED_APPROVAL',
            message: 'This contract can spend an unlimited amount of your tokens',
            severity: 'high'
          });
          riskScore += 30;
        }

        if (goPlusData.honeypot_risk === '1') {
          redFlags.push({
            type: 'HONEYPOT_RISK',
            message: 'You may not be able to sell tokens from this contract',
            severity: 'critical'
          });
          riskScore += 50;
        }

        if (goPlusData.is_anti_whale === '1') {
          redFlags.push({
            type: 'ANTI_WHALE_MECHANISM',
            message: 'This contract limits large token sales',
            severity: 'medium'
          });
          riskScore += 20;
        }

        if (goPlusData.is_honeypot === '1') {
          redFlags.push({
            type: 'HONEYPOT',
            message: 'This contract appears to be a honeypot',
            severity: 'critical'
          });
          riskScore += 60;
        }

        if (goPlusData.buy_tax && parseInt(goPlusData.buy_tax) > 10) {
          redFlags.push({
            type: 'HIGH_BUY_TAX',
            message: `High buy tax: ${goPlusData.buy_tax}%`,
            severity: 'medium'
          });
          riskScore += 15;
        }

        if (goPlusData.sell_tax && parseInt(goPlusData.sell_tax) > 10) {
          redFlags.push({
            type: 'HIGH_SELL_TAX',
            message: `High sell tax: ${goPlusData.sell_tax}%`,
            severity: 'medium'
          });
          riskScore += 15;
        }
      }
    }

    // Phishing check for URLs
    if (url && !analysis.blacklistCheck) {
      const domain = extractDomain(url);
      if (domain) {
        const urlRedFlags = performURLSecurityChecks(url, domain);
        redFlags.push(...urlRedFlags);
        analysis.phishingCheck = urlRedFlags.length > 0;

        // Calculate risk score from URL red flags
        urlRedFlags.forEach(flag => {
          switch (flag.severity) {
            case 'critical': riskScore += 40; break;
            case 'high': riskScore += 25; break;
            case 'medium': riskScore += 15; break;
            case 'low': riskScore += 5; break;
          }
        });
      }
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Determine recommendation
    let recommendation: 'SAFE' | 'CAUTION' | 'AVOID';
    if (riskScore >= 70) {
      recommendation = 'AVOID';
    } else if (riskScore >= 30) {
      recommendation = 'CAUTION';
    } else {
      recommendation = 'SAFE';
    }

    // Sort red flags by severity
    redFlags.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const response: SecurityAnalysisResponse = {
      riskScore,
      recommendation,
      redFlags,
      analysis
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Security analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error during security analysis' },
      { status: 500 }
    );
  }
}