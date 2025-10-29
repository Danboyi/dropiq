export interface UserProfile {
  id: string
  userId: string
  username?: string
  bio?: string
  avatar?: string
  banner?: string
  location?: string
  website?: string
  twitter?: string
  discord?: string
  telegram?: string
  isPublic: boolean
  isVerified: boolean
  totalEarned: number
  successRate: number
  tasksCompleted: number
  followersCount: number
  followingCount: number
  strategiesCount: number
  achievementsCount: number
  badgesCount: number
  joinedAt: Date
  lastActiveAt: Date
}

export interface Achievement {
  id: string
  name: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: AchievementRarity
  points: number
  requirement: AchievementRequirement
  badgeColor: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  progress: number
  isUnlocked: boolean
  unlockedAt?: Date
  metadata?: any
  createdAt: Date
  updatedAt: Date
  achievement?: Achievement
}

export interface Badge {
  id: string
  name: string
  title: string
  description: string
  icon: string
  category: BadgeCategory
  type: BadgeType
  rarity: BadgeRarity
  requirements?: any
  benefits?: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  earnedAt: Date
  isDisplayed: boolean
  metadata?: any
  createdAt: Date
  updatedAt: Date
  badge?: Badge
}

export interface Strategy {
  id: string
  userId: string
  title: string
  description: string
  category: StrategyCategory
  difficulty: StrategyDifficulty
  riskLevel: StrategyRiskLevel
  estimatedTime: number
  requiredCapital?: number
  expectedReturn?: number
  successRate: number
  steps: StrategyStep[]
  tags: string[]
  isPublic: boolean
  isVerified: boolean
  verificationNotes?: string
  viewCount: number
  copyCount: number
  rating: number
  ratingCount: number
  metadata?: any
  createdAt: Date
  updatedAt: Date
  author?: UserProfile
}

export interface StrategyStep {
  id: string
  title: string
  description: string
  type: StrategyStepType
  order: number
  isRequired: boolean
  estimatedTime?: number
  metadata?: any
}

export interface StrategyShare {
  id: string
  strategyId: string
  userId: string
  shareType: StrategyShareType
  metadata?: any
  createdAt: Date
  user?: UserProfile
}

export interface StrategyComment {
  id: string
  strategyId: string
  userId: string
  content: string
  isEdited: boolean
  editedAt?: Date
  parentId?: string
  isDeleted: boolean
  deletedAt?: Date
  metadata?: any
  createdAt: Date
  updatedAt: Date
  author?: UserProfile
  replies?: StrategyComment[]
}

export interface StrategyRating {
  id: string
  strategyId: string
  userId: string
  rating: number
  review?: string
  isHelpful: boolean
  metadata?: any
  createdAt: Date
  updatedAt: Date
  user?: UserProfile
}

export interface UserFollow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
  follower?: UserProfile
  following?: UserProfile
}

export interface UserStats {
  totalEarned: number
  totalGasSpent: number
  tasksCompleted: number
  successRate: number
  averageTaskTime: number
  strategiesCreated: number
  strategiesShared: number
  followersCount: number
  followingCount: number
  achievementsUnlocked: number
  badgesEarned: number
  reputationScore: number
  activityStreak: number
  joinDate: Date
  lastActiveDate: Date
}

export interface AchievementRequirement {
  type: 'task_completion' | 'earnings' | 'success_rate' | 'streak' | 'social' | 'exploration'
  threshold: number
  timeframe?: string
  conditions?: any
}

export interface StrategyStats {
  totalViews: number
  totalCopies: number
  totalShares: number
  averageRating: number
  ratingCount: number
  commentCount: number
  successRate: number
  estimatedTime: number
  difficulty: string
  riskLevel: string
  category: string
}

// Enums
export enum AchievementCategory {
  TRADING = 'TRADING',
  SECURITY = 'SECURITY',
  COMMUNITY = 'COMMUNITY',
  EXPLORATION = 'EXPLORATION',
  SUCCESS = 'SUCCESS',
  STREAK = 'STREAK',
  SOCIAL = 'SOCIAL'
}

export enum AchievementRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum BadgeCategory {
  STRATEGY = 'STRATEGY',
  SUCCESS = 'SUCCESS',
  COMMUNITY = 'COMMUNITY',
  EXPERT = 'EXPERT',
  VERIFIED = 'VERIFIED',
  SPECIAL = 'SPECIAL'
}

export enum BadgeType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  SPECIAL = 'SPECIAL'
}

export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum StrategyCategory {
  DEFI = 'DEFI',
  GAMING = 'GAMING',
  NFT = 'NFT',
  LAYER1 = 'LAYER1',
  LAYER2 = 'LAYER2',
  SOCIAL = 'SOCIAL',
  AI = 'AI',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  CROSS_CHAIN = 'CROSS_CHAIN'
}

export enum StrategyDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum StrategyRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME'
}

export enum StrategyStepType {
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  TRANSACTION = 'TRANSACTION',
  QUIZ = 'QUIZ',
  REFERRAL = 'REFERRAL',
  VERIFICATION = 'VERIFICATION',
  CUSTOM = 'CUSTOM'
}

export enum StrategyShareType {
  COPY = 'COPY',
  FORK = 'FORK',
  SHARE_LINK = 'SHARE_LINK',
  SOCIAL_SHARE = 'SOCIAL_SHARE'
}

// API Response Types
export interface UserProfileResponse {
  profile: UserProfile
  stats: UserStats
  achievements: UserAchievement[]
  badges: UserBadge[]
  strategies: Strategy[]
  recentActivity: any[]
}

export interface AchievementProgress {
  achievement: Achievement
  userAchievement: UserAchievement
  progress: number
  nextMilestone?: number
  isCompleted: boolean
}

export interface LeaderboardEntry {
  rank: number
  user: UserProfile
  stats: UserStats
  change: number
}

export interface StrategyFeedItem {
  strategy: Strategy
  author: UserProfile
  stats: StrategyStats
  interactions: {
    views: number
    copies: number
    shares: number
    comments: number
    rating: number
  }
  timestamp: Date
}