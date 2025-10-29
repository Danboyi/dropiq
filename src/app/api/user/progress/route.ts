import { NextRequest, NextResponse } from 'next/server';
import { UserProfileService } from '@/lib/services/user-profile-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const progress = await UserProfileService.getUserProgress(userId);
    
    return NextResponse.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
}