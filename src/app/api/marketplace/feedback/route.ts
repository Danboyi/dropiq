import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const userId = searchParams.get('userId')
    const feedbackType = searchParams.get('feedbackType')
    const status = searchParams.get('status')
    const isPublic = searchParams.get('isPublic')

    const where: any = {}
    if (campaignId) where.campaignId = campaignId
    if (userId) where.userId = userId
    if (feedbackType) where.feedbackType = feedbackType
    if (status) where.status = status
    if (isPublic) where.isPublic = isPublic === 'true'

    const feedbacks = await db.userFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Calculate average ratings for campaigns
    const campaignRatings = feedbacks
      .filter(f => f.campaignId && f.rating)
      .reduce((acc, feedback) => {
        const campaignId = feedback.campaignId!
        if (!acc[campaignId]) {
          acc[campaignId] = { total: 0, count: 0 }
        }
        acc[campaignId].total += feedback.rating
        acc[campaignId].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number }>)

    const averageRatings = Object.entries(campaignRatings).reduce((acc, [campaignId, data]) => {
      acc[campaignId] = data.total / data.count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      feedbacks,
      averageRatings,
      summary: {
        totalFeedbacks: feedbacks.length,
        publicFeedbacks: feedbacks.filter(f => f.isPublic).length,
        averageRating: feedbacks.length > 0 
          ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      campaignId,
      participationId,
      feedbackType,
      rating,
      title,
      content,
      isPublic
    } = body

    // Validate required fields
    if (!userId || !feedbackType || !rating || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already provided feedback for this campaign/participation
    const existingFeedback = await db.userFeedback.findFirst({
      where: {
        userId,
        campaignId: campaignId || null,
        participationId: participationId || null,
        feedbackType
      }
    })

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this item' },
        { status: 400 }
      )
    }

    // Create feedback record
    const feedback = await db.userFeedback.create({
      data: {
        userId,
        campaignId: campaignId || null,
        participationId: participationId || null,
        feedbackType,
        rating,
        title: title || null,
        content,
        isPublic: isPublic || false,
        status: 'pending' // Requires moderation
      }
    })

    // If this is campaign feedback, update campaign metrics
    if (campaignId && feedbackType === 'campaign') {
      // Update campaign with new rating data
      const allFeedbacks = await db.userFeedback.findMany({
        where: {
          campaignId,
          feedbackType: 'campaign',
          status: 'approved'
        }
      })

      const averageRating = allFeedbacks.length > 0 
        ? allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length 
        : rating

      // Store rating in campaign metadata or separate metrics table
      await db.shillingMetrics.create({
        data: {
          campaignId,
          date: new Date(),
          rating: averageRating,
          feedbackCount: allFeedbacks.length + 1
        }
      })
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      feedbackId,
      status,
      moderatedBy,
      moderatorNotes,
      response,
      helpfulVotes
    } = body

    // Validate required fields
    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (moderatedBy) updateData.moderatedBy = moderatedBy
    if (moderatorNotes) updateData.moderatorNotes = moderatorNotes
    if (response) {
      updateData.response = response
      updateData.respondedAt = new Date()
      updateData.respondedBy = moderatedBy
    }
    if (helpfulVotes !== undefined) updateData.helpfulVotes = helpfulVotes

    if (status === 'approved') {
      updateData.moderatedAt = new Date()
    }

    const feedback = await db.userFeedback.update({
      where: { id: feedbackId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        status: feedback.status,
        moderatedAt: feedback.moderatedAt
      }
    })
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    )
  }
}