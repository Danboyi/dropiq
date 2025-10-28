import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    const searchQuery = query.trim().toLowerCase();

    const airdrops = await db.airdrop.findMany({
      where: {
        AND: [
          { status: 'approved' }, // Only search approved airdrops
          {
            OR: [
              { name: { contains: searchQuery } },
              { slug: { contains: searchQuery } },
              { description: { contains: searchQuery } },
              { category: { contains: searchQuery } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        logoUrl: true,
        websiteUrl: true,
        riskScore: true,
        hypeScore: true,
        status: true,
      },
      orderBy: [
        { hypeScore: 'desc' }, // Most hyped first
        { name: 'asc' },
      ],
      take: 10, // Limit to 10 results
    });

    return NextResponse.json({
      airdrops,
      total: airdrops.length,
      query,
    });
  } catch (error) {
    console.error('Error searching airdrops:', error);
    return NextResponse.json(
      { error: 'Failed to search airdrops' },
      { status: 500 }
    );
  }
}