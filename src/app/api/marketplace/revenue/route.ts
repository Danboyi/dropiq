import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const source = searchParams.get('source')
    const status = searchParams.get('status')

    const where: any = {}
    if (startDate) where.transactionDate = { gte: new Date(startDate) }
    if (endDate) where.transactionDate = { lte: new Date(endDate) }
    if (source) where.source = source
    if (status) where.status = status

    // Get revenue records
    const revenues = await db.revenueTracking.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      take: 100
    })

    // Calculate summary statistics
    const totalRevenue = revenues.reduce((sum, rev) => sum + Number(rev.amount), 0)
    const settledRevenue = revenues
      .filter(rev => rev.status === 'settled')
      .reduce((sum, rev) => sum + Number(rev.amount), 0)
    const pendingRevenue = revenues
      .filter(rev => rev.status === 'pending')
      .reduce((sum, rev) => sum + Number(rev.amount), 0)

    // Group by source
    const revenueBySource = revenues.reduce((acc, rev) => {
      acc[rev.source] = (acc[rev.source] || 0) + Number(rev.amount)
      return acc
    }, {} as Record<string, number>)

    // Group by type
    const revenueByType = revenues.reduce((acc, rev) => {
      acc[rev.type] = (acc[rev.type] || 0) + Number(rev.amount)
      return acc
    }, {} as Record<string, number>)

    // Get monthly trends
    const monthlyTrends = revenues.reduce((acc, rev) => {
      const month = new Date(rev.transactionDate).toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { revenue: 0, count: 0 }
      }
      acc[month].revenue += Number(rev.amount)
      acc[month].count += 1
      return acc
    }, {} as Record<string, { revenue: number; count: number }>)

    // Get top performing campaigns
    const campaignRevenue = revenues
      .filter(rev => rev.source === 'campaign' && rev.sourceId)
      .reduce((acc, rev) => {
        const campaignId = rev.sourceId!
        if (!acc[campaignId]) {
          acc[campaignId] = { revenue: 0, count: 0 }
        }
        acc[campaignId].revenue += Number(rev.amount)
        acc[campaignId].count += 1
        return acc
      }, {} as Record<string, { revenue: number; count: number }>)

    const topCampaigns = Object.entries(campaignRevenue)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([campaignId, data]) => ({ campaignId, ...data }))

    return NextResponse.json({
      revenues,
      summary: {
        totalRevenue,
        settledRevenue,
        pendingRevenue,
        totalTransactions: revenues.length
      },
      revenueBySource,
      revenueByType,
      monthlyTrends,
      topCampaigns
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      source,
      sourceId,
      type,
      amount,
      currency,
      status,
      relatedPaymentId,
      commissionRate,
      commissionAmount,
      netAmount,
      description
    } = body

    // Validate required fields
    if (!source || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create revenue tracking record
    const revenue = await db.revenueTracking.create({
      data: {
        source,
        sourceId: sourceId || null,
        type,
        amount,
        currency: currency || 'USD',
        status: status || 'pending',
        relatedPaymentId: relatedPaymentId || null,
        commissionRate: commissionRate || null,
        commissionAmount: commissionAmount || null,
        netAmount: netAmount || null,
        description: description || null
      }
    })

    return NextResponse.json({
      success: true,
      revenue: {
        id: revenue.id,
        amount: revenue.amount,
        status: revenue.status,
        createdAt: revenue.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating revenue record:', error)
    return NextResponse.json(
      { error: 'Failed to create revenue record' },
      { status: 500 }
    )
  }
}