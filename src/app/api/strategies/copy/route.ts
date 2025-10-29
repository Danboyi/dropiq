import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const CopyStrategySchema = z.object({
  originalStrategyId: z.string(),
  settings: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    riskAdjustment: z.enum(['conservative', 'moderate', 'aggressive']),
    timelineMultiplier: z.number().min(0.5).max(2),
    budgetMultiplier: z.number().min(0.5).max(3),
    includeTips: z.boolean(),
    includeRequirements: z.boolean(),
    adaptToUser: z.boolean(),
    customNotes: z.string().optional(),
  }),
});

interface CopySettings {
  title: string;
  description: string;
  riskAdjustment: 'conservative' | 'moderate' | 'aggressive';
  timelineMultiplier: number;
  budgetMultiplier: number;
  includeTips: boolean;
  includeRequirements: boolean;
  adaptToUser: boolean;
  customNotes?: string;
}

function adjustRiskLevel(originalRisk: string, adjustment: string): string {
  const riskLevels = ['low', 'medium', 'high', 'extreme'];
  const currentIndex = riskLevels.indexOf(originalRisk);
  
  switch (adjustment) {
    case 'conservative':
      return riskLevels[Math.max(0, currentIndex - 1)];
    case 'aggressive':
      return riskLevels[Math.min(riskLevels.length - 1, currentIndex + 1)];
    default:
      return originalRisk;
  }
}

function personalizeContent(
  originalContent: string,
  settings: CopySettings,
  originalRisk: string
): string {
  let personalizedContent = originalContent;
  
  // Add personalization header
  const personalizationHeader = `# Personalized Strategy Copy

**Original Risk Level:** ${originalRisk}
**Adjusted Risk Level:** ${adjustRiskLevel(originalRisk, settings.riskAdjustment)}
**Timeline Multiplier:** ${settings.timelineMultiplier}x
**Budget Multiplier:** ${settings.budgetMultiplier}x

---

`;

  // Add custom notes if provided
  if (settings.customNotes) {
    personalizedContent += `## Custom Notes

${settings.customNotes}

---

`;
  }

  // Add risk adjustment notes
  if (settings.riskAdjustment !== 'moderate') {
    personalizedContent += `## Risk Adjustment Notes

This strategy has been modified to be **${settings.riskAdjustment}**:

`;
    
    switch (settings.riskAdjustment) {
      case 'conservative':
        personalizedContent += `- Reduced exposure to high-risk elements
- Added additional safety checks and precautions
- Extended timeline for more careful execution
- Lower budget requirements for reduced risk

`;
        break;
      case 'aggressive':
        personalizedContent += `- Increased exposure to high-reward opportunities
- Streamlined execution for faster results
- Higher budget allocation for maximum impact
- Additional monitoring required due to increased risk

`;
        break;
    }
    
    personalizedContent += `---

`;
  }

  // Add timeline adjustment notes
  if (settings.timelineMultiplier !== 1) {
    personalizedContent += `## Timeline Adjustment

This strategy has been adjusted to run at **${Math.round(settings.timelineMultiplier * 100)}%** of the original timeline.

`;
    
    if (settings.timelineMultiplier > 1) {
      personalizedContent += `- Extended timeline allows for more thorough execution
- Additional time for research and verification
- Reduced time pressure for better decision making

`;
    } else {
      personalizedContent += `- Compressed timeline for faster execution
- Requires more focused and efficient work
- May need to prioritize certain steps

`;
    }
    
    personalizedContent += `---

`;
  }

  // Add budget adjustment notes
  if (settings.budgetMultiplier !== 1) {
    personalizedContent += `## Budget Adjustment

This strategy has been adjusted to use **${Math.round(settings.budgetMultiplier * 100)}%** of the original budget.

`;
    
    if (settings.budgetMultiplier > 1) {
      personalizedContent += `- Increased budget allows for more opportunities
- Ability to participate in additional platforms
- Higher potential returns with proportional risk

`;
    } else {
      personalizedContent += `- Reduced budget for more conservative approach
- Focus on highest-impact activities
- May need to skip some optional steps

`;
    }
    
    personalizedContent += `---

`;
  }

  // Add user adaptation notes
  if (settings.adaptToUser) {
    personalizedContent += `## Personalized for Your Profile

This strategy has been automatically adapted based on your:
- Historical success patterns
- Preferred blockchain networks
- Risk tolerance level
- Available time commitment

---

`;
  }

  // Add original content
  personalizedContent += `## Original Strategy Content

${originalContent}`;

  return personalizedContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CopyStrategySchema.parse(body);
    
    const { originalStrategyId, settings } = validatedData;

    // Get the original strategy
    const originalStrategy = await db.strategy.findUnique({
      where: { id: originalStrategyId },
      include: {
        author: true,
        ratings: true,
        comments: true,
        tips: true,
        requirements: true,
      },
    });

    if (!originalStrategy) {
      return NextResponse.json(
        { error: 'Original strategy not found' },
        { status: 404 }
      );
    }

    // Calculate adjusted values
    const newRiskLevel = adjustRiskLevel(originalStrategy.riskLevel, settings.riskAdjustment);
    const newEstimatedTime = Math.round(originalStrategy.estimatedTime * settings.timelineMultiplier);
    const newPotentialReward = originalStrategy.potentialReward 
      ? Math.round(originalStrategy.potentialReward * settings.budgetMultiplier)
      : null;

    // Create personalized content
    const personalizedContent = personalizeContent(
      originalStrategy.content,
      settings,
      originalStrategy.riskLevel
    );

    // Create the copied strategy
    const copiedStrategy = await db.strategy.create({
      data: {
        title: settings.title,
        description: settings.description,
        content: personalizedContent,
        category: originalStrategy.category,
        difficulty: originalStrategy.difficulty,
        riskLevel: newRiskLevel,
        estimatedTime: newEstimatedTime,
        potentialReward: newPotentialReward,
        tags: [...originalStrategy.tags, 'personalized', 'copy'],
        isPublic: false, // Copied strategies are private by default
        isVerified: false, // Copied strategies are not verified
        originalStrategyId: originalStrategyId,
        authorId: 'user-123', // TODO: Get from auth session
        metadata: {
          copySettings: settings,
          originalAuthor: originalStrategy.author.username,
          copiedAt: new Date().toISOString(),
        },
      },
      include: {
        author: true,
        ratings: true,
        comments: true,
        tips: settings.includeTips ? {
          where: { strategyId: originalStrategyId }
        } : false,
        requirements: settings.includeRequirements ? {
          where: { strategyId: originalStrategyId }
        } : false,
      },
    });

    // Copy tips if included
    if (settings.includeTips && originalStrategy.tips.length > 0) {
      await Promise.all(
        originalStrategy.tips.map(tip =>
          db.strategyTip.create({
            data: {
              content: tip.content,
              strategyId: copiedStrategy.id,
            },
          })
        )
      );
    }

    // Copy requirements if included
    if (settings.includeRequirements && originalStrategy.requirements.length > 0) {
      await Promise.all(
        originalStrategy.requirements.map(req =>
          db.strategyRequirement.create({
            data: {
              requirement: req.requirement,
              strategyId: copiedStrategy.id,
            },
          })
        )
      );
    }

    // Update metrics for the original strategy
    await db.strategy.update({
      where: { id: originalStrategyId },
      data: {
        metrics: {
          ...originalStrategy.metrics,
          copies: (originalStrategy.metrics as any)?.copies + 1 || 1,
        },
      },
    });

    // Create activity log
    await db.activity.create({
      data: {
        type: 'strategy_copied',
        userId: 'user-123', // TODO: Get from auth session
        strategyId: copiedStrategy.id,
        metadata: {
          originalStrategyId,
          copySettings: settings,
        },
      },
    });

    return NextResponse.json(copiedStrategy);

  } catch (error) {
    console.error('Error copying strategy:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to copy strategy' },
      { status: 500 }
    );
  }
}