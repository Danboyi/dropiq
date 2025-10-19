import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface ReminderConfig {
  airdropId: string;
  walletAddress: string;
  reminderType: 'claim_start' | 'claim_ending' | 'last_day' | 'custom';
  scheduledFor: Date;
  message?: string;
  channels: ('email' | 'push' | 'discord' | 'telegram')[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: any;
}

export interface ClaimReminder {
  id: string;
  airdropId: string;
  walletAddress: string;
  reminderType: string;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  message?: string;
  channels: string[];
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  errorMessage?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderTemplate {
  id: string;
  type: string;
  name: string;
  subject?: string;
  content: string;
  variables: string[];
  channels: string[];
  isActive: boolean;
  language: string;
  version: number;
}

export class ClaimReminderService {
  private scheduledReminders: Map<string, NodeJS.Timeout> = new Map();
  private templates: Map<string, ReminderTemplate> = new Map();

  async initialize() {
    try {
      // Load default templates
      await this.loadDefaultTemplates();
      
      // Load pending reminders
      await this.loadPendingReminders();
      
      // Start reminder monitoring
      this.startReminderMonitoring();
      
      logger.info('Claim reminder service initialized');
    } catch (error) {
      logger.error('Failed to initialize claim reminder service:', error);
    }
  }

  private async loadDefaultTemplates(): Promise<void> {
    try {
      const defaultTemplates = [
        {
          type: 'claim_start',
          name: 'Claim Period Started',
          subject: '🎉 Airdrop Claim Period Has Started!',
          content: `Good news! The claim period for {{airdropTitle}} has started.

You can now claim your {{rewardAmount}} {{tokenSymbol}} tokens.

📅 Claim Deadline: {{claimDeadline}}
🔗 Claim Link: {{claimLink}}

Don't wait too long - the claim period ends on {{claimDeadline}}!

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'rewardAmount', 'tokenSymbol', 'claimDeadline', 'claimLink'],
          channels: ['email', 'push'],
          language: 'en',
          version: 1
        },
        {
          type: 'claim_ending',
          name: 'Claim Period Ending Soon',
          subject: '⏰ Last Chance to Claim Your {{tokenSymbol}} Airdrop!',
          content: `This is your final reminder! The claim period for {{airdropTitle}} ends in {{timeRemaining}}.

🎁 Your Reward: {{rewardAmount}} {{tokenSymbol}}
⏰ Time Left: {{timeRemaining}}
📅 Deadline: {{claimDeadline}}
🔗 Claim Link: {{claimLink}}

Don't miss out on your tokens!

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'rewardAmount', 'tokenSymbol', 'timeRemaining', 'claimDeadline', 'claimLink'],
          channels: ['email', 'push'],
          language: 'en',
          version: 1
        },
        {
          type: 'last_day',
          name: 'Last Day to Claim',
          subject: '🚨 URGENT: Last Day to Claim Your Airdrop!',
          content: `URGENT: Today is the last day to claim your {{airdropTitle}} airdrop!

⏰ Claim Period Ends: {{claimDeadline}}
🎁 Your Reward: {{rewardAmount}} {{tokenSymbol}}
🔗 Claim Link: {{claimLink}}

Claim your tokens before they're gone forever!

Best regards,
DropIQ Team`,
          variables: ['airdropTitle', 'rewardAmount', 'tokenSymbol', 'claimDeadline', 'claimLink'],
          channels: ['email', 'push', 'discord', 'telegram'],
          language: 'en',
          version: 1
        },
        {
          type: 'custom',
          name: 'Custom Reminder',
          subject: '{{subject}}',
          content: '{{message}}',
          variables: ['subject', 'message'],
          channels: ['email', 'push'],
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
            id: `template_${template.type}`,
            ...template,
            isActive: true
          }
        });

        this.templates.set(template.type, template as ReminderTemplate);
      }

      logger.info(`Loaded ${defaultTemplates.length} default reminder templates`);
    } catch (error) {
      logger.error('Failed to load default templates:', error);
    }
  }

  private async loadPendingReminders(): Promise<void> {
    try {
      const pendingReminders = await db.claimReminder.findMany({
        where: {
          status: 'scheduled',
          scheduledFor: {
            gte: new Date()
          }
        },
        include: {
          airdrop: {
            select: {
              title: true,
              claimDeadline: true,
              tokenSymbol: true
            }
          }
        }
      });

      for (const reminder of pendingReminders) {
        await this.scheduleReminderExecution(reminder.id, reminder.scheduledFor);
      }

      logger.info(`Loaded ${pendingReminders.length} pending reminders`);
    } catch (error) {
      logger.error('Failed to load pending reminders:', error);
    }
  }

  async scheduleReminder(config: ReminderConfig): Promise<ClaimReminder> {
    try {
      const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create reminder record
      const reminder = await db.claimReminder.create({
        data: {
          id: reminderId,
          airdropId: config.airdropId,
          walletAddress: config.walletAddress,
          reminderType: config.reminderType,
          scheduledFor: config.scheduledFor,
          message: config.message,
          channels: config.channels,
          priority: config.priority,
          attempts: 0,
          maxAttempts: 3,
          status: 'scheduled',
          metadata: config.metadata || {}
        }
      });

      // Schedule execution
      await this.scheduleReminderExecution(reminderId, config.scheduledFor);

      logger.info(`Scheduled reminder ${reminderId} for ${config.walletAddress} at ${config.scheduledFor.toISOString()}`);
      return reminder;
    } catch (error) {
      logger.error('Failed to schedule reminder:', error);
      throw error;
    }
  }

  async scheduleAutomaticReminders(airdropId: string): Promise<void> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          participations: {
            where: {
              status: 'completed',
              rewardClaimed: false
            }
          }
        }
      });

      if (!airdrop || !airdrop.claimDeadline) {
        logger.info(`No claim deadline or eligible users for airdrop ${airdropId}`);
        return;
      }

      const claimDeadline = new Date(airdrop.claimDeadline);
      const now = new Date();

      if (claimDeadline <= now) {
        logger.info(`Claim deadline has passed for airdrop ${airdropId}`);
        return;
      }

      // Schedule reminders for all eligible users
      for (const participation of airdrop.participations) {
        await this.scheduleUserReminders(airdrop, participation.walletAddress, claimDeadline);
      }

      logger.info(`Scheduled automatic reminders for ${airdrop.participations.length} users in airdrop ${airdropId}`);
    } catch (error) {
      logger.error(`Failed to schedule automatic reminders for airdrop ${airdropId}:`, error);
    }
  }

  private async scheduleUserReminders(airdrop: any, walletAddress: string, claimDeadline: Date): Promise<void> {
    try {
      const now = new Date();
      const timeUntilDeadline = claimDeadline.getTime() - now.getTime();
      const daysUntilDeadline = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24));

      // Schedule different reminders based on time remaining
      if (daysUntilDeadline <= 1) {
        // Last day reminder
        await this.scheduleReminder({
          airdropId: airdrop.id,
          walletAddress,
          reminderType: 'last_day',
          scheduledFor: new Date(claimDeadline.getTime() - 2 * 60 * 60 * 1000), // 2 hours before deadline
          channels: ['email', 'push'],
          priority: 'urgent'
        });
      } else if (daysUntilDeadline <= 3) {
        // 3-day reminder
        await this.scheduleReminder({
          airdropId: airdrop.id,
          walletAddress,
          reminderType: 'claim_ending',
          scheduledFor: new Date(claimDeadline.getTime() - 24 * 60 * 60 * 1000), // 1 day before deadline
          channels: ['email', 'push'],
          priority: 'high'
        });
      } else if (daysUntilDeadline <= 7) {
        // 7-day reminder
        await this.scheduleReminder({
          airdropId: airdrop.id,
          walletAddress,
          reminderType: 'claim_ending',
          scheduledFor: new Date(claimDeadline.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before deadline
          channels: ['email'],
          priority: 'medium'
        });
      }

      // Claim start reminder (if claim period hasn't started yet)
      if (airdrop.startDate && new Date(airdrop.startDate) > now) {
        await this.scheduleReminder({
          airdropId: airdrop.id,
          walletAddress,
          reminderType: 'claim_start',
          scheduledFor: new Date(airdrop.startDate),
          channels: ['email', 'push'],
          priority: 'medium'
        });
      }
    } catch (error) {
      logger.error(`Failed to schedule user reminders for ${walletAddress}:`, error);
    }
  }

  private async scheduleReminderExecution(reminderId: string, scheduledFor: Date): Promise<void> {
    try {
      const delay = scheduledFor.getTime() - new Date().getTime();
      
      if (delay <= 0) {
        await this.executeReminder(reminderId);
        return;
      }

      const timeout = setTimeout(async () => {
        await this.executeReminder(reminderId);
      }, delay);

      this.scheduledReminders.set(reminderId, timeout);

      logger.debug(`Scheduled reminder execution for ${reminderId} at ${scheduledFor.toISOString()}`);
    } catch (error) {
      logger.error(`Failed to schedule reminder execution for ${reminderId}:`, error);
    }
  }

  private async executeReminder(reminderId: string): Promise<void> {
    try {
      const reminder = await db.claimReminder.findUnique({
        where: { id: reminderId },
        include: {
          airdrop: {
            select: {
              title: true,
              claimDeadline: true,
              tokenSymbol: true,
              totalAmount: true
            }
          }
        }
      });

      if (!reminder) {
        logger.error(`Reminder ${reminderId} not found`);
        return;
      }

      if (reminder.status !== 'scheduled') {
        logger.info(`Reminder ${reminderId} is not in scheduled status: ${reminder.status}`);
        return;
      }

      logger.info(`Executing reminder ${reminderId} for ${reminder.walletAddress}`);

      // Update attempt count
      await db.claimReminder.update({
        where: { id: reminderId },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          status: 'sent' // Will be updated to failed if sending fails
        }
      });

      // Generate reminder content
      const content = await this.generateReminderContent(reminder);
      
      // Send through all configured channels
      const results = [];
      for (const channel of reminder.channels) {
        try {
          const result = await this.sendReminder(channel, reminder, content);
          results.push({ channel, success: true, result });
        } catch (error) {
          logger.error(`Failed to send reminder via ${channel}:`, error);
          results.push({ channel, success: false, error: error.message });
        }
      }

      // Check if any channel succeeded
      const anySuccess = results.some(r => r.success);
      
      if (anySuccess) {
        // Mark as sent
        await db.claimReminder.update({
          where: { id: reminderId },
          data: {
            status: 'sent',
            sentAt: new Date(),
            metadata: {
              ...reminder.metadata,
              sentAt: new Date().toISOString(),
              results
            }
          }
        });

        logger.info(`Successfully sent reminder ${reminderId}`);
      } else {
        // Mark as failed and schedule retry if attempts remain
        const shouldRetry = reminder.attempts < reminder.maxAttempts;
        const nextAttemptAt = shouldRetry 
          ? new Date(Date.now() + 60 * 60 * 1000) // Retry in 1 hour
          : undefined;

        await db.claimReminder.update({
          where: { id: reminderId },
          data: {
            status: shouldRetry ? 'scheduled' : 'failed',
            errorMessage: `All channels failed: ${results.map(r => r.error || 'Unknown error').join(', ')}`,
            nextAttemptAt,
            metadata: {
              ...reminder.metadata,
              lastFailure: new Date().toISOString(),
              results
            }
          }
        });

        if (shouldRetry && nextAttemptAt) {
          await this.scheduleReminderExecution(reminderId, nextAttemptAt);
        }

        logger.error(`Failed to send reminder ${reminderId} on attempt ${reminder.attempts}`);
      }
    } catch (error) {
      logger.error(`Failed to execute reminder ${reminderId}:`, error);
      
      // Mark as failed
      await db.claimReminder.update({
        where: { id: reminderId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            executionFailed: new Date().toISOString()
          }
        }
      });
    } finally {
      // Clear scheduled timeout
      if (this.scheduledReminders.has(reminderId)) {
        clearTimeout(this.scheduledReminders.get(reminderId)!);
        this.scheduledReminders.delete(reminderId);
      }
    }
  }

  private async generateReminderContent(reminder: any): Promise<string> {
    try {
      const template = this.templates.get(reminder.reminderType);
      if (!template) {
        return reminder.message || `Reminder for ${reminder.airdrop.title}`;
      }

      // Get template variables
      const variables = await this.getTemplateVariables(reminder);
      
      // Replace variables in template
      let content = template.content;
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      return content;
    } catch (error) {
      logger.error('Failed to generate reminder content:', error);
      return reminder.message || 'Reminder notification';
    }
  }

  private async getTemplateVariables(reminder: any): Promise<Record<string, string>> {
    try {
      const variables: Record<string, string> = {
        airdropTitle: reminder.airdrop.title,
        claimDeadline: reminder.airdrop.claimDeadline ? new Date(reminder.airdrop.claimDeadline).toLocaleDateString() : 'N/A',
        tokenSymbol: reminder.airdrop.tokenSymbol || 'tokens',
        claimLink: `https://dropiq.app/airdrop/${reminder.airdrop.id}/claim`,
        timeRemaining: this.getTimeRemaining(reminder.airdrop.claimDeadline),
        rewardAmount: 'Your reward amount', // Would need to get from participation
        subject: reminder.message || 'Airdrop Reminder',
        message: reminder.message || 'Don\'t forget to claim your airdrop!'
      };

      return variables;
    } catch (error) {
      logger.error('Failed to get template variables:', error);
      return {};
    }
  }

  private getTimeRemaining(claimDeadline: string | Date): string {
    try {
      const deadline = new Date(claimDeadline);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) return 'Expired';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  private async sendReminder(channel: string, reminder: any, content: string): Promise<any> {
    try {
      switch (channel) {
        case 'email':
          return await this.sendEmailReminder(reminder, content);
        case 'push':
          return await this.sendPushReminder(reminder, content);
        case 'discord':
          return await this.sendDiscordReminder(reminder, content);
        case 'telegram':
          return await this.sendTelegramReminder(reminder, content);
        default:
          throw new Error(`Unknown channel: ${channel}`);
      }
    } catch (error) {
      logger.error(`Failed to send reminder via ${channel}:`, error);
      throw error;
    }
  }

  private async sendEmailReminder(reminder: any, content: string): Promise<any> {
    try {
      // Get user email
      const user = await db.user.findFirst({
        where: {
          OR: [
            { walletAddress: reminder.walletAddress },
            { wallets: { some: { address: reminder.walletAddress } } }
          ]
        }
      });

      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Create notification record
      await db.userNotification.create({
        data: {
          userId: user.id,
          type: 'claim_reminder',
          title: 'Airdrop Claim Reminder',
          message: content,
          data: {
            reminderId: reminder.id,
            airdropId: reminder.airdropId,
            reminderType: reminder.reminderType
          },
          priority: reminder.priority,
          category: 'info'
        }
      });

      // In a real implementation, this would send an actual email
      logger.info(`Email reminder sent to ${user.email} for reminder ${reminder.id}`);
      
      return { success: true, email: user.email };
    } catch (error) {
      logger.error('Failed to send email reminder:', error);
      throw error;
    }
  }

  private async sendPushReminder(reminder: any, content: string): Promise<any> {
    try {
      // Get user for push notification
      const user = await db.user.findFirst({
        where: {
          OR: [
            { walletAddress: reminder.walletAddress },
            { wallets: { some: { address: reminder.walletAddress } } }
          ]
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create push notification
      await db.userNotification.create({
        data: {
          userId: user.id,
          type: 'claim_reminder',
          title: 'Airdrop Claim Reminder',
          message: content,
          data: {
            reminderId: reminder.id,
            airdropId: reminder.airdropId,
            reminderType: reminder.reminderType
          },
          priority: reminder.priority,
          category: 'info'
        }
      });

      // In a real implementation, this would send an actual push notification
      logger.info(`Push reminder sent to user ${user.id} for reminder ${reminder.id}`);
      
      return { success: true, userId: user.id };
    } catch (error) {
      logger.error('Failed to send push reminder:', error);
      throw error;
    }
  }

  private async sendDiscordReminder(reminder: any, content: string): Promise<any> {
    try {
      // In a real implementation, this would send to Discord
      logger.info(`Discord reminder sent for reminder ${reminder.id}`);
      
      return { success: true, channel: 'discord' };
    } catch (error) {
      logger.error('Failed to send Discord reminder:', error);
      throw error;
    }
  }

  private async sendTelegramReminder(reminder: any, content: string): Promise<any> {
    try {
      // In a real implementation, this would send to Telegram
      logger.info(`Telegram reminder sent for reminder ${reminder.id}`);
      
      return { success: true, channel: 'telegram' };
    } catch (error) {
      logger.error('Failed to send Telegram reminder:', error);
      throw error;
    }
  }

  private startReminderMonitoring(): void {
    // Check for failed reminders to retry every hour
    setInterval(async () => {
      await this.retryFailedReminders();
    }, 60 * 60 * 1000);

    // Check for upcoming claim deadlines every 6 hours
    setInterval(async () => {
      await this.checkUpcomingDeadlines();
    }, 6 * 60 * 60 * 1000);
  }

  private async retryFailedReminders(): Promise<void> {
    try {
      const failedReminders = await db.claimReminder.findMany({
        where: {
          status: 'failed',
          attempts: { lt: 3 },
          lastAttemptAt: {
            lte: new Date(Date.now() - 60 * 60 * 1000) // More than 1 hour ago
          }
        }
      });

      for (const reminder of failedReminders) {
        try {
          await db.claimReminder.update({
            where: { id: reminder.id },
            data: {
              status: 'scheduled',
              nextAttemptAt: new Date(Date.now() + 30 * 60 * 1000) // Retry in 30 minutes
            }
          });

          await this.scheduleReminderExecution(reminder.id, new Date(Date.now() + 30 * 60 * 1000));
          logger.info(`Scheduled retry for failed reminder ${reminder.id}`);
        } catch (error) {
          logger.error(`Failed to schedule retry for reminder ${reminder.id}:`, error);
        }
      }

      if (failedReminders.length > 0) {
        logger.info(`Scheduled retries for ${failedReminders.length} failed reminders`);
      }
    } catch (error) {
      logger.error('Failed to retry failed reminders:', error);
    }
  }

  private async checkUpcomingDeadlines(): Promise<void> {
    try {
      const upcomingDeadlines = await db.airdrop.findMany({
        where: {
          claimDeadline: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          },
          status: 'active'
        },
        include: {
          participations: {
            where: {
              status: 'completed',
              rewardClaimed: false
            }
          }
        }
      });

      for (const airdrop of upcomingDeadlines) {
        await this.scheduleAutomaticReminders(airdrop.id);
      }

      if (upcomingDeadlines.length > 0) {
        logger.info(`Checked upcoming deadlines for ${upcomingDeadlines.length} airdrops`);
      }
    } catch (error) {
      logger.error('Failed to check upcoming deadlines:', error);
    }
  }

  async cancelReminder(reminderId: string): Promise<boolean> {
    try {
      // Clear scheduled timeout
      if (this.scheduledReminders.has(reminderId)) {
        clearTimeout(this.scheduledReminders.get(reminderId)!);
        this.scheduledReminders.delete(reminderId);
      }

      // Update reminder status
      await db.claimReminder.update({
        where: { id: reminderId },
        data: {
          status: 'cancelled',
          metadata: {
            cancelledAt: new Date().toISOString()
          }
        }
      });

      logger.info(`Cancelled reminder ${reminderId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel reminder ${reminderId}:`, error);
      return false;
    }
  }

  async getUserReminders(walletAddress: string): Promise<ClaimReminder[]> {
    try {
      return await db.claimReminder.findMany({
        where: {
          walletAddress,
          status: {
            in: ['scheduled', 'sent']
          }
        },
        include: {
          airdrop: {
            select: {
              title: true,
              claimDeadline: true,
              tokenSymbol: true
            }
          }
        },
        orderBy: {
          scheduledFor: 'desc'
        }
      });
    } catch (error) {
      logger.error('Failed to get user reminders:', error);
      return [];
    }
  }

  async getReminderStats(): Promise<any> {
    try {
      const stats = await db.claimReminder.groupBy({
        by: ['status', 'reminderType'],
        _count: {
          id: true
        }
      });

      const totalReminders = stats.reduce((sum, stat) => sum + stat._count.id, 0);
      const scheduled = this.scheduledReminders.size;

      return {
        total: totalReminders,
        scheduled,
        byStatus: stats.reduce((acc, stat) => {
          if (!acc[stat.status]) acc[stat.status] = 0;
          acc[stat.status] += stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: stats.reduce((acc, stat) => {
          if (!acc[stat.reminderType]) acc[stat.reminderType] = 0;
          acc[stat.reminderType] += stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      logger.error('Failed to get reminder stats:', error);
      return {
        total: 0,
        scheduled: 0,
        byStatus: {},
        byType: {}
      };
    }
  }
}

export const claimReminderService = new ClaimReminderService();