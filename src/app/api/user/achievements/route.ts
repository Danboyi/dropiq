import { NextRequest, NextResponse } from 'next/server';
import { UserProfileService } from '@/lib/services/user-profile-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, achievementId } = body;
    
    if (!userId || !achievementId) {
      return NextResponse.json(
        { error: 'User ID and Achievement ID are required' },
        { status: 400 }
      );
    }

    const userAchievement = await UserProfileService.unlockAchievement(userId, achievementId);
    
    return NextResponse.json({
      success: true,
      data: userAchievement
    });
  } catch (error: any) {
    console.error('Error unlocking achievement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlock achievement' },
      { status: 500 }
    );
  }
}