import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const body = await request.json()
    const { status, notes } = body

    // In a real app, you would get the user ID from the session
    const userId = 'demo-user-id'

    // Find the airdrop first
    const airdrop = await db.airdrop.findUnique({
      where: { slug }
    })

    if (!airdrop) {
      return NextResponse.json(
        { error: 'Airdrop not found' },
        { status: 404 }
      )
    }

    // For demo purposes, we'll just return success
    // In a real implementation, you would:
    // 1. Create/update UserAirdropStatus record
    // 2. Return the updated data
    
    const mockResponse = {
      ...airdrop,
      userStatus: status,
      userNotes: notes,
      updatedAt: new Date()
    }

    return NextResponse.json(mockResponse)

  } catch (error) {
    console.error('Error updating airdrop status:', error)
    return NextResponse.json(
      { error: 'Failed to update airdrop status' },
      { status: 500 }
    )
  }
}