import { NextRequest, NextResponse } from 'next/server';
import { UserProfileService } from '@/lib/services/user-profile-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'reputation' | 'earnings' | 'achievements' || 'reputation';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const leaderboard = await UserProfileService.getLeaderboard(type, limit);
    
    return NextResponse.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}