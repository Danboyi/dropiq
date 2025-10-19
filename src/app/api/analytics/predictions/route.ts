import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Generate ML predictions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      modelType,
      targetId,
      targetType,
      inputFeatures,
      predictionDate
    } = body;

    // Validate required fields
    if (!modelType || !targetId || !targetType) {
      return NextResponse.json(
        { error: 'modelType, targetId, and targetType are required' },
        { status: 400 }
      );
    }

    // Get model configuration
    const model = await db.mLModel.findFirst({
      where: {
        type: getModelType(modelType),
        isActive: true
      }
    });

    if (!model) {
      return NextResponse.json(
        { error: 'No active model found for this prediction type' },
        { status: 404 }
      );
    }

    // Generate prediction
    const prediction = await generatePrediction(
      model,
      targetId,
      targetType,
      inputFeatures,
      predictionDate || new Date()
    );

    // Store prediction
    const savedPrediction = await db.mLPrediction.create({
      data: {
        modelType,
        modelVersion: model.version,
        inputFeatures,
        prediction: prediction.result,
        confidence: prediction.confidence,
        accuracy: model.accuracy,
        targetId,
        targetType,
        predictionDate: predictionDate || new Date(),
        metadata: {
          modelId: model.id,
          generatedAt: new Date().toISOString(),
          algorithm: model.algorithm
        }
      }
    });

    return NextResponse.json({
      success: true,
      prediction: savedPrediction,
      insights: prediction.insights
    });
  } catch (error) {
    console.error('Error generating prediction:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}

// Get predictions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('modelType');
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};
    if (modelType) where.modelType = modelType;
    if (targetId) where.targetId = targetId;
    if (targetType) where.targetType = targetType;
    if (startDate && endDate) {
      where.predictionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const predictions = await db.mLPrediction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        // Include related data based on target type
      }
    });

    // Calculate accuracy metrics
    const accuracyMetrics = await calculateAccuracyMetrics(predictions);

    return NextResponse.json({
      predictions,
      accuracyMetrics,
      total: predictions.length
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

// Generate prediction using AI
async function generatePrediction(
  model: any,
  targetId: string,
  targetType: string,
  inputFeatures: any,
  predictionDate: Date
) {
  try {
    const zai = await ZAI.create();

    let prompt = '';
    let context = '';

    // Build context based on target type
    switch (targetType) {
      case 'airdrop':
        context = await getAirdropContext(targetId);
        break;
      case 'project':
        context = await getProjectContext(targetId);
        break;
      case 'user':
        context = await getUserContext(targetId);
        break;
    }

    // Build prompt based on model type
    switch (model.type) {
      case 'airdrop_potential':
        prompt = buildAirdropPotentialPrompt(context, inputFeatures);
        break;
      case 'risk_assessment':
        prompt = buildRiskAssessmentPrompt(context, inputFeatures);
        break;
      case 'price_prediction':
        prompt = buildPricePredictionPrompt(context, inputFeatures);
        break;
      case 'user_behavior':
        prompt = buildUserBehaviorPrompt(context, inputFeatures);
        break;
      default:
        throw new Error(`Unknown model type: ${model.type}`);
    }

    const prediction = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert ML prediction model for ${model.type}. 
          Provide predictions with confidence scores and detailed reasoning.
          Return response in JSON format with: result, confidence, reasoning, insights.`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = prediction.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return {
          result: parsed.result,
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning,
          insights: parsed.insights
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          result: content,
          confidence: 0.5,
          reasoning: content,
          insights: []
        };
      }
    }

    throw new Error('No prediction generated');
  } catch (error) {
    console.error('Error generating prediction:', error);
    return {
      result: null,
      confidence: 0,
      reasoning: 'Error generating prediction',
      insights: []
    };
  }
}

// Get airdrop context for prediction
async function getAirdropContext(airdropId: string) {
  const airdrop = await db.airdrop.findUnique({
    where: { id: airdropId },
    include: {
      project: true
    }
  });

  if (!airdrop) return '';

  const analytics = await db.airdropAnalytics.findMany({
    where: { airdropId },
    orderBy: { date: 'desc' },
    take: 30
  });

  return `
    Airdrop: ${airdrop.title}
    Project: ${airdrop.project?.name}
    Total Amount: ${airdrop.totalAmount}
    Participants: ${airdrop.participantsCount}
    Trust Score: ${airdrop.trustScore}
    Status: ${airdrop.status}
    
    Recent Analytics:
    ${analytics.map(a => `
      Date: ${a.date}
      Views: ${a.views}
      Registrations: ${a.registrations}
      Engagement Rate: ${a.engagementRate}%
      Conversion Rate: ${a.conversionRate}%
    `).join('\n')}
  `;
}

// Get project context for prediction
async function getProjectContext(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId }
  });

  if (!project) return '';

  return `
    Project: ${project.name}
    Category: ${project.category}
    Blockchain: ${project.blockchain}
    Trust Score: ${project.trustScore}
    Verification Status: ${project.verificationStatus}
    Description: ${project.description}
  `;
}

// Get user context for prediction
async function getUserContext(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) return '';

  const behavior = await db.userBehavior.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 50
  });

  const portfolio = await db.userPortfolio.findUnique({
    where: { userId }
  });

  return `
    User: ${user.displayName || user.username}
    Role: ${user.role}
    Premium: ${user.isPremium}
    
    Recent Behavior:
    ${behavior.slice(0, 10).map(b => `${b.eventType}: ${b.eventName}`).join('\n')}
    
    Portfolio:
    Total Value: ${portfolio?.totalValue || 0}
    ROI: ${portfolio?.roiPercentage || 0}%
    Holdings: ${portfolio?.holdings ? Object.keys(portfolio.holdings).length : 0}
  `;
}

// Build prompts for different model types
function buildAirdropPotentialPrompt(context: string, features: any) {
  return `
    Predict the potential success of this airdrop:
    
    ${context}
    
    Additional Features:
    ${JSON.stringify(features, null, 2)}
    
    Predict:
    1. Success probability (0-100)
    2. Expected participant count
    3. Engagement level (low/medium/high)
    4. Risk level (low/medium/high)
    5. Recommendation (pursue/avoid/cautious)
    
    Provide confidence score and detailed reasoning.
  `;
}

function buildRiskAssessmentPrompt(context: string, features: any) {
  return `
    Assess the risk level for this target:
    
    ${context}
    
    Additional Features:
    ${JSON.stringify(features, null, 2)}
    
    Assess:
    1. Risk score (0-100)
    2. Risk factors
    3. Mitigation strategies
    4. Risk category (low/medium/high/critical)
    5. Recommended actions
    
    Provide confidence score and detailed reasoning.
  `;
}

function buildPricePredictionPrompt(context: string, features: any) {
  return `
    Predict price movement for this asset:
    
    ${context}
    
    Additional Features:
    ${JSON.stringify(features, null, 2)}
    
    Predict:
    1. Price change percentage (7 days)
    2. Target price range
    3. Confidence level
    4. Key factors influencing prediction
    5. Risk factors
    
    Provide confidence score and detailed reasoning.
  `;
}

function buildUserBehaviorPrompt(context: string, features: any) {
  return `
    Predict user behavior patterns:
    
    ${context}
    
    Additional Features:
    ${JSON.stringify(features, null, 2)}
    
    Predict:
    1. Next likely action
    2. Engagement probability
    3. Conversion likelihood
    4. Churn risk
    5. Recommended interventions
    
    Provide confidence score and detailed reasoning.
  `;
}

// Map model type string to enum
function getModelType(type: string): string {
  const typeMap: Record<string, string> = {
    'airdrop_potential': 'classification',
    'risk_assessment': 'classification',
    'price_prediction': 'regression',
    'user_behavior': 'classification'
  };
  
  return typeMap[type] || 'classification';
}

// Calculate accuracy metrics
async function calculateAccuracyMetrics(predictions: any[]) {
  const metrics = {
    totalPredictions: predictions.length,
    averageConfidence: 0,
    accuracyByType: {} as Record<string, any>,
    recentAccuracy: 0,
    modelPerformance: {} as Record<string, any>
  };

  if (predictions.length === 0) return metrics;

  // Calculate average confidence
  const confidences = predictions.map(p => p.confidence);
  metrics.averageConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  // Group by model type
  const byType = predictions.reduce((acc, p) => {
    if (!acc[p.modelType]) acc[p.modelType] = [];
    acc[p.modelType].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate metrics for each type
  for (const [type, preds] of Object.entries(byType)) {
    const avgConfidence = preds.reduce((a, b: any) => a + b.confidence, 0) / preds.length;
    const withActual = preds.filter((p: any) => p.actualValue !== null);
    
    let accuracy = 0;
    if (withActual.length > 0) {
      // Simple accuracy calculation (can be improved)
      const correct = withActual.filter((p: any) => {
        const predicted = p.prediction?.value || p.prediction;
        const actual = p.actualValue;
        return Math.abs(Number(predicted) - Number(actual)) < 0.1; // 10% tolerance
      }).length;
      accuracy = (correct / withActual.length) * 100;
    }

    metrics.accuracyByType[type] = {
      count: preds.length,
      averageConfidence: avgConfidence,
      accuracy: accuracy,
      withActualValues: withActual.length
    };
  }

  // Recent accuracy (last 10 predictions with actual values)
  const recentWithActual = predictions
    .filter(p => p.actualValue !== null)
    .slice(0, 10);

  if (recentWithActual.length > 0) {
    const correct = recentWithActual.filter(p => {
      const predicted = p.prediction?.value || p.prediction;
      const actual = p.actualValue;
      return Math.abs(Number(predicted) - Number(actual)) < 0.1;
    }).length;
    metrics.recentAccuracy = (correct / recentWithActual.length) * 100;
  }

  return metrics;
}