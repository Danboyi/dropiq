import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const airdrop = await db.airdrop.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        logoUrl: true,
        websiteUrl: true,
        twitterUrl: true,
        discordUrl: true,
        telegramUrl: true,
        riskScore: true,
        hypeScore: true,
        status: true,
        requirements: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!airdrop) {
      return NextResponse.json(
        { error: 'Airdrop not found' },
        { status: 404 }
      )
    }

    if (airdrop.status !== 'approved') {
      return NextResponse.json(
        { error: 'Airdrop not available' },
        { status: 403 }
      )
    }

    // Mock user-specific data for demo purposes
    const airdropWithUserData = {
      ...airdrop,
      userStatus: null, // Would come from UserAirdropStatus table
      userNotes: null   // Would come from UserAirdropStatus table
    }

    return NextResponse.json(airdropWithUserData)

  } catch (error) {
    console.error('Error fetching airdrop:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airdrop' },
      { status: 500 }
    )
  }
}