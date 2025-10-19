import { NextRequest, NextResponse } from 'next/server';
import { SecurityScanner } from '@/lib/security-scanner';
import { OnChainAnalyzer } from '@/lib/onchain-analyzer';
import { authenticateToken, requireWallet } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { z } from 'zod';

const securityScanSchema = {
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    chainId: z.number().int().positive().optional(),
  }),
};

const transactionSimulationSchema = {
  body: z.object({
    from: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid from address'),
    to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid to address'),
    data: z.string().optional(),
    value: z.string().optional(),
    chainId: z.number().int().positive().optional(),
  }),
};

const phishingCheckSchema = {
  body: z.object({
    url: z.string().url('Invalid URL'),
  }),
};

// Security scan for address
export const POST = asyncHandler(async (req: NextRequest) => {
  const { address, chainId = 1 } = await req.json();

  const securityScanner = new SecurityScanner();
  const scan = await securityScanner.scanAddress(address, chainId);

  return NextResponse.json({
    scan,
    recommendations: scan.recommendations,
  });
});

// Transaction simulation
export const POST = asyncHandler(async (req: NextRequest) => {
  const { from, to, data = '0x', value = '0', chainId = 1 } = await req.json();

  const securityScanner = new SecurityScanner();
  const simulation = await securityScanner.simulateTransaction(
    from,
    to,
    data,
    value,
    chainId
  );

  return NextResponse.json({
    simulation,
    warnings: simulation.potentialRisks,
    gasEstimate: simulation.gasEstimate,
  });
});

// Phishing site check
export const POST = asyncHandler(async (req: NextRequest) => {
  const { url } = await req.json();

  const securityScanner = new SecurityScanner();
  const result = await securityScanner.checkPhishingSite(url);

  return NextResponse.json({
    isPhishing: result.isPhishing,
    confidence: result.confidence,
    threats: result.threats,
  });
});

// Comprehensive wallet security analysis
export const POST = asyncHandler(async (req: NextRequest) => {
  const { address, chainId = 1 } = await req.json();

  // Run multiple security checks
  const [securityScan, transactionAnalysis] = await Promise.all([
    // Security scan
    new SecurityScanner().scanAddress(address, chainId),
    
    // Transaction analysis for suspicious patterns
    new OnChainAnalyzer().analyzeTransactions(
      await new OnChainAnalyzer().getTransactionHistory(address, chainId)
    ),
  ]);

  // Calculate overall security score
  const securityScore = calculateSecurityScore(securityScan, transactionAnalysis);

  return NextResponse.json({
    securityScan,
    transactionAnalysis,
    securityScore,
    recommendations: generateSecurityRecommendations(securityScan, transactionAnalysis),
  });
});

function calculateSecurityScore(securityScan: any, transactionAnalysis: any): number {
  let score = 100;

  // Deduct points for threats
  securityScan.threats.forEach((threat: any) => {
    score -= threat.severity * 5;
  });

  // Deduct points for suspicious patterns
  if (transactionAnalysis.totalTransactions === 0) {
    score -= 10; // New account
  }

  if (transactionAnalysis.uniqueContracts.length > 50) {
    score -= 5; // Too many contract interactions
  }

  return Math.max(0, Math.min(100, score));
}

function generateSecurityRecommendations(securityScan: any, transactionAnalysis: any): string[] {
  const recommendations = [...securityScan.recommendations];

  if (transactionAnalysis.totalTransactions === 0) {
    recommendations.push('Be cautious with new accounts - start with small transactions');
  }

  if (transactionAnalysis.uniqueContracts.length > 50) {
    recommendations.push('Consider using a dedicated wallet for dApp interactions');
  }

  return recommendations;
}