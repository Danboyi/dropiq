import { db } from '@/lib/db';
import { ethers } from 'ethers';
import type { 
  AutomatedTask, 
  TaskExecution, 
  TaskApproval, 
  TaskBatch,
  TaskType,
  TaskStatus,
  ExecutionMode,
  TaskParameter,
  GasSettings,
  SecuritySettings
} from '@/types/automation';

export class AutomationService {
  private static instance: AutomationService;

  static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  // Task Management
  async createTask(userId: string, taskData: Omit<AutomatedTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomatedTask> {
    // Validate security settings
    await this.validateSecuritySettings(userId, taskData.securitySettings);
    
    // Estimate gas if needed
    if (taskData.executionMode !== 'manual') {
      taskData.estimatedGas = await this.estimateGas(taskData);
    }

    const task = await db.automatedTask.create({
      data: {
        ...taskData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        executions: true,
        approvals: true,
      },
    });

    // If approval is required, create approval request
    if (taskData.approvalRequired) {
      await this.createApprovalRequest(task.id, userId);
    }

    return task;
  }

  async updateTask(taskId: string, userId: string, updates: Partial<AutomatedTask>): Promise<AutomatedTask> {
    // Verify ownership
    const existingTask = await this.getTask(taskId);
    if (existingTask.userId !== userId) {
      throw new Error('Unauthorized to update this task');
    }

    // If task is already executing, don't allow critical updates
    if (existingTask.status === 'executing') {
      throw new Error('Cannot update task while executing');
    }

    return await db.automatedTask.update({
      where: { id: taskId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        executions: true,
        approvals: true,
      },
    });
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (task.userId !== userId) {
      throw new Error('Unauthorized to delete this task');
    }

    // Can only delete tasks in certain states
    if (['executing', 'completed'].includes(task.status)) {
      throw new Error('Cannot delete task in current state');
    }

    await db.automatedTask.delete({
      where: { id: taskId },
    });
  }

  async getTask(taskId: string): Promise<AutomatedTask> {
    const task = await db.automatedTask.findUnique({
      where: { id: taskId },
      include: {
        executions: true,
        approvals: true,
        batch: true,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async getUserTasks(userId: string, filters?: {
    status?: TaskStatus;
    taskType?: TaskType;
    executionMode?: ExecutionMode;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: AutomatedTask[]; total: number }> {
    const where: any = { userId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.taskType) where.taskType = filters.taskType;
    if (filters?.executionMode) where.executionMode = filters.executionMode;

    const [tasks, total] = await Promise.all([
      db.automatedTask.findMany({
        where,
        include: {
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
          approvals: {
            where: { status: 'pending' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      db.automatedTask.count({ where }),
    ]);

    return { tasks, total };
  }

  // Task Execution
  async executeTask(taskId: string, userId: string): Promise<TaskExecution> {
    const task = await this.getTask(taskId);
    
    if (task.userId !== userId) {
      throw new Error('Unauthorized to execute this task');
    }

    // Check if task can be executed
    if (!this.canExecuteTask(task)) {
      throw new Error('Task cannot be executed in current state');
    }

    // Check approvals if required
    if (task.approvalRequired) {
      const hasApproval = await this.checkTaskApproval(taskId);
      if (!hasApproval) {
        throw new Error('Task requires approval before execution');
      }
    }

    // Create execution record
    const execution = await db.taskExecution.create({
      data: {
        taskId,
        userId,
        status: 'executing',
        startedAt: new Date(),
      },
    });

    // Update task status
    await db.automatedTask.update({
      where: { id: taskId },
      data: {
        status: 'executing',
        executedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    try {
      // Execute the transaction
      const result = await this.performTaskExecution(task, execution);
      
      // Update execution with success
      await db.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          gasPrice: result.gasPrice,
          cost: result.cost,
          result: result.result,
          completedAt: new Date(),
        },
      });

      // Update task status
      await db.automatedTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return await db.taskExecution.findUniqueOrThrow({
        where: { id: execution.id },
      });

    } catch (error) {
      // Update execution with error
      await db.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      // Update task status
      await db.automatedTask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private async performTaskExecution(task: AutomatedTask, execution: TaskExecution): Promise<{
    transactionHash: string;
    blockNumber?: number;
    gasUsed?: string;
    gasPrice?: string;
    cost?: string;
    result?: any;
  }> {
    // This is where the actual blockchain interaction happens
    // For now, we'll simulate it with a mock implementation
    
    const gasSettings = task.gasSettings as GasSettings;
    const parameters = task.parameters as TaskParameter[];
    
    // Simulate transaction execution
    const mockResult = {
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: Math.floor(Math.random() * 100000).toString(),
      gasPrice: gasSettings.maxGasPrice,
      cost: (Math.random() * 0.01).toString(),
      result: { success: true },
    };

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return mockResult;
  }

  private canExecuteTask(task: AutomatedTask): boolean {
    const validStatuses = ['pending', 'approved', 'failed'];
    return validStatuses.includes(task.status);
  }

  // Approval System
  async createApprovalRequest(taskId: string, userId: string): Promise<TaskApproval> {
    return await db.taskApproval.create({
      data: {
        taskId,
        userId,
        approverType: 'user',
        status: 'pending',
        createdAt: new Date(),
      },
    });
  }

  async approveTask(approvalId: string, userId: string, reason?: string): Promise<void> {
    const approval = await db.taskApproval.findUnique({
      where: { id: approvalId },
      include: { task: true },
    });

    if (!approval) {
      throw new Error('Approval not found');
    }

    if (approval.userId !== userId) {
      throw new Error('Unauthorized to approve this task');
    }

    await db.taskApproval.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        reason,
        respondedAt: new Date(),
      },
    });

    // Update task status
    await db.automatedTask.update({
      where: { id: approval.taskId },
      data: {
        status: 'approved',
        updatedAt: new Date(),
      },
    });
  }

  async rejectTask(approvalId: string, userId: string, reason?: string): Promise<void> {
    const approval = await db.taskApproval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new Error('Approval not found');
    }

    if (approval.userId !== userId) {
      throw new Error('Unauthorized to reject this task');
    }

    await db.taskApproval.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        reason,
        respondedAt: new Date(),
      },
    });

    // Update task status
    await db.automatedTask.update({
      where: { id: approval.taskId },
      data: {
        status: 'rejected',
        updatedAt: new Date(),
      },
    });
  }

  private async checkTaskApproval(taskId: string): Promise<boolean> {
    const approval = await db.taskApproval.findFirst({
      where: {
        taskId,
        status: 'approved',
      },
    });

    return !!approval;
  }

  // Batch Operations
  async createBatch(userId: string, batchData: Omit<TaskBatch, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskBatch> {
    return await db.taskBatch.create({
      data: {
        ...batchData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        tasks: true,
      },
    });
  }

  async executeBatch(batchId: string, userId: string): Promise<TaskExecution[]> {
    const batch = await db.taskBatch.findUnique({
      where: { id: batchId },
      include: { tasks: true },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    if (batch.userId !== userId) {
      throw new Error('Unauthorized to execute this batch');
    }

    // Update batch status
    await db.taskBatch.update({
      where: { id: batchId },
      data: {
        status: 'executing',
        executedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const executions: TaskExecution[] = [];

    if (batch.executionMode === 'sequential') {
      // Execute tasks one by one
      for (const task of batch.tasks) {
        try {
          const execution = await this.executeTask(task.id, userId);
          executions.push(execution);
        } catch (error) {
          // Stop execution on first error for sequential mode
          break;
        }
      }
    } else {
      // Execute tasks in parallel
      const executionPromises = batch.tasks.map(task => 
        this.executeTask(task.id, userId).catch(error => {
          console.error(`Task ${task.id} failed:`, error);
          return null;
        })
      );

      const results = await Promise.all(executionPromises);
      executions.push(...results.filter(Boolean) as TaskExecution[]);
    }

    // Update batch status
    const allSuccessful = executions.length === batch.tasks.length;
    await db.taskBatch.update({
      where: { id: batchId },
      data: {
        status: allSuccessful ? 'completed' : 'failed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return executions;
  }

  // Utility Methods
  private async validateSecuritySettings(userId: string, securitySettings: SecuritySettings): Promise<void> {
    // Validate against user's automation settings
    const userSettings = await db.automationSettings.findUnique({
      where: { userId },
    });

    if (!userSettings?.isEnabled) {
      throw new Error('Automation is disabled for this user');
    }

    // Additional security validations can be added here
  }

  private async estimateGas(task: AutomatedTask): Promise<number> {
    // Mock gas estimation - in real implementation, this would call the blockchain
    const baseGas = 21000;
    const functionGas = Math.floor(Math.random() * 100000);
    return baseGas + functionGas;
  }

  // Scheduling
  async scheduleTask(taskId: string, scheduledAt: Date): Promise<void> {
    await db.automatedTask.update({
      where: { id: taskId },
      data: {
        executionMode: 'scheduled',
        scheduledAt,
        updatedAt: new Date(),
      },
    });
  }

  async getScheduledTasks(): Promise<AutomatedTask[]> {
    return await db.automatedTask.findMany({
      where: {
        executionMode: 'scheduled',
        scheduledAt: {
          lte: new Date(),
        },
        status: 'pending',
      },
      include: {
        executions: true,
        approvals: true,
      },
    });
  }
}