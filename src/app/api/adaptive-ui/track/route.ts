import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adaptiveUIService } from '@/lib/adaptive-ui'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, element, section, duration, metadata } = body

    // Validate required fields
    if (!action || !element || !section) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, element, section' 
      }, { status: 400 })
    }

    // Validate action type
    const validActions = ['click', 'view', 'hover', 'scroll', 'search', 'filter', 'navigate']
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      }, { status: 400 })
    }

    // Track the behavior
    await adaptiveUIService.trackUserBehavior(session.user.id, {
      action,
      element,
      section,
      duration,
      metadata: {
        ...metadata,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error tracking user behavior:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}