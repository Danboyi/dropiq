import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uiPersonalizationEngine } from '@/lib/ui-personalization'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || 'dashboard'
    const action = searchParams.get('action')

    switch (action) {
      case 'config':
        const config = await uiPersonalizationEngine.getPersonalizedUIConfig(session.user.id, page)
        return NextResponse.json({ success: true, data: config })

      case 'recommendations':
        const recommendations = await uiPersonalizationEngine.getAdaptiveRecommendations(session.user.id)
        return NextResponse.json({ success: true, data: recommendations })

      case 'profile':
        const profile = await uiPersonalizationEngine.generatePersonalizationProfile(session.user.id)
        return NextResponse.json({ success: true, data: profile })

      default:
        // Return full personalization data
        const fullProfile = await uiPersonalizationEngine.generatePersonalizationProfile(session.user.id)
        const uiConfig = await uiPersonalizationEngine.getPersonalizedUIConfig(session.user.id, page)
        const adaptiveRecommendations = await uiPersonalizationEngine.getAdaptiveRecommendations(session.user.id)

        return NextResponse.json({
          success: true,
          data: {
            profile: fullProfile,
            uiConfig,
            recommendations: adaptiveRecommendations
          }
        })
    }
  } catch (error) {
    console.error('❌ UI personalization API error:', error)
    return NextResponse.json(
      { error: 'Failed to get personalization data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'track_interaction':
        await uiPersonalizationEngine.trackUIInteraction(session.user.id, {
          ...data,
          timestamp: new Date()
        })
        return NextResponse.json({ success: true })

      case 'update_preferences':
        // This would update user preferences in the database
        await uiPersonalizationEngine.updatePersonalizationProfile(session.user.id, data)
        return NextResponse.json({ success: true })

      case 'refresh_profile':
        const newProfile = await uiPersonalizationEngine.generatePersonalizationProfile(session.user.id)
        return NextResponse.json({ success: true, data: newProfile })

      case 'reset_personalization':
        // Reset personalization data for the user
        await uiPersonalizationEngine.updatePersonalizationProfile(session.user.id, {
          action: 'reset',
          data: {}
        })
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ UI personalization POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to process personalization request' },
      { status: 500 }
    )
  }
}