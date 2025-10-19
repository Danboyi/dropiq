import { NextRequest, NextResponse } from 'next/server';
import { scamDetectionEngine } from '@/lib/security/scam-detection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectData } = body;

    if (!projectData) {
      return NextResponse.json(
        { error: 'Project data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'description', 'blockchain'];
    for (const field of requiredFields) {
      if (!projectData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Perform scam detection
    const result = await scamDetectionEngine.analyzeProject(projectData);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Project scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}