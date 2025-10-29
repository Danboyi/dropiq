export enum TaskType {
  TOKEN_APPROVAL = 'token_approval',
  CONTRACT_INTERACTION = 'contract_interaction',
  SWAP = 'swap',
  BRIDGE = 'bridge',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CLAIM = 'claim',
  DELEGATE = 'delegate',
  VOTE = 'vote',
  CUSTOM = 'custom'
}

export enum TaskStatus {
  PENDING = 'pending',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ExecutionMode {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  CONDITIONAL = 'conditional',
  BATCH = 'batch'
}

export interface TaskParameter {
  name: string;
  type: 'address' | 'uint256' | 'bool' | 'string' | 'bytes';
  value: any;
  description?: string;
}

export interface TaskCondition {
  type: 'time' | 'price' | 'balance' | 'gas_price' | 'block_number' | 'custom';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  value: any;
  description?: string;
}

export interface GasSettings {
  maxGasPrice: string; // in gwei
  maxGasLimit: string;
  gasMultiplier: number; // multiplier for estimated gas
  priorityFee?: string; // for EIP-1559
}

export interface SecuritySettings {
  requireConfirmation: boolean;
  maxAmountPerTransaction: string;
  maxTransactionsPerHour: number;
  allowedContracts: string[];
  blockedContracts: string[];
  requireMultiSig: boolean;
  timelockMinutes: number;
}

export interface AutomatedTask {
  id: string;
  userId: string;
  name: string;
  description: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  executionMode: ExecutionMode;
  
  // Task configuration
  contractAddress: string;
  abi: any;
  functionName: string;
  parameters: TaskParameter[];
  value?: string; // ETH value to send
  
  // Execution settings
  gasSettings: GasSettings;
  securitySettings: SecuritySettings;
  
  // Scheduling (if applicable)
  scheduledAt?: Date;
  conditions?: TaskCondition[];
  
  // Batch settings (if applicable)
  batchId?: string;
  batchOrder?: number;
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
  
  // Tracking
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  
  // Relations
  executions: TaskExecution[];
  approvals: TaskApproval[];
  batch?: TaskBatch;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  userId: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  cost?: string;
  status: TaskStatus;
  error?: string;
  result?: any;
  startedAt: Date;
  completedAt?: Date;
  
  // Security tracking
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface TaskApproval {
  id: string;
  taskId: string;
  userId: string;
  approverType: 'user' | 'multi_sig' | 'hardware_wallet';
  approverAddress?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: Date;
  respondedAt?: Date;
}

export interface TaskBatch {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: TaskStatus;
  executionMode: 'sequential' | 'parallel';
  tasks: AutomatedTask[];
  totalCost?: string;
  estimatedGas?: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  executedAt?: Date;
  completedAt?: Date;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  taskType: TaskType;
  contractAddress: string;
  abi: any;
  functionName: string;
  parameters: TaskParameter[];
  defaultGasSettings: GasSettings;
  defaultSecuritySettings: SecuritySettings;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSchedule {
  id: string;
  taskId: string;
  userId: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  nextExecution: Date;
  endDate?: Date;
  maxExecutions?: number;
  executionCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationSettings {
  userId: string;
  isEnabled: boolean;
  defaultGasSettings: GasSettings;
  defaultSecuritySettings: SecuritySettings;
  notificationSettings: {
    emailOnSuccess: boolean;
    emailOnFailure: boolean;
    pushOnSuccess: boolean;
    pushOnFailure: boolean;
    slackWebhook?: string;
  };
  maxConcurrentTasks: number;
  allowedNetworks: string[];
  createdAt: Date;
  updatedAt: Date;
}