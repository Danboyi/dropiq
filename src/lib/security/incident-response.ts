import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface SecurityIncident {
  id: string;
  incidentType: 'scam' | 'drainer' | 'phishing' | 'hack' | 'vulnerability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  title: string;
  description: string;
  projectId?: string;
  campaignId?: string;
  userId?: string;
  reporterId?: string;
  assignedTo?: string;
  blockchain?: string;
  contractAddress?: string;
  maliciousUrl?: string;
  transactionHash?: string;
  affectedUsers: number;
  estimatedLoss?: number;
  currency?: string;
  evidence: IncidentEvidence;
  timeline: IncidentTimelineEntry[];
  mitigationSteps: string[];
  preventionMeasures: string[];
  publicDisclosure: boolean;
  disclosureLevel: 'internal' | 'partial' | 'full';
  tags: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentEvidence {
  screenshots: string[];
  logs: string[];
  transactionData: any[];
  communications: string[];
  forensicData: any;
  externalReports: string[];
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  action: string;
  description: string;
  performedBy?: string;
  evidence?: string;
}

export interface IncidentAlert {
  id: string;
  alertType: 'scam_detected' | 'drainer_found' | 'phishing_site' | 'security_breach' | 'vulnerability_found';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  title: string;
  message: string;
  targetAudience: 'all_users' | 'specific_users' | 'creators' | 'administrators';
  userIds: string[];
  projectId?: string;
  campaignId?: string;
  relatedIncidentId?: string;
  actionRequired: boolean;
  actionType?: 'avoid_interaction' | 'report_scam' | 'change_password' | 'contact_support' | 'update_security';
  actionUrl?: string;
  expiresAt?: Date;
  acknowledgedBy: string[];
  dismissedBy: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecoveryGuidance {
  incidentType: string;
  severity: string;
  immediateSteps: string[];
  recoveryActions: string[];
  preventionSteps: string[];
  resources: RecoveryResource[];
  contacts: EmergencyContact[];
  timeline: RecoveryTimeline;
}

export interface RecoveryResource {
  title: string;
  type: 'guide' | 'tool' | 'service' | 'article' | 'video';
  url: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface EmergencyContact {
  type: 'security_team' | 'legal' | 'law_enforcement' | 'exchange' | 'wallet_provider';
  name: string;
  contact: string;
  priority: 'high' | 'medium' | 'low';
  available24h: boolean;
}

export interface RecoveryTimeline {
  immediate: string[]; // First 1-2 hours
  shortTerm: string[]; // First 24-48 hours
  mediumTerm: string[]; // First week
  longTerm: string[]; // Ongoing
}

export interface IncidentReport {
  id: string;
  reporterId: string;
  incidentType: string;
  severity: string;
  title: string;
  description: string;
  evidence: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class IncidentResponseSystem {
  private zai: ZAI;
  private alertChannels: Map<string, any>;
  private emergencyContacts: EmergencyContact[];
  private responsePlaybooks: Map<string, RecoveryGuidance>;

  constructor() {
    this.zai = null as any;
    this.alertChannels = new Map();
    this.emergencyContacts = [];
    this.responsePlaybooks = new Map();
    this.initializeEmergencyContacts();
    this.initializeResponsePlaybooks();
  }

  private async initializeZAI() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
  }

  private initializeEmergencyContacts() {
    this.emergencyContacts = [
      {
        type: 'security_team',
        name: 'Platform Security Team',
        contact: 'security@airdroptracker.com',
        priority: 'high',
        available24h: true
      },
      {
        type: 'legal',
        name: 'Legal Department',
        contact: 'legal@airdroptracker.com',
        priority: 'medium',
        available24h: false
      },
      {
        type: 'law_enforcement',
        name: 'Cybercrime Reporting',
        contact: 'https://www.ic3.gov/',
        priority: 'high',
        available24h: true
      },
      {
        type: 'exchange',
        name: 'Major Exchange Security',
        contact: 'security@exchange.com',
        priority: 'medium',
        available24h: true
      }
    ];
  }

  private initializeResponsePlaybooks() {
    this.responsePlaybooks.set('scam', {
      incidentType: 'scam',
      severity: 'medium',
      immediateSteps: [
        'Stop all interactions with the suspicious project',
        'Document all evidence (screenshots, URLs, transactions)',
        'Report the scam to platform moderators',
        'Warn other community members'
      ],
      recoveryActions: [
        'Review all recent transactions for unauthorized activity',
        'Change passwords if any credentials were shared',
        'Revoke any token approvals given to suspicious contracts',
        'Monitor wallet for suspicious activity'
      ],
      preventionSteps: [
        'Complete security education modules',
        'Always verify project legitimacy before interacting',
        'Use the platform\'s scam detection tools',
        'Never share private keys or seed phrases'
      ],
      resources: [
        {
          title: 'Scam Detection Guide',
          type: 'guide',
          url: '/security/scam-detection',
          description: 'Learn how to identify and avoid scams',
          priority: 'high'
        },
        {
          title: 'Report a Scam',
          type: 'tool',
          url: '/security/report',
          description: 'Report suspicious projects and activities',
          priority: 'high'
        }
      ],
      contacts: this.emergencyContacts.filter(c => c.type === 'security_team'),
      timeline: {
        immediate: ['Document evidence', 'Report incident', 'Stop interactions'],
        shortTerm: ['Review security settings', 'Monitor accounts', 'Update passwords'],
        mediumTerm: ['Complete security training', 'Review all permissions'],
        longTerm: ['Regular security audits', 'Stay updated on threats']
      }
    });

    this.responsePlaybooks.set('drainer', {
      incidentType: 'drainer',
      severity: 'critical',
      immediateSteps: [
        'IMMEDIATELY disconnect wallet from all dApps',
        'Move remaining funds to a secure wallet',
        'Document the malicious contract address',
        'Report the drainer to the platform and blockchain community'
      ],
      recoveryActions: [
        'Check all token approvals and revoke suspicious ones',
        'Monitor blockchain for any ongoing unauthorized transactions',
        'Contact wallet provider for additional security measures',
        'Consider using a new wallet address'
      ],
      preventionSteps: [
        'Never approve unlimited token spending',
        'Always verify contract addresses before interaction',
        'Use hardware wallets for significant amounts',
        'Enable transaction notifications and spending limits'
      ],
      resources: [
        {
          title: 'Drainer Protection Guide',
          type: 'guide',
          url: '/security/drainer-protection',
          description: 'How to protect against wallet drainers',
          priority: 'high'
        },
        {
          title: 'Token Approval Checker',
          type: 'tool',
          url: '/tools/approval-checker',
          description: 'Check and revoke token approvals',
          priority: 'high'
        }
      ],
      contacts: this.emergencyContacts.filter(c => c.priority === 'high'),
      timeline: {
        immediate: ['Disconnect wallet', 'Secure funds', 'Document evidence'],
        shortTerm: ['Revoke approvals', 'Monitor transactions', 'Contact support'],
        mediumTerm: ['Wallet security audit', 'Update security practices'],
        longTerm: ['Regular security monitoring', 'Advanced protection setup']
      }
    });

    this.responsePlaybooks.set('phishing', {
      incidentType: 'phishing',
      severity: 'high',
      immediateSteps: [
        'Close the phishing website immediately',
        'Do not enter any information or connect wallet',
        'Clear browser cache and cookies',
        'Scan device for malware'
      ],
      recoveryActions: [
        'Change all passwords that may have been entered',
        'Enable two-factor authentication on all accounts',
        'Monitor accounts for unauthorized access',
        'Report the phishing site to authorities'
      ],
      preventionSteps: [
        'Always verify URLs before entering information',
        'Use bookmarked links for trusted sites',
        'Enable browser anti-phishing protection',
        'Educate yourself on phishing techniques'
      ],
      resources: [
        {
          title: 'Phishing Protection Guide',
          type: 'guide',
          url: '/security/phishing-protection',
          description: 'How to identify and avoid phishing attacks',
          priority: 'high'
        },
        {
          title: 'Security Checkup Tool',
          type: 'tool',
          url: '/tools/security-checkup',
          description: 'Comprehensive security assessment',
          priority: 'medium'
        }
      ],
      contacts: this.emergencyContacts,
      timeline: {
        immediate: ['Close site', 'Clear browser data', 'Scan for malware'],
        shortTerm: ['Change passwords', 'Enable 2FA', 'Monitor accounts'],
        mediumTerm: ['Security audit', 'Update protection tools'],
        longTerm: ['Ongoing security education', 'Regular checkups']
      }
    });
  }

  async reportIncident(incidentData: {
    incidentType: 'scam' | 'drainer' | 'phishing' | 'hack' | 'vulnerability';
    title: string;
    description: string;
    reporterId: string;
    projectId?: string;
    campaignId?: string;
    userId?: string;
    blockchain?: string;
    contractAddress?: string;
    maliciousUrl?: string;
    transactionHash?: string;
    evidence?: any;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<SecurityIncident> {
    await this.initializeZAI();

    // AI-powered incident analysis
    const aiAnalysis = await this.analyzeIncident(incidentData);

    // Determine severity if not provided
    const severity = incidentData.severity || aiAnalysis.recommendedSeverity;

    // Create incident record
    const incident = await db.securityIncident.create({
      data: {
        incidentType: incidentData.incidentType,
        severity,
        status: 'open',
        title: incidentData.title,
        description: incidentData.description,
        projectId: incidentData.projectId,
        campaignId: incidentData.campaignId,
        userId: incidentData.userId,
        reporterId: incidentData.reporterId,
        blockchain: incidentData.blockchain,
        contractAddress: incidentData.contractAddress,
        maliciousUrl: incidentData.maliciousUrl,
        transactionHash: incidentData.transactionHash,
        affectedUsers: aiAnalysis.estimatedAffectedUsers || 0,
        estimatedLoss: aiAnalysis.estimatedLoss,
        currency: aiAnalysis.currency,
        evidence: incidentData.evidence || {},
        timeline: [{
          timestamp: new Date(),
          action: 'incident_reported',
          description: `Incident reported by user ${incidentData.reporterId}`,
          performedBy: incidentData.reporterId
        }],
        mitigationSteps: aiAnalysis.mitigationSteps || [],
        preventionMeasures: aiAnalysis.preventionMeasures || [],
        publicDisclosure: false,
        disclosureLevel: 'internal',
        tags: aiAnalysis.tags || [],
        metadata: {
          aiAnalysis,
          autoClassified: true
        }
      }
    });

    // Create initial timeline entry
    await this.addTimelineEntry(incident.id, {
      timestamp: new Date(),
      action: 'incident_created',
      description: 'Security incident created and logged',
      evidence: JSON.stringify(incidentData.evidence)
    });

    // Determine if immediate alerts are needed
    if (severity === 'critical' || severity === 'high') {
      await this.createSecurityAlert({
        alertType: `${incidentData.incidentType}_detected`,
        severity,
        title: `Security Alert: ${incidentData.title}`,
        message: this.generateAlertMessage(incidentData.incidentType, severity),
        targetAudience: this.determineAlertAudience(incidentData.incidentType, severity),
        relatedIncidentId: incident.id,
        actionRequired: true,
        actionType: this.getRecommendedAction(incidentData.incidentType),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }

    // Auto-assign to security team if critical
    if (severity === 'critical') {
      await this.assignIncident(incident.id, 'security-team');
    }

    return this.formatIncident(incident);
  }

  async createSecurityAlert(alertData: {
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    targetAudience: 'all_users' | 'specific_users' | 'creators' | 'administrators';
    userIds?: string[];
    projectId?: string;
    campaignId?: string;
    relatedIncidentId?: string;
    actionRequired?: boolean;
    actionType?: string;
    actionUrl?: string;
    expiresAt?: Date;
  }): Promise<IncidentAlert> {
    const alert = await db.securityAlert.create({
      data: {
        alertType: alertData.alertType,
        severity: alertData.severity,
        status: 'active',
        title: alertData.title,
        message: alertData.message,
        targetAudience: alertData.targetAudience,
        userIds: JSON.stringify(alertData.userIds || []),
        projectId: alertData.projectId,
        campaignId: alertData.campaignId,
        relatedIncidentId: alertData.relatedIncidentId,
        actionRequired: alertData.actionRequired || false,
        actionType: alertData.actionType,
        actionUrl: alertData.actionUrl,
        expiresAt: alertData.expiresAt,
        acknowledgedBy: '[]',
        dismissedBy: '[]',
        metadata: {
          createdAt: new Date(),
          source: 'incident_response_system'
        }
      }
    });

    // Send notifications through appropriate channels
    await this.sendAlertNotifications(alert);

    return this.formatAlert(alert);
  }

  async getRecoveryGuidance(incidentType: string, severity: string): Promise<RecoveryGuidance> {
    const playbook = this.responsePlaybooks.get(incidentType);
    
    if (!playbook) {
      // Generate AI-powered guidance for unknown incident types
      return await this.generateAIRecoveryGuidance(incidentType, severity);
    }

    // Adjust guidance based on severity
    const adjustedGuidance = this.adjustGuidanceForSeverity(playbook, severity);

    return adjustedGuidance;
  }

  async updateIncidentStatus(
    incidentId: string,
    status: 'open' | 'investigating' | 'resolved' | 'closed',
    updatedBy: string,
    notes?: string
  ): Promise<SecurityIncident> {
    const incident = await db.securityIncident.update({
      where: { id: incidentId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // Add timeline entry
    await this.addTimelineEntry(incidentId, {
      timestamp: new Date(),
      action: 'status_updated',
      description: `Status updated to ${status}${notes ? `: ${notes}` : ''}`,
      performedBy: updatedBy
    });

    // Create or update alerts based on status change
    if (status === 'resolved') {
      await this.createResolutionAlert(incidentId);
    }

    return this.formatIncident(incident);
  }

  async assignIncident(incidentId: string, assignedTo: string): Promise<SecurityIncident> {
    const incident = await db.securityIncident.update({
      where: { id: incidentId },
      data: {
        assignedTo,
        updatedAt: new Date()
      }
    });

    // Add timeline entry
    await this.addTimelineEntry(incidentId, {
      timestamp: new Date(),
      action: 'incident_assigned',
      description: `Incident assigned to ${assignedTo}`,
      performedBy: 'system'
    });

    // Notify assigned team/person
    await this.notifyAssignment(incidentId, assignedTo);

    return this.formatIncident(incident);
  }

  async addEvidence(incidentId: string, evidence: any, addedBy: string): Promise<void> {
    const incident = await db.securityIncident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    const updatedEvidence = {
      ...incident.evidence,
      ...evidence,
      lastUpdated: new Date(),
      updatedBy: addedBy
    };

    await db.securityIncident.update({
      where: { id: incidentId },
      data: {
        evidence: updatedEvidence,
        updatedAt: new Date()
      }
    });

    // Add timeline entry
    await this.addTimelineEntry(incidentId, {
      timestamp: new Date(),
      action: 'evidence_added',
      description: 'New evidence added to incident',
      performedBy: addedBy,
      evidence: JSON.stringify(evidence)
    });
  }

  async getIncidentMetrics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    totalIncidents: number;
    incidentsByType: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
    averageResolutionTime: number;
    openIncidents: number;
    resolvedIncidents: number;
    affectedUsers: number;
    estimatedLosses: number;
    trends: {
      daily: Array<{ date: string; count: number }>;
      byType: Record<string, Array<{ date: string; count: number }>>;
    };
  }> {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const incidents = await db.securityIncident.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    const totalIncidents = incidents.length;
    const incidentsByType = incidents.reduce((acc, incident) => {
      acc[incident.incidentType] = (acc[incident.incidentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const incidentsBySeverity = incidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;

    const affectedUsers = incidents.reduce((sum, incident) => sum + incident.affectedUsers, 0);
    const estimatedLosses = incidents.reduce((sum, incident) => sum + (incident.estimatedLoss || 0), 0);

    // Calculate average resolution time
    const resolvedIncidentsWithTime = incidents.filter(i => 
      i.status === 'resolved' || i.status === 'closed'
    );
    const averageResolutionTime = resolvedIncidentsWithTime.length > 0 
      ? resolvedIncidentsWithTime.reduce((sum, incident) => {
          const resolutionTime = incident.updatedAt.getTime() - incident.createdAt.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedIncidentsWithTime.length / (1000 * 60 * 60) // in hours
      : 0;

    // Generate trends (simplified)
    const trends = {
      daily: this.generateDailyTrends(incidents, timeframe),
      byType: this.generateTypeTrends(incidents, timeframe)
    };

    return {
      totalIncidents,
      incidentsByType,
      incidentsBySeverity,
      averageResolutionTime,
      openIncidents,
      resolvedIncidents,
      affectedUsers,
      estimatedLosses,
      trends
    };
  }

  private async analyzeIncident(incidentData: any): Promise<any> {
    try {
      const prompt = `
        Analyze this security incident report and provide recommendations:
        
        Incident Type: ${incidentData.incidentType}
        Title: ${incidentData.title}
        Description: ${incidentData.description}
        Blockchain: ${incidentData.blockchain || 'Not specified'}
        Contract Address: ${incidentData.contractAddress || 'Not provided'}
        URL: ${incidentData.maliciousUrl || 'Not provided'}
        
        Analyze and provide:
        1. Recommended severity level (low/medium/high/critical)
        2. Estimated number of affected users
        3. Potential financial impact
        4. Immediate mitigation steps
        5. Prevention measures
        6. Relevant tags for categorization
        
        Return as JSON response.
      `;

      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert incident response analyst. Provide thorough and actionable analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI incident analysis failed:', error);
      return {
        recommendedSeverity: 'medium',
        estimatedAffectedUsers: 1,
        estimatedLoss: 0,
        mitigationSteps: ['Investigate the incident thoroughly'],
        preventionMeasures: ['Implement additional security measures'],
        tags: ['security']
      };
    }
  }

  private async generateAIRecoveryGuidance(incidentType: string, severity: string): Promise<RecoveryGuidance> {
    try {
      const prompt = `
        Generate comprehensive recovery guidance for:
        
        Incident Type: ${incidentType}
        Severity: ${severity}
        
        Provide:
        1. Immediate steps to take
        2. Recovery actions
        3. Prevention measures
        4. Recommended resources
        5. Timeline for recovery (immediate, short-term, medium-term, long-term)
        
        Return as JSON response with proper structure.
      `;

      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert cybersecurity incident response specialist.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI recovery guidance failed:', error);
      return this.responsePlaybooks.get('scam')!; // Fallback to scam playbook
    }
  }

  private adjustGuidanceForSeverity(guidance: RecoveryGuidance, severity: string): RecoveryGuidance {
    const adjusted = { ...guidance };

    if (severity === 'critical') {
      // Add urgency and more comprehensive steps
      adjusted.immediateSteps.unshift('IMMEDIATE ACTION REQUIRED');
      adjusted.recoveryActions.push('Consider professional security services');
      adjusted.contacts.push(...this.emergencyContacts.filter(c => c.priority === 'high'));
    }

    return adjusted;
  }

  private generateAlertMessage(incidentType: string, severity: string): string {
    const messages = {
      scam: {
        critical: '🚨 CRITICAL: Active scam detected affecting users. Immediate action required.',
        high: '⚠️ HIGH RISK: Multiple scam reports received. Exercise extreme caution.',
        medium: '⚡ MEDIUM RISK: Scam activity detected. Be vigilant.',
        low: 'ℹ️ INFO: Potential scam activity reported.'
      },
      drainer: {
        critical: '🚨 CRITICAL: Active wallet drainer detected. DO NOT interact with any contracts.',
        high: '⚠️ HIGH RISK: Malicious contracts targeting wallets. Disconnect all dApps immediately.',
        medium: '⚡ MEDIUM RISK: Suspicious contract activity detected. Verify before interacting.',
        low: 'ℹ️ INFO: Unusual contract patterns detected.'
      },
      phishing: {
        critical: '🚨 CRITICAL: Active phishing campaign targeting our users. Do not click any suspicious links.',
        high: '⚠️ HIGH RISK: Phishing attempts reported. Verify all URLs before entering information.',
        medium: '⚡ MEDIUM RISK: Phishing activity detected. Stay alert for suspicious emails/messages.',
        low: 'ℹ️ INFO: Remember to verify website authenticity.'
      }
    };

    return messages[incidentType as keyof typeof messages]?.[severity as keyof typeof messages.scam] || 
           'Security alert: Please exercise caution and verify all interactions.';
  }

  private determineAlertAudience(incidentType: string, severity: string): 'all_users' | 'specific_users' | 'creators' | 'administrators' {
    if (severity === 'critical') return 'all_users';
    if (incidentType === 'vulnerability') return 'administrators';
    if (incidentType === 'scam' || incidentType === 'drainer') return 'all_users';
    return 'creators';
  }

  private getRecommendedAction(incidentType: string): string {
    const actions = {
      scam: 'report_scam',
      drainer: 'avoid_interaction',
      phishing: 'avoid_interaction',
      hack: 'change_password',
      vulnerability: 'contact_support'
    };

    return actions[incidentType as keyof typeof actions] || 'contact_support';
  }

  private async sendAlertNotifications(alert: any): Promise<void> {
    // This would integrate with various notification channels
    // Email, push notifications, in-app alerts, etc.
    console.log(`Sending alert: ${alert.title} to ${alert.targetAudience}`);
  }

  private async createResolutionAlert(incidentId: string): Promise<void> {
    const incident = await db.securityIncident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) return;

    await this.createSecurityAlert({
      alertType: 'incident_resolved',
      severity: 'low',
      title: 'Security Incident Resolved',
      message: `The security incident "${incident.title}" has been resolved. Normal activity may resume.`,
      targetAudience: 'all_users',
      relatedIncidentId: incidentId,
      actionRequired: false
    });
  }

  private async notifyAssignment(incidentId: string, assignedTo: string): Promise<void> {
    // Notify the assigned team/person about the new assignment
    console.log(`Incident ${incidentId} assigned to ${assignedTo}`);
  }

  private async addTimelineEntry(incidentId: string, entry: any): Promise<void> {
    const incident = await db.securityIncident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) return;

    const currentTimeline = Array.isArray(incident.timeline) ? incident.timeline : [];
    currentTimeline.push(entry);

    await db.securityIncident.update({
      where: { id: incidentId },
      data: {
        timeline: currentTimeline,
        updatedAt: new Date()
      }
    });
  }

  private generateDailyTrends(incidents: any[], timeframe: string): Array<{ date: string; count: number }> {
    // Simplified trend generation
    const trends: Array<{ date: string; count: number }> = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = incidents.filter(incident => 
        incident.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      trends.push({ date: dateStr, count });
    }
    
    return trends;
  }

  private generateTypeTrends(incidents: any[], timeframe: string): Record<string, Array<{ date: string; count: number }>> {
    const types = [...new Set(incidents.map(i => i.incidentType))];
    const trends: Record<string, Array<{ date: string; count: number }>> = {};
    
    types.forEach(type => {
      const typeIncidents = incidents.filter(i => i.incidentType === type);
      trends[type] = this.generateDailyTrends(typeIncidents, timeframe);
    });
    
    return trends;
  }

  private formatIncident(incident: any): SecurityIncident {
    return {
      ...incident,
      tags: JSON.parse(incident.tags || '[]'),
      timeline: Array.isArray(incident.timeline) ? incident.timeline : [],
      mitigationSteps: Array.isArray(incident.mitigationSteps) ? incident.mitigationSteps : [],
      preventionMeasures: Array.isArray(incident.preventionMeasures) ? incident.preventionMeasures : []
    };
  }

  private formatAlert(alert: any): IncidentAlert {
    return {
      ...alert,
      userIds: JSON.parse(alert.userIds || '[]'),
      acknowledgedBy: JSON.parse(alert.acknowledgedBy || '[]'),
      dismissedBy: JSON.parse(alert.dismissedBy || '[]')
    };
  }
}

export const incidentResponseSystem = new IncidentResponseSystem();