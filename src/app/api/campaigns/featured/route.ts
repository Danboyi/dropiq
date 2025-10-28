import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get all active, paid campaigns that haven't expired
    const featuredCampaigns = await db.campaign.findMany({
      where: {
        paymentStatus: 'paid',
        status: { in: ['paid', 'approved'] },
        endDate: { gt: new Date() },
      },
      include: {
        airdrop: true,
      },
      orderBy: [
        { tier: 'desc' }, // premium first, then standard, then basic
        { createdAt: 'desc' }, // newer campaigns first
      ],
    });

    // Transform the data for the frontend
    const formattedCampaigns = featuredCampaigns.map((campaign) => ({
      id: campaign.id,
      tier: campaign.tier,
      endDate: campaign.endDate,
      airdrop: {
        id: campaign.airdrop.id,
        name: campaign.airdrop.name,
        slug: campaign.airdrop.slug,
        description: campaign.airdrop.description,
        category: campaign.airdrop.category,
        logoUrl: campaign.airdrop.logoUrl,
        websiteUrl: campaign.airdrop.websiteUrl,
        twitterUrl: campaign.airdrop.twitterUrl,
        discordUrl: campaign.airdrop.discordUrl,
        telegramUrl: campaign.airdrop.telegramUrl,
        riskScore: campaign.airdrop.riskScore,
        hypeScore: campaign.airdrop.hypeScore,
        status: campaign.airdrop.status,
        requirements: campaign.airdrop.requirements,
        notes: campaign.airdrop.notes,
        createdAt: campaign.airdrop.createdAt,
        updatedAt: campaign.airdrop.updatedAt,
      },
    }));

    return NextResponse.json({
      campaigns: formattedCampaigns,
      total: formattedCampaigns.length,
    });
  } catch (error) {
    console.error('Error fetching featured campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}