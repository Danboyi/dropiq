import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Fetch all UserAirdropStatus records for the authenticated user
    // where status is 'in_progress', 'completed', or 'claimed'
    const userProgress = await db.userAirdropStatus.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['in_progress', 'completed', 'claimed']
        }
      },
      include: {
        airdrop: {
          include: {
            project: true
          }
        },
        wallet: true
      },
      orderBy: [
        { status: 'asc' }, // in_progress first, then completed, then claimed
        { updatedAt: 'desc' } // most recently updated first
      ]
    })

    // Transform the data to return rich objects
    const progressData = userProgress.map(item => ({
      id: item.id,
      status: item.status,
      notes: item.notes,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      claimedAt: item.claimedAt,
      updatedAt: item.updatedAt,
      airdrop: {
        id: item.airdrop.id,
        name: item.airdrop.name,
        description: item.airdrop.description,
        logoUrl: item.airdrop.logoUrl,
        requirements: item.airdrop.requirements,
        riskScore: item.airdrop.riskScore,
        category: item.airdrop.category,
        endDate: item.airdrop.endDate,
        project: {
          id: item.airdrop.project.id,
          name: item.airdrop.project.name,
          logoUrl: item.airdrop.project.logoUrl,
          website: item.airdrop.project.website,
          twitter: item.airdrop.project.twitter,
          discord: item.airdrop.project.discord
        }
      },
      wallet: {
        id: item.wallet.id,
        address: item.wallet.address,
        chain: item.wallet.chain,
        isPrimary: item.wallet.isPrimary
      }
    }))

    return NextResponse.json({
      success: true,
      data: progressData
    })
  } catch (error) {
    console.error('Error fetching user progress:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    )
  }
}