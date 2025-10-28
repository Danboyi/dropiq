import { NextRequest, NextResponse } from 'next/server'
import { authenticateToken, requireRole } from '@/lib/middleware/authenticateToken'
import { processDetectUserActivityJob } from '@/scripts/activity-detection-job'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authenticatedReq = await authenticateToken(request)
    
    // Check if user is premium
    if (!requireRole('premium')(authenticatedReq)) {
      return NextResponse.json(
        { error: 'This feature is only available to premium users' },
        { status: 403 }
      )
    }

    if (!authenticatedReq.user) {
      return NextResponse.json(
        { error: 'User authentication failed' },
        { status: 401 }
      )
    }

    const userId = authenticatedReq.user.id

    // Trigger the activity detection job asynchronously
    // In a production environment with BullMQ, this would add to a queue
    // For now, we'll run it asynchronously with a timeout
    setTimeout(async () => {
      try {
        await processDetectUserActivityJob({ userId })
        console.log(`Activity detection job completed for user: ${userId}`)
      } catch (error) {
        console.error(`Activity detection job failed for user ${userId}:`, error)
      }
    }, 100)

    return NextResponse.json({
      success: true,
      message: 'Activity detection scan started. We will notify you if any new activity is detected.',
      jobId: `activity-detection-${userId}-${Date.now()}`
    })

  } catch (error) {
    console.error('Error in activity detection trigger:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication failed')) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to start activity detection' },
      { status: 500 }
    )
  }
}