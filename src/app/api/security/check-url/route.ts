import { NextRequest, NextResponse } from 'next/server';
import { phishingProtectionEngine } from '@/lib/security/phishing-protection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Perform phishing detection
    const result = await phishingProtectionEngine.analyzeUrl(url);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('URL check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}