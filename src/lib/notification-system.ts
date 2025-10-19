import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface NotificationMessage {
  id: string;
  type: 'email' | 'push' | 'in_app' | 'discord' | 'telegram';
  recipient: string;
  recipientType: 'user_id' | 'wallet_address' | 'email';
  subject?: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  templateId?: string;
  variables?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata: any;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'in_app' | 'discord' | 'telegram';
  category: string;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  language: string;
  version: number;
  metadata: any;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  response?: any;
  trackingId?: string;
  errorMessage?: string;
  metadata: any;
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  averageDeliveryTime: number;
  openRate: number;
  clickRate: number;
}

export class NotificationService {
  private zai: ZAI;
  private queue: NotificationMessage[] = [];
  private processing = false;
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.zai = new ZAI();
  }

  async initialize(): Promise<void> {
    try {
      // Load default templates
      await this.loadDefaultTemplates();
      
      // Start processing queue
      this.startQueueProcessor();
      
      logger.info('Notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize notification service:', error);
    }
  }

  async sendNotification(notification: Omit<NotificationMessage, 'id'>): Promise<string> {
    try {
      const fullNotification: NotificationMessage = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Process template if specified
      if (notification.templateId) {
        await this.processTemplate(fullNotification);
      }

      // Add to queue
      this.queue.push(fullNotification);

      logger.info(`Notification queued: ${fullNotification.id} (${fullNotification.type})`);
      return fullNotification.id;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  async sendBulkNotifications(notifications: Omit<NotificationMessage, 'id'>[]): Promise<string[]> {
    try {
      const ids: string[] = [];
      
      for (const notification of notifications) {
        const id = await this.sendNotification(notification);
        ids.push(id);
      }

      logger.info(`Bulk notifications queued: ${ids.length}`);
      return ids;
    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  async sendEmailNotification(
    recipient: string,
    subject: string,
    content: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    return await this.sendNotification({
      type: 'email',
      recipient,
      recipientType: 'email',
      subject,
      content,
      priority,
      category: 'info',
      data
    });
  }

  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    return await this.sendNotification({
      type: 'push',
      recipient: userId,
      recipientType: 'user_id',
      subject: title,
      content: message,
      priority,
      category: 'info',
      data
    });
  }

  async sendInAppNotification(
    userId: string,
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    return await this.sendNotification({
      type: 'in_app',
      recipient: userId,
      recipientType: 'user_id',
      subject: title,
      content: message,
      priority,
      category: 'info',
      data
    });
  }

  async sendAirdropNotification(
    airdropId: string,
    type: 'new' | 'ending' | 'claimed' | 'eligible' | 'reminder',
    recipients: string[],
    data?: any
  ): Promise<string[]> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          project: true
        }
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      const templateName = `airdrop_${type}`;
      const notifications: Omit<NotificationMessage, 'id'>[] = [];

      for (const recipient of recipients) {
        notifications.push({
          type: 'email',
          recipient,
          recipientType: 'email',
          templateId: templateName,
          priority: type === 'ending' ? 'high' : 'normal',
          category: type === 'claimed' ? 'success' : 'info',
          data: {
            airdropId,
            airdropTitle: airdrop.title,
            projectName: airdrop.project.name,
            ...data
          },
          variables: {
            airdropTitle: airdrop.title,
            projectName: airdrop.project.name,
            claimDeadline: airdrop.claimDeadline,
            totalAmount: airdrop.totalAmount,
            tokenSymbol: airdrop.tokenSymbol
          }
        });
      }

      return await this.sendBulkNotifications(notifications);
    } catch (error) {
      logger.error(`Failed to send airdrop notification for ${airdropId}:`, error);
      throw error;
    }
  }

  async sendEligibilityNotification(
    walletAddress: string,
    airdropId: string,
    eligibilityStatus: 'eligible' | 'not_eligible' | 'became_eligible' | 'lost_eligibility',
    data?: any
  ): Promise<string> {
    try {
      const user = await this.findUserByWallet(walletAddress);
      if (!user) {
        throw new Error('User not found');
      }

      const templateName = `eligibility_${eligibilityStatus}`;
      
      return await this.sendNotification({
        type: 'email',
        recipient: user.email || walletAddress,
        recipientType: user.email ? 'email' : 'wallet_address',
        templateId: templateName,
        priority: eligibilityStatus === 'became_eligible' ? 'high' : 'normal',
        category: eligibilityStatus === 'eligible' ? 'success' : 'info',
        data: {
          walletAddress,
          airdropId,
          eligibilityStatus,
          ...data
        }
      });
    } catch (error) {
      logger.error(`Failed to send eligibility notification for ${walletAddress}:`, error);
      throw error;
    }
  }

  async sendClaimReminder(
    walletAddress: string,
    airdropId: string,
    reminderType: 'claim_start' | 'claim_ending' | 'last_day',
    data?: any
  ): Promise<string> {
    try {
      const user = await this.findUserByWallet(walletAddress);
      if (!user) {
        throw new Error('User not found');
      }

      const templateName = `claim_${reminderType}`;
      
      return await this.sendNotification({
        type: 'email',
        recipient: user.email || walletAddress,
        recipientType: user.email ? 'email' : 'wallet_address',
        templateId: templateName,
        priority: reminderType === 'last_day' ? 'urgent' : 'high',
        category: 'warning',
        data: {
          walletAddress,
          airdropId,
          reminderType,
          ...data
        }
      });
    } catch (error) {
      logger.error(`Failed to send claim reminder for ${walletAddress}:`, error);
      throw error;
    }
  }

  async sendSecurityAlert(
    userId: string,
    alertType: 'scam_detected' | 'high_risk' | 'security_concern',
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    data?: any
  ): Promise<string> {
    try {
      return await this.sendNotification({
        type: 'push',
        recipient: userId,
        recipientType: 'user_id',
        subject: `Security Alert: ${alertType}`,
        content: message,
        priority: severity === 'critical' ? 'urgent' : 'high',
        category: 'error',
        data: {
          alertType,
          severity,
          ...data
        }
      });
    } catch (error) {
      logger.error(`Failed to send security alert for user ${userId}:`, error);
      throw error;
    }
  }

  private async processTemplate(notification: NotificationMessage): Promise<void> {
    try {
      const template = this.templates.get(notification.templateId!);
      if (!template) {
        logger.warn(`Template not found: ${notification.templateId}`);
        return;
      }

      // Process subject
      if (template.subject && notification.variables) {
        notification.subject = this.replaceTemplateVariables(template.subject, notification.variables);
      } else if (template.subject) {
        notification.subject = template.subject;
      }

      // Process content
      if (notification.variables) {
        notification.content = this.replaceTemplateVariables(template.content, notification.variables);
      } else {
        notification.content = template.content;
      }

      // Set category if not specified
      if (!notification.category) {
        notification.category = template.category as any;
      }
    } catch (error) {
      logger.error('Failed to process template:', error);
    }
  }

  private replaceTemplateVariables(content: string, variables: Record<string, any>): string {
    let processedContent = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return processedContent;
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batchSize = Math.min(10, this.queue.length); // Process up to 10 at a time
    const batch = this.queue.splice(0, batchSize);

    try {
      for (const notification of batch) {
        await this.deliverNotification(notification);
      }

      logger.info(`Processed notification batch: ${batch.length} notifications`);
    } catch (error) {
      logger.error('Failed to process notification batch:', error);
      // Re-add failed notifications to queue
      this.queue.unshift(...batch);
    } finally {
      this.processing = false;
    }
  }

  private async deliverNotification(notification: NotificationMessage): Promise<void> {
    try {
      // Store notification record
      const storedNotification = await db.userNotification.create({
        data: {
          userId: notification.recipientType === 'user_id' ? notification.recipient : undefined,
          type: notification.type,
          title: notification.subject || 'Notification',
          message: notification.content,
          data: notification.data,
          priority: notification.priority,
          category: notification.category,
          actionUrl: notification.data?.actionUrl,
          actionText: notification.data?.actionText,
          expiresAt: notification.expiresAt
        }
      });

      // Create delivery record
      const delivery = await db.notificationDelivery.create({
        data: {
          notificationId: storedNotification.id,
          channel: notification.type,
          status: 'pending'
        }
      });

      // Deliver based on type
      let deliveryStatus: 'sent' | 'delivered' | 'failed' = 'sent';
      let errorMessage: string | undefined;

      switch (notification.type) {
        case 'email':
          deliveryStatus = await this.deliverEmail(notification, delivery.id);
          break;
        case 'push':
          deliveryStatus = await this.deliverPush(notification, delivery.id);
          break;
        case 'in_app':
          deliveryStatus = await this.deliverInApp(notification, delivery.id);
          break;
        case 'discord':
          deliveryStatus = await this.deliverDiscord(notification, delivery.id);
          break;
        case 'telegram':
          deliveryStatus = await this.deliverTelegram(notification, delivery.id);
          break;
        default:
          deliveryStatus = 'failed';
          errorMessage = `Unknown notification type: ${notification.type}`;
      }

      // Update delivery status
      await db.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: deliveryStatus,
          sentAt: new Date(),
          deliveredAt: deliveryStatus === 'delivered' ? new Date() : undefined,
          errorMessage
        }
      });

      logger.info(`Notification delivered: ${notification.id} via ${notification.type} (${deliveryStatus})`);
    } catch (error) {
      logger.error(`Failed to deliver notification ${notification.id}:`, error);
    }
  }

  private async deliverEmail(notification: NotificationMessage, deliveryId: string): Promise<'sent' | 'delivered' | 'failed'> {
    try {
      // In a real implementation, this would use an email service like SendGrid, AWS SES, etc.
      // For now, we'll simulate email delivery
      
      const recipient = notification.recipientType === 'email' 
        ? notification.recipient 
        : await this.getEmailFromWallet(notification.recipient);

      if (!recipient) {
        return 'failed';
      }

      // Simulate email sending
      const success = Math.random() > 0.05; // 95% success rate
      
      if (success) {
        // Simulate delivery
        setTimeout(async () => {
          await db.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
              status: 'delivered',
              deliveredAt: new Date(),
              trackingId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          });
        }, 2000); // Simulate 2-second delivery time

        return 'sent';
      } else {
        return 'failed';
      }
    } catch (error) {
      logger.error('Failed to deliver email:', error);
      return 'failed';
    }
  }

  private async deliverPush(notification: NotificationMessage, deliveryId: string): Promise<'sent' | 'delivered' | 'failed'> {
    try {
      // In a real implementation, this would use a push notification service like Firebase Cloud Messaging
      // For now, we'll simulate push delivery
      
      const userId = notification.recipientType === 'user_id' ? notification.recipient : null;
      
      if (!userId) {
        return 'failed';
      }

      // Simulate push sending
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        // Simulate immediate delivery for push notifications
        await db.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'delivered',
            deliveredAt: new Date(),
            trackingId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        });

        return 'delivered';
      } else {
        return 'failed';
      }
    } catch (error) {
      logger.error('Failed to deliver push notification:', error);
      return 'failed';
    }
  }

  private async deliverInApp(notification: NotificationMessage, deliveryId: string): Promise<'sent' | 'delivered' | 'failed'> {
    try {
      const userId = notification.recipientType === 'user_id' ? notification.recipient : null;
      
      if (!userId) {
        return 'failed';
      }

      // In-app notifications are immediately "delivered" to the user's notification center
      await db.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      });

      return 'delivered';
    } catch (error) {
      logger.error('Failed to deliver in-app notification:', error);
      return 'failed';
    }
  }

  private async deliverDiscord(notification: NotificationMessage, deliveryId: string): Promise<'sent' | 'delivered' | 'failed'> {
    try {
      // In a real implementation, this would use Discord bot API
      // For now, simulate Discord delivery
      
      const success = Math.random() > 0.15; // 85% success rate
      
      if (success) {
        setTimeout(async () => {
          await db.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
              status: 'delivered',
              deliveredAt: new Date()
            }
          });
        }, 1000);

        return 'sent';
      } else {
        return 'failed';
      }
    } catch (error) {
      logger.error('Failed to deliver Discord notification:', error);
      return 'failed';
    }
  }

  private async deliverTelegram(notification: NotificationMessage, deliveryId: string): Promise<'sent' | 'delivered' | 'failed'> {
    try {
      // In a real implementation, this would use Telegram bot API
      // For now, simulate Telegram delivery
      
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        setTimeout(async () => {
          await db.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
              status: 'delivered',
              deliveredAt: new Date()
            }
          });
        }, 1500);

        return 'sent';
      } else {
        return 'failed';
      }
    } catch (error) {
      logger.error('Failed to deliver Telegram notification:', error);
      return 'failed';
    }
  }

  private async findUserByWallet(walletAddress: string): Promise<any> {
    return await db.user.findFirst({
      where: {
        OR: [
          { walletAddress },
          { wallets: { some: { address: walletAddress } } }
        ]
      }
    });
  }

  private async getEmailFromWallet(walletAddress: string): Promise<string | null> {
    const user = await this.findUserByWallet(walletAddress);
    return user?.email || null;
  }

  private async loadDefaultTemplates(): Promise<void> {
    try {
      const defaultTemplates = [
        {
          name: 'airdrop_new',
          type: 'email',
          category: 'info',
          subject: '🎉 New Airdrop Opportunity: {{airdropTitle}}',
          content: `Great news! We've discovered a new airdrop opportunity that might interest you:

🎁 Airdrop: {{airdropTitle}}
🏢 Project: {{projectName}}
💰 Total Amount: {{totalAmount}}
🪙 Token: {{tokenSymbol}}

{{#claimDeadline}}
⏰ Claim Deadline: {{claimDeadline}}
{{/claimDeadline}}

Don't miss out on this opportunity! Check your eligibility and participate now.

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'projectName', 'totalAmount', 'tokenSymbol', 'claimDeadline'],
          language: 'en',
          version: 1
        },
        {
          name: 'airdrop_ending',
          type: 'email',
          category: 'warning',
          subject: '⏰ Last Chance: {{airdropTitle}} Airdrop Ending Soon',
          content: `This is your final reminder! The {{airdropTitle}} airdrop is ending soon.

⏰ Claim Deadline: {{claimDeadline}}
🎁 Your Reward: {{rewardAmount}}
🔗 Claim Now: Don't miss out!

Time is running out to claim your tokens. Make sure to complete all requirements before the deadline.

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'claimDeadline', 'rewardAmount'],
          language: 'en',
          version: 1
        },
        {
          name: 'airdrop_claimed',
          type: 'email',
          category: 'success',
          subject: '🎉 Congratulations! You\'ve Claimed Your {{airdropTitle}} Airdrop',
          content: `Congratulations! You have successfully claimed your {{airdropTitle}} airdrop.

🎁 Amount Claimed: {{rewardAmount}}
🪙 Token: {{tokenSymbol}}
📊 View your portfolio: {{portfolioLink}}

Thank you for participating! Keep an eye out for more great opportunities.

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'rewardAmount', 'tokenSymbol', 'portfolioLink'],
          language: 'en',
          version: 1
        },
        {
          name: 'eligibility_eligible',
          type: 'email',
          category: 'success',
          subject: '✅ Good News! You\'re Eligible for {{airdropTitle}}',
          content: `Great news! We've checked your wallet and you're eligible for the {{airdropTitle}} airdrop.

🎁 Airdrop: {{airdropTitle}}
✅ Status: Eligible
🔗 Participate Now: {{participateLink}}

You meet all the requirements and can participate right away. Don't miss this opportunity!

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'participateLink'],
          language: 'en',
          version: 1
        },
        {
          name: 'claim_claim_start',
          type: 'email',
          category: 'info',
          subject: '🎉 Claim Period Started for {{airdropTitle}}',
          content: `Good news! The claim period for {{airdropTitle}} has started.

🎁 Your Reward: {{rewardAmount}} {{tokenSymbol}}
📅 Claim Deadline: {{claimDeadline}}
🔗 Claim Link: {{claimLink}}

You can now claim your tokens. Don't wait too long - the claim period ends on {{claimDeadline}}!

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'rewardAmount', 'tokenSymbol', 'claimDeadline', 'claimLink'],
          language: 'en',
          version: 1
        },
        {
          name: 'claim_last_day',
          type: 'email',
          category: 'error',
          subject: '🚨 URGENT: Last Day to Claim {{airdropTitle}}',
          content: `URGENT: Today is the last day to claim your {{airdropTitle}} airdrop!

⏰ Claim Period Ends: {{claimDeadline}}
🎁 Your Reward: {{rewardAmount}} {{tokenSymbol}}
🔗 Claim Link: {{claimLink}}

Claim your tokens before they're gone forever. This is your final chance!

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'claimDeadline', 'rewardAmount', 'tokenSymbol', 'claimLink'],
          language: 'en',
          version: 1
        }
      ];

      for (const template of defaultTemplates) {
        await db.notificationTemplate.upsert({
          where: { name: template.name },
          update: {
            ...template,
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            id: `template_${template.name}`,
            ...template,
            isActive: true
          }
        });

        this.templates.set(template.name, template as NotificationTemplate);
      }

      logger.info(`Loaded ${defaultTemplates.length} default notification templates`);
    } catch (error) {
      logger.error('Failed to load default templates:', error);
    }
  }

  async getNotificationStats(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<NotificationStats> {
    try {
      const cutoffDate = this.getCutoffDate(timeframe);

      const deliveries = await db.notificationDelivery.findMany({
        where: {
          createdAt: {
            gte: cutoffDate
          }
        }
      });

      const stats: NotificationStats = {
        total: deliveries.length,
        sent: deliveries.filter(d => d.status === 'sent').length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
        opened: deliveries.filter(d => d.openedAt).length,
        clicked: deliveries.filter(d => d.clickedAt).length,
        failed: deliveries.filter(d => d.status === 'failed').length,
        byType: {},
        byCategory: {},
        byStatus: {},
        averageDeliveryTime: 0,
        openRate: 0,
        clickRate: 0
      };

      // Calculate breakdowns
      for (const delivery of deliveries) {
        stats.byType[delivery.channel] = (stats.byType[delivery.channel] || 0) + 1;
        stats.byStatus[delivery.status] = (stats.byStatus[delivery.status] || 0) + 1;
      }

      // Calculate rates
      if (stats.delivered > 0) {
        stats.openRate = (stats.opened / stats.delivered) * 100;
        stats.clickRate = (stats.clicked / stats.delivered) * 100;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      return {
        total: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        byType: {},
        byCategory: {},
        byStatus: {},
        averageDeliveryTime: 0,
        openRate: 0,
        clickRate: 0
      };
    }
  }

  async getUserNotifications(userId: string, limit = 50): Promise<any[]> {
    try {
      return await db.userNotification.findMany({
        where: {
          userId,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await db.userNotification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      await db.userNotification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return true;
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  async createCustomTemplate(template: {
    name: string;
    type: 'email' | 'push' | 'in_app' | 'discord' | 'telegram';
    category: string;
    subject?: string;
    content: string;
    variables: string[];
    language?: string;
  }): Promise<NotificationTemplate> {
    try {
      const newTemplate = await db.notificationTemplate.create({
        data: {
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: template.name,
          type: template.type,
          category: template.category,
          subject: template.subject,
          content: template.content,
          variables: template.variables,
          language: template.language || 'en',
          version: 1,
          isActive: true
        }
      });

      const templateObj: NotificationTemplate = {
        id: newTemplate.id,
        name: newTemplate.name,
        type: newTemplate.type as any,
        category: newTemplate.category,
        subject: newTemplate.subject || undefined,
        content: newTemplate.content,
        variables: newTemplate.variables,
        isActive: newTemplate.isActive,
        language: newTemplate.language,
        version: newTemplate.version,
        metadata: newTemplate.metadata
      };

      this.templates.set(template.name, templateObj);

      logger.info(`Created custom template: ${template.name}`);
      return templateObj;
    } catch (error) {
      logger.error('Failed to create custom template:', error);
      throw error;
    }
  }

  async getTemplate(name: string): Promise<NotificationTemplate | null> {
    try {
      const template = await db.notificationTemplate.findUnique({
        where: { name }
      });

      if (template) {
        const templateObj: NotificationTemplate = {
          id: template.id,
          name: template.name,
          type: template.type as any,
          category: template.category,
          subject: template.subject || undefined,
          content: template.content,
          variables: template.variables,
          isActive: template.isActive,
          language: template.language,
          version: template.version,
          metadata: template.metadata
        };

        this.templates.set(name, templateObj);
        return templateObj;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get template:', error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();