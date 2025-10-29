import { NextRequest, NextResponse } from 'next/server';
import { UserProfileService } from '@/lib/services/user-profile-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followingId } = body;
    
    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'Follower ID and Following ID are required' },
        { status: 400 }
      );
    }

    await UserProfileService.followUser(followerId, followingId);
    
    return NextResponse.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error: any) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to follow user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');
    
    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'Follower ID and Following ID are required' },
        { status: 400 }
      );
    }

    await UserProfileService.unfollowUser(followerId, followingId);
    
    return NextResponse.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}