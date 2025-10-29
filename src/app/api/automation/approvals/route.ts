import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/services/automation-service';
import { z } from 'zod';

const ApprovalSchema = z.object({
  approvalId: z.string(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { approvalId, action, reason } = ApprovalSchema.parse(body);
    
    const userId = 'user-123'; // TODO: Get from auth session
    const automationService = AutomationService.getInstance();

    if (action === 'approve') {
      await automationService.approveTask(approvalId, userId, reason);
    } else {
      await automationService.rejectTask(approvalId, userId, reason);
    }

    return NextResponse.json({
      success: true,
      message: `Task ${action}d successfully`,
    });

  } catch (error) {
    console.error('Error processing approval:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}