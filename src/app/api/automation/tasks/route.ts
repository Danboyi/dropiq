import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/services/automation-service';
import { z } from 'zod';

const CreateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  taskType: z.enum(['token_approval', 'contract_interaction', 'swap', 'bridge', 'stake', 'unstake', 'claim', 'delegate', 'vote', 'custom']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  executionMode: z.enum(['manual', 'scheduled', 'conditional', 'batch']).default('manual'),
  contractAddress: z.string().min(1, 'Contract address is required'),
  abi: z.any(),
  functionName: z.string().min(1, 'Function name is required'),
  parameters: z.any(),
  value: z.string().optional(),
  gasSettings: z.object({
    maxGasPrice: z.string(),
    maxGasLimit: z.string(),
    gasMultiplier: z.number(),
    priorityFee: z.string().optional(),
  }),
  securitySettings: z.object({
    requireConfirmation: z.boolean(),
    maxAmountPerTransaction: z.string(),
    maxTransactionsPerHour: z.number(),
    allowedContracts: z.array(z.string()),
    blockedContracts: z.array(z.string()),
    requireMultiSig: z.boolean(),
    timelockMinutes: z.number(),
  }),
  scheduledAt: z.date().optional(),
  conditions: z.any().optional(),
  batchId: z.string().optional(),
  batchOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  approvalRequired: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-123'; // TODO: Get from auth session
    
    const filters = {
      status: searchParams.get('status') as any,
      taskType: searchParams.get('taskType') as any,
      executionMode: searchParams.get('executionMode') as any,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const automationService = AutomationService.getInstance();
    const result = await automationService.getUserTasks(userId, filters);

    return NextResponse.json({
      success: true,
      data: result.tasks,
      total: result.total,
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateTaskSchema.parse(body);
    
    const userId = 'user-123'; // TODO: Get from auth session
    
    const automationService = AutomationService.getInstance();
    const task = await automationService.createTask(userId, {
      ...validatedData,
      status: 'pending',
      approvalRequired: validatedData.approvalRequired,
    });

    return NextResponse.json({
      success: true,
      data: task,
    });

  } catch (error) {
    console.error('Error creating task:', error);
    
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
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}