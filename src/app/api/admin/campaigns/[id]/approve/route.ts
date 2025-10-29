import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { approvedBy, notes } = await req.json();

    if (!approvedBy) {
      return NextResponse.json(
        { error: 'approvedBy is required' },
        { status: 400 }
      );
    }

    // Update campaign status to approved
    const campaign = await db.campaign.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
        notes: notes || undefined,
      },
      include: {
        airdrop: true,
      },
    });

    console.log(`Campaign ${id} approved by ${approvedBy}`);

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('Error approving campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}