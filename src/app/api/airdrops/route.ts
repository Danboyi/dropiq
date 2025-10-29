import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'approved' // Only show approved airdrops
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await db.airdrop.count({ where })

    // Get airdrops with pagination
    const airdrops = await db.airdrop.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
        { hypeScore: 'desc' }
      ],
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

    // Mock user-specific data for demo purposes
    const airdropsWithUserData = airdrops.map(airdrop => ({
      ...airdrop,
      userStatus: null, // Would come from UserAirdropStatus table
      userNotes: null   // Would come from UserAirdropStatus table
    }))

    return NextResponse.json({
      airdrops: airdropsWithUserData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching airdrops:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airdrops' },
      { status: 500 }
    )
  }
}