import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware/authenticateToken';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request - only admins can delete entries
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Blacklist entry ID is required' },
        { status: 400 }
      );
    }

    // Check if entry exists
    const existingEntry = await db.blacklist.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Blacklist entry not found' },
        { status: 404 }
      );
    }

    // Delete the blacklist entry
    await db.blacklist.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Blacklist entry deleted successfully'
    });

  } catch (error) {
    console.error('Blacklist delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete blacklist entry' },
      { status: 500 }
    );
  }
}