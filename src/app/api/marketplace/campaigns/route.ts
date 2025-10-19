import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get campaign tiers
    const tiers = await db.campaignTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    // Get payment processors
    const processors = await db.paymentProcessor.findMany({
      where: { isActive: true }
    })

    // Get existing projects for selection
    const projects = await db.project.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        trustScore: true
      }
    })

    // Get active airdrops for selection
    const airdrops = await db.airdrop.findMany({
      where: { 
        status: { in: ['upcoming', 'active'] },
        endDate: { gte: new Date() }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        tokenSymbol: true,
        totalAmount: true,
        trustScore: true
      }
    })

    return NextResponse.json({
      tiers,
      processors,
      projects,
      airdrops
    })
  } catch (error) {
    console.error('Error fetching campaign data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      campaignType,
      projectId,
      airdropId,
      tierId,
      creatorId,
      budget,
      currency,
      paymentMethod,
      startDate,
      endDate,
      maxParticipants,
      rewardPerAction,
      rewardType,
      requirements,
      guidelines,
      verificationNeeded,
      autoApproval,
      escrowEnabled,
      tags,
      targeting,
      metadata
    } = body

    // Validate required fields
    if (!title || !description || !campaignType || !creatorId || !budget || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create campaign
    const campaign = await db.shillingCampaign.create({
      data: {
        title,
        description,
        campaignType,
        projectId: projectId || null,
        airdropId: airdropId || null,
        creatorId,
        budget,
        currency,
        paymentMethod,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxParticipants: maxParticipants || null,
        rewardPerAction,
        rewardType,
        requirements: requirements ? JSON.parse(requirements) : null,
        guidelines: guidelines ? JSON.parse(guidelines) : null,
        verificationNeeded: verificationNeeded || false,
        autoApproval: autoApproval || false,
        escrowEnabled: escrowEnabled || true,
        tags: tags ? JSON.stringify(tags) : '[]',
        targeting: targeting ? JSON.parse(targeting) : null,
        tierId: tierId || null,
        metadata: metadata ? JSON.parse(metadata) : null,
        status: 'draft' // Will be reviewed before going live
      }
    })

    // Create verification request if needed
    if (verificationNeeded) {
      await db.marketplaceVerification.create({
        data: {
          campaignId: campaign.id,
          submitterId: creatorId,
          verificationType: 'campaign',
          status: 'pending',
          priority: 'normal',
          verificationLevel: 'basic',
          manualReview: true
        }
      })
    }

    // Track revenue
    await db.revenueTracking.create({
      data: {
        source: 'campaign',
        sourceId: campaign.id,
        type: 'commission',
        amount: budget * 0.1, // 10% platform fee
        currency,
        status: 'pending',
        commissionRate: 0.1,
        commissionAmount: budget * 0.1,
        netAmount: budget * 0.9,
        description: `Platform fee for campaign: ${title}`
      }
    })

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        createdAt: campaign.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}