import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mlInfrastructure } from '@/lib/ml/infrastructure';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { modelType, inputFeatures } = body;

    // Validate input
    if (!modelType || !inputFeatures) {
      return NextResponse.json(
        { error: 'modelType and inputFeatures are required' },
        { status: 400 }
      );
    }

    // Make prediction
    const prediction = await mlInfrastructure.makePrediction(
      session.user.id,
      modelType,
      inputFeatures
    );

    return NextResponse.json({
      success: true,
      prediction,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ ML prediction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}