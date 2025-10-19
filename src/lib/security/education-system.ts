import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface SecurityEducationContent {
  id: string;
  title: string;
  slug: string;
  contentType: 'article' | 'video' | 'tutorial' | 'quiz' | 'guide';
  category: 'basics' | 'scam_protection' | 'drainer_protection' | 'phishing_protection' | 'best_practices';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  summary?: string;
  thumbnail?: string;
  videoUrl?: string;
  readingTime?: number;
  quizQuestions?: QuizQuestion[];
  keyPoints?: string[];
  relatedResources?: RelatedResource[];
  tags: string[];
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'scenario' | 'practical';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  points: number;
}

export interface RelatedResource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'tool' | 'guide' | 'external';
  description?: string;
}

export interface UserSecurityProgress {
  userId: string;
  securityScore: number; // 0-100
  completedModules: string[];
  quizScores: Record<string, number>;
  achievements: string[];
  lastActivityAt?: Date;
  streakDays: number;
  totalStudyTime: number; // minutes
  securityLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  riskProfile: 'conservative' | 'normal' | 'aggressive';
  recommendations: string[];
  metadata: any;
}

export interface SecurityAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  modules: string[]; // Content IDs
  prerequisites: string[];
  outcomes: string[];
  isRecommended: boolean;
  popularity: number;
}

export class SecurityEducationSystem {
  private zai: ZAI;
  private achievements: Map<string, SecurityAchievement>;
  private learningPaths: Map<string, LearningPath>;

  constructor() {
    this.zai = null as any;
    this.achievements = new Map();
    this.learningPaths = new Map();
    this.initializeAchievements();
    this.initializeLearningPaths();
  }

  private async initializeZAI() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
  }

  private initializeAchievements() {
    const achievements: SecurityAchievement[] = [
      {
        id: 'security_novice',
        name: 'Security Novice',
        description: 'Complete your first security module',
        icon: '🛡️',
        category: 'basics',
        requirement: 'Complete 1 security module',
        points: 10,
        rarity: 'common'
      },
      {
        id: 'scam_detector',
        name: 'Scam Detector',
        description: 'Identify and report 5 potential scams',
        icon: '🔍',
        category: 'scam_protection',
        requirement: 'Report 5 scams',
        points: 50,
        rarity: 'rare'
      },
      {
        id: 'phishing_phighter',
        name: 'Phishing Phighter',
        description: 'Complete all phishing protection modules',
        icon: '🎣',
        category: 'phishing_protection',
        requirement: 'Complete all phishing modules',
        points: 75,
        rarity: 'epic'
      },
      {
        id: 'drainer_defender',
        name: 'Drainer Defender',
        description: 'Successfully identify 3 drainer contracts',
        icon: '🚫',
        category: 'drainer_protection',
        requirement: 'Identify 3 drainers',
        points: 100,
        rarity: 'epic'
      },
      {
        id: 'security_expert',
        name: 'Security Expert',
        description: 'Achieve 90+ security score',
        icon: '🏆',
        category: 'basics',
        requirement: 'Reach 90+ security score',
        points: 200,
        rarity: 'legendary'
      },
      {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Score 100% on 10 different quizzes',
        icon: '🧠',
        category: 'education',
        requirement: 'Perfect score on 10 quizzes',
        points: 150,
        rarity: 'epic'
      },
      {
        id: 'consistent_learner',
        name: 'Consistent Learner',
        description: 'Maintain a 30-day learning streak',
        icon: '📅',
        category: 'education',
        requirement: '30-day streak',
        points: 100,
        rarity: 'rare'
      },
      {
        id: 'community_guardian',
        name: 'Community Guardian',
        description: 'Help 10 other users with security issues',
        icon: '🤝',
        category: 'community',
        requirement: 'Help 10 users',
        points: 125,
        rarity: 'epic'
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private initializeLearningPaths() {
    const paths: LearningPath[] = [
      {
        id: 'beginner_security',
        name: 'Security Fundamentals',
        description: 'Learn the basics of cryptocurrency security',
        category: 'basics',
        difficulty: 'beginner',
        estimatedTime: 120, // 2 hours
        modules: ['crypto_basics', 'wallet_security', 'password_hygiene'],
        prerequisites: [],
        outcomes: [
          'Understand basic security concepts',
          'Secure your wallet properly',
          'Create strong passwords',
          'Recognize common threats'
        ],
        isRecommended: true,
        popularity: 95
      },
      {
        id: 'scam_detection_path',
        name: 'Scam Detection Master',
        description: 'Master the art of identifying and avoiding scams',
        category: 'scam_protection',
        difficulty: 'intermediate',
        estimatedTime: 180, // 3 hours
        modules: ['scam_types', 'red_flags', 'verification_techniques', 'reporting_scams'],
        prerequisites: ['beginner_security'],
        outcomes: [
          'Identify different scam types',
          'Spot red flags quickly',
          'Verify project legitimacy',
          'Report scams effectively'
        ],
        isRecommended: true,
        popularity: 88
      },
      {
        id: 'advanced_protection',
        name: 'Advanced Threat Protection',
        description: 'Advanced techniques for protecting against sophisticated attacks',
        category: 'best_practices',
        difficulty: 'advanced',
        estimatedTime: 240, // 4 hours
        modules: ['drainer_protection', 'phishing_defense', 'social_engineering', 'incident_response'],
        prerequisites: ['scam_detection_path'],
        outcomes: [
          'Understand drainer mechanisms',
          'Defend against phishing attacks',
          'Recognize social engineering',
          'Handle security incidents'
        ],
        isRecommended: false,
        popularity: 72
      }
    ];

    paths.forEach(path => {
      this.learningPaths.set(path.id, path);
    });
  }

  async getEducationContent(filters?: {
    category?: string;
    difficulty?: string;
    contentType?: string;
    tags?: string[];
    featured?: boolean;
  }): Promise<SecurityEducationContent[]> {
    const where: any = { isPublished: true };

    if (filters?.category) where.category = filters.category;
    if (filters?.difficulty) where.difficulty = filters.difficulty;
    if (filters?.contentType) where.contentType = filters.contentType;
    if (filters?.featured) where.isFeatured = filters.featured;

    const content = await db.securityEducation.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return content.map(item => ({
      ...item,
      tags: JSON.parse(item.tags || '[]'),
      quizQuestions: item.quizQuestions ? JSON.parse(item.quizQuestions) : undefined,
      keyPoints: item.keyPoints ? JSON.parse(item.keyPoints) : undefined,
      relatedResources: item.relatedResources ? JSON.parse(item.relatedResources) : undefined
    }));
  }

  async getContentBySlug(slug: string): Promise<SecurityEducationContent | null> {
    const content = await db.securityEducation.findUnique({
      where: { slug }
    });

    if (!content) return null;

    return {
      ...content,
      tags: JSON.parse(content.tags || '[]'),
      quizQuestions: content.quizQuestions ? JSON.parse(content.quizQuestions) : undefined,
      keyPoints: content.keyPoints ? JSON.parse(content.keyPoints) : undefined,
      relatedResources: content.relatedResources ? JSON.parse(content.relatedResources) : undefined
    };
  }

  async generatePersonalizedContent(userId: string): Promise<{
    recommended: SecurityEducationContent[];
    nextSteps: SecurityEducationContent[];
    trending: SecurityEducationContent[];
  }> {
    const userProgress = await this.getUserProgress(userId);
    
    // Get user's current level and interests
    const currentLevel = userProgress.securityLevel;
    const completedModules = userProgress.completedModules;
    const recommendations = userProgress.recommendations;

    // Get recommended content based on user level
    const recommended = await this.getEducationContent({
      difficulty: currentLevel === 'beginner' ? 'beginner' : 
                 currentLevel === 'intermediate' ? 'intermediate' : 'advanced',
      featured: true
    });

    // Filter out completed modules
    const nextSteps = recommended.filter(content => 
      !completedModules.includes(content.id)
    ).slice(0, 5);

    // Get trending content
    const trending = await db.securityEducation.findMany({
      where: { isPublished: true },
      orderBy: { viewCount: 'desc' },
      take: 10
    });

    return {
      recommended: recommended.slice(0, 5),
      nextSteps,
      trending: trending.map(item => ({
        ...item,
        tags: JSON.parse(item.tags || '[]')
      }))
    };
  }

  async completeModule(userId: string, contentId: string, quizScore?: number): Promise<{
    success: boolean;
    newSecurityScore: number;
    achievementsUnlocked: SecurityAchievement[];
    nextRecommendations: string[];
  }> {
    // Get user progress
    let userProgress = await this.getUserProgress(userId);
    
    // Mark module as completed
    if (!userProgress.completedModules.includes(contentId)) {
      userProgress.completedModules.push(contentId);
    }

    // Update quiz score if provided
    if (quizScore !== undefined) {
      userProgress.quizScores[contentId] = quizScore;
    }

    // Calculate new security score
    const newSecurityScore = this.calculateSecurityScore(userProgress);
    userProgress.securityScore = newSecurityScore;

    // Update security level
    userProgress.securityLevel = this.determineSecurityLevel(newSecurityScore);

    // Update streak and study time
    const now = new Date();
    const lastActivity = userProgress.lastActivityAt;
    
    if (lastActivity) {
      const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        userProgress.streakDays += 1;
      } else if (daysDiff > 1) {
        userProgress.streakDays = 1;
      }
    } else {
      userProgress.streakDays = 1;
    }
    
    userProgress.lastActivityAt = now;
    userProgress.totalStudyTime += 15; // Assume 15 minutes per module

    // Check for achievements
    const achievementsUnlocked = this.checkAchievements(userProgress);

    // Generate new recommendations
    const nextRecommendations = await this.generateRecommendations(userProgress);
    userProgress.recommendations = nextRecommendations;

    // Save updated progress
    await this.saveUserProgress(userId, userProgress);

    // Update content view count
    await db.securityEducation.update({
      where: { id: contentId },
      data: { viewCount: { increment: 1 } }
    });

    return {
      success: true,
      newSecurityScore,
      achievementsUnlocked,
      nextRecommendations
    };
  }

  async submitQuiz(userId: string, contentId: string, answers: Record<string, any>): Promise<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    feedback: QuizFeedback[];
    passed: boolean;
    recommendations: string[];
  }> {
    const content = await this.getContentBySlug(contentId);
    if (!content || !content.quizQuestions) {
      throw new Error('Content not found or no quiz available');
    }

    const questions = content.quizQuestions;
    let correctAnswers = 0;
    const feedback: QuizFeedback[] = [];

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const isCorrect = this.checkAnswer(question, userAnswer);
      
      if (isCorrect) {
        correctAnswers++;
      }

      feedback.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0
      });
    }

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70; // 70% passing threshold

    // Update user progress
    await this.completeModule(userId, contentId, score);

    // Generate recommendations based on performance
    const recommendations = this.generateQuizRecommendations(score, content.category);

    return {
      score,
      totalQuestions: questions.length,
      correctAnswers,
      feedback,
      passed,
      recommendations
    };
  }

  async generateSecurityReport(userId: string): Promise<{
    overallScore: number;
    securityLevel: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    achievements: SecurityAchievement[];
    learningProgress: Record<string, number>;
    riskAssessment: {
      currentRisk: 'low' | 'medium' | 'high';
      riskFactors: string[];
      mitigationSteps: string[];
    };
  }> {
    const userProgress = await this.getUserProgress(userId);
    const achievements = await this.getUserAchievements(userId);

    // Analyze strengths and weaknesses
    const categoryScores = await this.calculateCategoryScores(userId);
    const strengths = Object.entries(categoryScores)
      .filter(([_, score]) => score >= 80)
      .map(([category, _]) => this.formatCategoryName(category));

    const weaknesses = Object.entries(categoryScores)
      .filter(([_, score]) => score < 60)
      .map(([category, _]) => this.formatCategoryName(category));

    // Generate recommendations
    const recommendations = await this.generateRecommendations(userProgress);

    // Risk assessment
    const riskAssessment = this.assessUserRisk(userProgress, categoryScores);

    return {
      overallScore: userProgress.securityScore,
      securityLevel: userProgress.securityLevel,
      strengths,
      weaknesses,
      recommendations,
      achievements,
      learningProgress: categoryScores,
      riskAssessment
    };
  }

  async createInteractiveScenario(scenarioType: string): Promise<{
    scenario: SecurityScenario;
    choices: ScenarioChoice[];
    feedback: Record<string, ScenarioFeedback>;
  }> {
    await this.initializeZAI();

    const scenarios = {
      phishing_email: {
        title: 'Suspicious Email',
        description: 'You receive an email claiming your wallet will be suspended',
        context: 'Email from "security@metamask.io" asking you to verify your wallet',
        difficulty: 'intermediate'
      },
      fake_airdrop: {
        title: 'Too Good to Be True',
        description: 'A new project offers massive airdrop rewards',
        context: 'Twitter post about "1000 ETH airdrop" for new token',
        difficulty: 'beginner'
      },
      drainer_contract: {
        title: 'Contract Interaction',
        description: 'You\'re asked to interact with a smart contract for token claims',
        context: 'Pop-up asking for unlimited token approval',
        difficulty: 'advanced'
      }
    };

    const baseScenario = scenarios[scenarioType as keyof typeof scenarios];
    if (!baseScenario) {
      throw new Error('Invalid scenario type');
    }

    // Generate AI-powered scenario content
    const prompt = `
      Create an interactive security scenario for ${scenarioType}.
      
      Base scenario: ${JSON.stringify(baseScenario)}
      
      Generate:
      1. A detailed scenario description
      2. 4-5 realistic choices the user can make
      3. Feedback for each choice explaining why it's good/bad
      4. Educational outcomes
      
      Return as JSON with scenario, choices, and feedback fields.
    `;

    try {
      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert cybersecurity educator creating interactive learning scenarios.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const aiContent = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        scenario: {
          ...baseScenario,
          ...aiContent.scenario,
          id: scenarioType,
          type: scenarioType
        },
        choices: aiContent.choices || [],
        feedback: aiContent.feedback || {}
      };
    } catch (error) {
      console.error('Failed to generate scenario:', error);
      throw new Error('Failed to generate interactive scenario');
    }
  }

  private async getUserProgress(userId: string): Promise<UserSecurityProgress> {
    let progress = await db.userSecurityProgress.findUnique({
      where: { userId }
    });

    if (!progress) {
      progress = await db.userSecurityProgress.create({
        data: {
          userId,
          securityScore: 0,
          completedModules: '[]',
          quizScores: '{}',
          achievements: '[]',
          streakDays: 0,
          totalStudyTime: 0,
          securityLevel: 'beginner',
          riskProfile: 'normal',
          recommendations: '[]'
        }
      });
    }

    return {
      ...progress,
      completedModules: JSON.parse(progress.completedModules || '[]'),
      quizScores: JSON.parse(progress.quizScores || '{}'),
      achievements: JSON.parse(progress.achievements || '[]'),
      recommendations: JSON.parse(progress.recommendations || '[]')
    };
  }

  private async saveUserProgress(userId: string, progress: UserSecurityProgress): Promise<void> {
    await db.userSecurityProgress.upsert({
      where: { userId },
      update: {
        securityScore: progress.securityScore,
        completedModules: JSON.stringify(progress.completedModules),
        quizScores: JSON.stringify(progress.quizScores),
        achievements: JSON.stringify(progress.achievements),
        lastActivityAt: progress.lastActivityAt,
        streakDays: progress.streakDays,
        totalStudyTime: progress.totalStudyTime,
        securityLevel: progress.securityLevel,
        riskProfile: progress.riskProfile,
        recommendations: JSON.stringify(progress.recommendations)
      },
      create: {
        userId,
        securityScore: progress.securityScore,
        completedModules: JSON.stringify(progress.completedModules),
        quizScores: JSON.stringify(progress.quizScores),
        achievements: JSON.stringify(progress.achievements),
        lastActivityAt: progress.lastActivityAt,
        streakDays: progress.streakDays,
        totalStudyTime: progress.totalStudyTime,
        securityLevel: progress.securityLevel,
        riskProfile: progress.riskProfile,
        recommendations: JSON.stringify(progress.recommendations)
      }
    });
  }

  private calculateSecurityScore(progress: UserSecurityProgress): number {
    let score = 0;

    // Base score from completed modules
    score += progress.completedModules.length * 5;

    // Bonus for quiz scores
    const quizScores = Object.values(progress.quizScores);
    if (quizScores.length > 0) {
      const averageQuizScore = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;
      score += (averageQuizScore / 100) * 30;
    }

    // Streak bonus
    score += Math.min(progress.streakDays, 30) * 0.5;

    // Study time bonus
    score += Math.min(progress.totalStudyTime / 60, 10) * 2; // Max 20 points for 10 hours

    // Achievement bonus
    score += progress.achievements.length * 3;

    return Math.min(100, Math.round(score));
  }

  private determineSecurityLevel(score: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (score >= 90) return 'expert';
    if (score >= 70) return 'advanced';
    if (score >= 40) return 'intermediate';
    return 'beginner';
  }

  private checkAchievements(progress: UserSecurityProgress): SecurityAchievement[] {
    const unlocked: SecurityAchievement[] = [];

    for (const [id, achievement] of this.achievements) {
      if (progress.achievements.includes(id)) continue;

      let shouldUnlock = false;

      switch (id) {
        case 'security_novice':
          shouldUnlock = progress.completedModules.length >= 1;
          break;
        case 'scam_detector':
          // This would be tracked separately
          break;
        case 'phishing_phighter':
          shouldUnlock = progress.completedModules.filter(m => 
            m.includes('phishing')
          ).length >= 3;
          break;
        case 'drainer_defender':
          // This would be tracked separately
          break;
        case 'security_expert':
          shouldUnlock = progress.securityScore >= 90;
          break;
        case 'quiz_master':
          const perfectScores = Object.values(progress.quizScores).filter(score => score === 100).length;
          shouldUnlock = perfectScores >= 10;
          break;
        case 'consistent_learner':
          shouldUnlock = progress.streakDays >= 30;
          break;
        case 'community_guardian':
          // This would be tracked separately
          break;
      }

      if (shouldUnlock) {
        unlocked.push(achievement);
        progress.achievements.push(id);
      }
    }

    return unlocked;
  }

  private async generateRecommendations(progress: UserSecurityProgress): Promise<string[]> {
    const recommendations: string[] = [];

    // Based on security level
    if (progress.securityLevel === 'beginner') {
      recommendations.push('Start with "Security Fundamentals" learning path');
      recommendations.push('Complete basic wallet security modules');
    } else if (progress.securityLevel === 'intermediate') {
      recommendations.push('Explore "Scam Detection Master" path');
      recommendations.push('Practice with interactive scenarios');
    } else if (progress.securityLevel === 'advanced') {
      recommendations.push('Try "Advanced Threat Protection" modules');
      recommendations.push('Help educate others in the community');
    }

    // Based on weaknesses
    const categoryScores = await this.calculateCategoryScores(progress.userId);
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score < 60) {
        recommendations.push(`Focus on ${this.formatCategoryName(category)} modules`);
      }
    }

    // Based on streak
    if (progress.streakDays === 0) {
      recommendations.push('Start your learning streak today!');
    } else if (progress.streakDays >= 7) {
      recommendations.push('Great streak! Keep it going!');
    }

    return recommendations;
  }

  private async calculateCategoryScores(userId: string): Promise<Record<string, number>> {
    // This would analyze user performance across different categories
    // For now, return mock data
    return {
      basics: 75,
      scam_protection: 60,
      drainer_protection: 45,
      phishing_protection: 80,
      best_practices: 70
    };
  }

  private formatCategoryName(category: string): string {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private checkAnswer(question: QuizQuestion, userAnswer: any): boolean {
    if (question.type === 'multiple_choice') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'true_false') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'scenario') {
      return userAnswer === question.correctAnswer;
    }
    return false;
  }

  private generateQuizRecommendations(score: number, category: string): string[] {
    const recommendations: string[] = [];

    if (score < 70) {
      recommendations.push('Review the module content and try again');
      recommendations.push(`Focus on ${category} fundamentals`);
    } else if (score < 90) {
      recommendations.push('Good job! Review the explanations for missed questions');
      recommendations.push('Try related modules to strengthen your knowledge');
    } else {
      recommendations.push('Excellent! You\'ve mastered this topic');
      recommendations.push('Share your knowledge with the community');
    }

    return recommendations;
  }

  private async getUserAchievements(userId: string): Promise<SecurityAchievement[]> {
    const progress = await this.getUserProgress(userId);
    return progress.achievements.map(id => this.achievements.get(id)!).filter(Boolean);
  }

  private assessUserRisk(progress: UserSecurityProgress, categoryScores: Record<string, number>): {
    currentRisk: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigationSteps: string[];
  } {
    const riskFactors: string[] = [];
    const mitigationSteps: string[] = [];

    // Assess based on security score
    if (progress.securityScore < 40) {
      riskFactors.push('Low overall security knowledge');
      mitigationSteps.push('Complete beginner security modules');
    }

    // Assess based on category scores
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score < 50) {
        riskFactors.push(`Weak in ${this.formatCategoryName(category)}`);
        mitigationSteps.push(`Study ${this.formatCategoryName(category)} modules`);
      }
    }

    // Assess based on recent activity
    if (!progress.lastActivityAt || 
        (Date.now() - progress.lastActivityAt.getTime()) > 30 * 24 * 60 * 60 * 1000) {
      riskFactors.push('No recent security training');
      mitigationSteps.push('Refresh your security knowledge');
    }

    // Determine overall risk level
    const currentRisk = riskFactors.length >= 3 ? 'high' : 
                       riskFactors.length >= 1 ? 'medium' : 'low';

    return {
      currentRisk,
      riskFactors,
      mitigationSteps
    };
  }
}

// Additional interfaces for interactive scenarios
export interface SecurityScenario {
  id: string;
  type: string;
  title: string;
  description: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ScenarioChoice {
  id: string;
  text: string;
  consequence: string;
  isCorrect: boolean;
  explanation: string;
}

export interface ScenarioFeedback {
  outcome: string;
  explanation: string;
  educationalPoints: string[];
  resources: string[];
}

export interface QuizFeedback {
  questionId: string;
  question: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  explanation: string;
  points: number;
}

export const securityEducationSystem = new SecurityEducationSystem();