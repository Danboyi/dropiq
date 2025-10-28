import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware/authenticateToken';
import { updateThreatIntelligence } from '@/scripts/threat-intelligence-job';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request - only admins can trigger this
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Run the threat intelligence update
    await updateThreatIntelligence();

    return NextResponse.json({
      success: true,
      message: 'Threat intelligence update completed successfully'
    });

  } catch (error) {
    console.error('Threat intelligence update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update threat intelligence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}