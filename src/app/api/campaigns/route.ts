import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const limit = searchParams.get('limit');

    let whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (tier) {
      whereClause.tier = tier;
    }

    const campaigns = await db.campaign.findMany({
      where: whereClause,
      include: {
        airdrop: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { airdropId, tier, submittedBy, startDate, endDate } = body;

    if (!airdropId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: airdropId, tier' },
        { status: 400 }
      );
    }

    // Check if airdrop exists
    const airdrop = await db.airdrop.findUnique({
      where: { id: airdropId },
    });

    if (!airdrop) {
      return NextResponse.json(
        { error: 'Airdrop not found' },
        { status: 404 }
      );
    }

    // Create campaign
    const campaign = await db.campaign.create({
      data: {
        airdropId,
        tier,
        submittedBy: submittedBy || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      },
      include: {
        airdrop: true,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}