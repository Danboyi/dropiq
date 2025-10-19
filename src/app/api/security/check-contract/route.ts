import { NextRequest, NextResponse } from 'next/server';
import { drainerProtectionEngine } from '@/lib/security/drainer-protection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, blockchain } = body;

    if (!contractAddress || !blockchain) {
      return NextResponse.json(
        { error: 'Contract address and blockchain are required' },
        { status: 400 }
      );
    }

    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { error: 'Invalid contract address format' },
        { status: 400 }
      );
    }

    // Perform drainer detection
    const result = await drainerProtectionEngine.analyzeContract(contractAddress, blockchain);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Contract check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}