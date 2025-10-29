export interface User {
  id: string
  email: string
  name?: string
  riskTolerance?: string
  preferences?: any
  createdAt: Date
}

export interface UserBehavior {
  id: string
  userId: string
  action: 'click' | 'view' | 'hover' | 'scroll' | 'search' | 'filter' | 'navigate'
  element: string
  section: string
  duration?: number
  metadata?: {
    device?: string
    feature?: string
    airdropType?: string
    riskLevel?: string
    [key: string]: any
  }
  timestamp: Date
}

export interface UIPreference {
  id: string
  userId: string
  config: any
  lastUpdated: Date
  adaptationHistory: any[]
}

export interface AdaptiveUIComponent {
  userId: string
  adaptations: any
  onBehaviorTrack: (behavior: Omit<UserBehavior, 'id' | 'timestamp'>) => void
  getUIConfig: () => Promise<any>
}