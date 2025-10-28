import { NextRequest, NextResponse } from 'next/server';

// In-memory list of known phishing domains (in production, this should be in a database)
const KNOWN_PHISHING_DOMAINS = [
  'phishing-site.com',
  'fake-airdrop.com',
  'scam-token.net',
  'malicious-wallet.org',
  'steal-wallet.xyz',
  'fake-dapp.io',
  'crypto-scam.site',
  'wallet-drainer.net',
];

// In-memory list of trusted domains
const TRUSTED_DOMAINS = [
  'ethereum.org',
  'polygon.technology',
  'bscscan.com',
  'arbiscan.io',
  'optimistic.etherscan.io',
  'basescan.org',
  'etherscan.io',
  'app.uniswap.org',
  'pancakeswap.finance',
  'app.sushi.com',
  'curve.fi',
  'aave.com',
  'compound.finance',
  'makerdao.com',
  'dydx.exchange',
];

interface SecurityCheckRequest {
  url: string;
}

interface SecurityCheckResponse {
  isSafe: boolean;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SecurityCheckRequest = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    // Parse URL to extract domain
    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.toLowerCase();
    } catch (error) {
      return NextResponse.json(
        { 
          isSafe: false, 
          reason: 'Invalid URL format',
          riskLevel: 'high' as const,
          warnings: ['The provided URL is not a valid web address']
        } as SecurityCheckResponse,
        { status: 200 }
      );
    }

    const warnings: string[] = [];
    let isSafe = true;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check against known phishing domains
    if (KNOWN_PHISHING_DOMAINS.some(phishingDomain => 
      domain.includes(phishingDomain) || phishingDomain.includes(domain)
    )) {
      return NextResponse.json({
        isSafe: false,
        reason: 'This domain is known for phishing activities',
        riskLevel: 'high',
        warnings: [
          'This website has been reported for phishing attempts',
          'Users have lost funds to this domain',
          'Proceed with extreme caution or avoid entirely'
        ]
      } as SecurityCheckResponse);
    }

    // Check if domain is trusted
    const isTrusted = TRUSTED_DOMAINS.some(trustedDomain => 
      domain === trustedDomain || domain.endsWith(`.${trustedDomain}`)
    );

    if (isTrusted) {
      return NextResponse.json({
        isSafe: true,
        reason: 'This is a known and trusted domain',
        riskLevel: 'low',
        warnings: []
      } as SecurityCheckResponse);
    }

    // Additional security checks
    const suspiciousPatterns = [
      { pattern: /wallet/i, warning: 'Contains "wallet" in domain - be cautious' },
      { pattern: /airdrop/i, warning: 'Contains "airdrop" - verify authenticity' },
      { pattern: /free.*crypto/i, warning: 'Promises free crypto - likely suspicious' },
      { pattern: /claim.*token/i, warning: 'Token claiming site - verify carefully' },
      { pattern: /connect.*wallet/i, warning: 'Wallet connection required - ensure legitimacy' },
      { pattern: /[0-9]+\./, warning: 'Uses numbers in domain - common in phishing' },
      { pattern: /-/g, warning: 'Uses hyphens in domain - verify authenticity' },
    ];

    suspiciousPatterns.forEach(({ pattern, warning }) => {
      if (pattern.test(domain)) {
        warnings.push(warning);
        riskLevel = 'medium';
      }
    });

    // Check for HTTPS
    if (!url.startsWith('https://')) {
      warnings.push('Not using HTTPS - data may not be encrypted');
      riskLevel = 'medium';
    }

    // Check for suspicious URL parameters
    const suspiciousParams = ['private_key', 'seed', 'mnemonic', 'secret'];
    const urlObj = new URL(url);
    suspiciousParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        warnings.push(`Contains suspicious parameter: ${param}`);
        riskLevel = 'high';
        isSafe = false;
      }
    });

    // Check domain length (very long domains are often suspicious)
    if (domain.length > 50) {
      warnings.push('Unusually long domain name');
      riskLevel = 'medium';
    }

    // Check for IP address instead of domain
    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      warnings.push('Using IP address instead of domain name');
      riskLevel = 'high';
      isSafe = false;
    }

    // Check for common TLDs used in phishing
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      warnings.push('Uses suspicious top-level domain');
      riskLevel = 'high';
      isSafe = false;
    }

    // If no warnings found, consider it reasonably safe but still caution
    if (warnings.length === 0) {
      return NextResponse.json({
        isSafe: true,
        reason: 'No obvious security threats detected, but always exercise caution',
        riskLevel: 'low',
        warnings: ['Always verify the authenticity of websites before connecting your wallet']
      } as SecurityCheckResponse);
    }

    return NextResponse.json({
      isSafe,
      reason: isSafe ? 'Some caution advised' : 'Security risks detected',
      riskLevel,
      warnings
    } as SecurityCheckResponse);

  } catch (error) {
    console.error('Security check error:', error);
    return NextResponse.json(
      { error: 'Internal server error during security check' },
      { status: 500 }
    );
  }
}