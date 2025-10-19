import { NextRequest, NextResponse } from 'next/server';
import { securityEducationSystem } from '@/lib/security/education-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, quizScore } = body;

    if (!userId || !contentId) {
      return NextResponse.json(
        { error: 'User ID and content ID are required' },
        { status: 400 }
      );
    }

    // Complete module
    const result = await securityEducationSystem.completeModule(userId, contentId, quizScore);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Module completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}