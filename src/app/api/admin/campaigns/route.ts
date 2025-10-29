import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    // Get campaigns with pagination
    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: {
          airdrop: true,
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}