export enum AirdropCategory {
  DEFI = 'DEFI',
  GAMING = 'GAMING',
  NFT = 'NFT',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  SOCIAL = 'SOCIAL',
  AI = 'AI',
  LAYER1 = 'LAYER1',
  LAYER2 = 'LAYER2',
  EXCHANGE = 'EXCHANGE',
  OTHER = 'OTHER'
}

export enum AirdropDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum AirdropRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME'
}

export enum AirdropStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED'
}

export interface Airdrop {
  id: string
  name: string
  description: string
  category: AirdropCategory
  difficulty: AirdropDifficulty
  riskLevel: AirdropRiskLevel
  status: AirdropStatus
  potentialReward: number
  trendingScore?: number
  hasTestnet?: boolean
  requirements?: string[]
  tags?: string[]
  minHoldings?: number
  regions?: string[]
  website?: string
  twitter?: string
  discord?: string
  telegram?: string
  createdAt: Date
  updatedAt: Date
  endsAt?: Date
}

export interface AirdropDiscoveryFilters {
  categories?: AirdropCategory[]
  riskLevels?: AirdropRiskLevel[]
  difficulties?: AirdropDifficulty[]
  minTrendingScore?: number
  hasTestnet?: boolean
  minPotentialReward?: number
  limit?: number
}

export interface AIInsight {
  summary: string
  riskFactors: string[]
  benefits: string[]
  recommendations: string[]
  confidenceScore: number
  lastAnalyzed: Date
}

export interface AirdropWithScore extends Airdrop {
  recommendationScore: number
  aiInsight: AIInsight
  recommendationReason: string
}

export interface RiskBehaviorMetrics {
  totalAirdrops: number
  riskDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
  averagePotentialReward: number
  lastUpdated: Date
}

export interface EligibilityCriteria {
  requirements: string[]
  difficulty: AirdropDifficulty
  hasTestnet: boolean
  minHoldings: number
  restrictedRegions: string[]
  estimatedTime: TimeEstimate
}

export interface TimeEstimate {
  minMinutes: number
  maxMinutes: number
  complexity: AirdropDifficulty
}