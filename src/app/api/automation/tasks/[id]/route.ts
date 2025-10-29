import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/services/automation-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const automationService = AutomationService.getInstance();
    const task = await automationService.getTask(params.id);

    return NextResponse.json({
      success: true,
      data: task,
    });

  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Task not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const userId = 'user-123'; // TODO: Get from auth session
    
    const automationService = AutomationService.getInstance();
    const task = await automationService.updateTask(params.id, userId, body);

    return NextResponse.json({
      success: true,
      data: task,
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = 'user-123'; // TODO: Get from auth session
    
    const automationService = AutomationService.getInstance();
    await automationService.deleteTask(params.id, userId);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}