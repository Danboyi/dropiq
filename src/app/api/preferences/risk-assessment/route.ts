import { NextRequest, NextResponse } from 'next/server';
import { RiskToleranceAssessment, RiskAssessmentQuestions } from '@/lib/risk-assessment';

const riskAssessment = new RiskToleranceAssessment();

export async function POST(request: NextRequest) {
  try {
    const { userId, answers } = await request.json();

    if (!userId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, answers' },
        { status: 400 }
      );
    }

    // Validate answers format
    const requiredFields = [
      'investmentExperience',
      'riskCapacity',
      'timeHorizon',
      'technicalKnowledge',
      'securityPriority',
      'lossTolerance',
      'diversificationUnderstanding',
      'volatilityComfort'
    ];

    for (const field of requiredFields) {
      if (typeof answers[field] !== 'number' || answers[field] < 1 || answers[field] > 5) {
        return NextResponse.json(
          { error: `Invalid or missing field: ${field}. Must be a number between 1 and 5.` },
          { status: 400 }
        );
      }
    }

    // Calculate risk tolerance
    const result = await riskAssessment.calculateRiskTolerance(userId, answers);

    // Save results to database
    await riskAssessment.saveRiskAssessment(userId, result, answers);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in risk assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Get existing risk profile
    const profile = await riskAssessment.getRiskProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'No risk profile found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching risk profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}