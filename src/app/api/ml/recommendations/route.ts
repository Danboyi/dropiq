import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mlInfrastructure } from '@/lib/ml/infrastructure';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate user feature vector
    const userFeatures = await mlInfrastructure.generateUserFeatureVector(session.user.id);
    
    // Get AI-powered recommendations
    const prediction = await mlInfrastructure.makePrediction(
      session.user.id,
      'airdrop_recommendation',
      userFeatures
    );

    // Get actual airdrops based on recommendations
    const recommendedCategories = prediction.recommendations?.map((rec: any) => rec.category) || [];
    
    const airdrops = await db.airdrop.findMany({
      where: {
        status: 'VETTED',
        category: {
          in: recommendedCategories.length > 0 ? recommendedCategories : ['defi', 'gaming', 'nft'],
        },
      },
      orderBy: [
        { hypeScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    return NextResponse.json({
      success: true,
      recommendations: prediction.recommendations || [],
      airdrops,
      confidence: prediction.confidence || 0.5,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}