import { NextRequest, NextResponse } from 'next/server';
import { securityEducationSystem } from '@/lib/security/education-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, answers } = body;

    if (!userId || !contentId || !answers) {
      return NextResponse.json(
        { error: 'User ID, content ID, and answers are required' },
        { status: 400 }
      );
    }

    // Submit quiz
    const result = await securityEducationSystem.submitQuiz(userId, contentId, answers);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}