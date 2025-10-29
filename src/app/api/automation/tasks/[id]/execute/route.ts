import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/services/automation-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = 'user-123'; // TODO: Get from auth session
    
    const automationService = AutomationService.getInstance();
    const execution = await automationService.executeTask(params.id, userId);

    return NextResponse.json({
      success: true,
      data: execution,
    });

  } catch (error) {
    console.error('Error executing task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to execute task' 
      },
      { status: 500 }
    );
  }
}