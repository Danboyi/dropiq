-- CreateEnum
CREATE TYPE "UserSubscriptionPlan" AS ENUM ('free', 'premium', 'enterprise');

-- CreateEnum
CREATE TYPE "UserSubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trialing');

-- CreateEnum
CREATE TYPE "AirdropStatus" AS ENUM ('upcoming', 'active', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "AirdropType" AS ENUM ('standard', 'nft', 'token', 'liquidity');

-- CreateEnum
CREATE TYPE "RewardDistribution" AS ENUM ('equal', 'proportional', 'tiered');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('defi', 'gaming', 'nft', 'infrastructure', 'dao', 'exchange', 'wallet', 'other');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'verified', 'flagged');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('twitter_follow', 'discord_join', 'telegram_join', 'wallet_connect', 'hold_token', 'visit_website', 'subscribe_newsletter', 'complete_quiz', 'referral');

-- CreateEnum
CREATE Type "ParticipationStatus" AS ENUM ('registered', 'in_progress', 'completed', 'verified', 'rejected', 'rewarded');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('promotion', 'review', 'tutorial', 'social_media');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('crypto', 'fiat', 'platform_tokens');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('fixed', 'percentage', 'tiered');

-- CreateEnum
CREATE TYPE "ShillingParticipationStatus" AS ENUM ('applied', 'approved', 'rejected', 'active', 'completed', 'disputed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('scam', 'phishing', 'fake', 'suspicious');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('security', 'financial', 'operational');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('in_progress', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('project', 'airdrop', 'campaign');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('scam_detected', 'security_breach', 'vulnerability', 'maintenance', 'announcement');

-- CreateEnum
CREATE TYPE "TargetAudience" AS ENUM ('all', 'premium', 'specific_users');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('airdrop_new', 'airdrop_ending', 'airdrop_completed', 'reward_received', 'requirement_verified', 'security_alert', 'system_announcement');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('info', 'success', 'warning', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "walletAddress" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "airdropAlerts" BOOLEAN NOT NULL DEFAULT true,
    "priceAlerts" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "showWalletAddress" BOOLEAN NOT NULL DEFAULT false,
    "showAirdropHistory" BOOLEAN NOT NULL DEFAULT true,
    "autoJoinAirdrops" BOOLEAN NOT NULL DEFAULT false,
    "minRewardThreshold" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "preferredBlockchains" TEXT[],
    "preferredCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_security_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "backupCodes" TEXT[],
    "sessionTimeout" INTEGER NOT NULL DEFAULT 24,
    "ipWhitelist" TEXT[],
    "deviceWhitelist" TEXT[],
    "suspiciousActivityLock" BOOLEAN NOT NULL DEFAULT false,
    "lastSecurityCheck" TIMESTAMP(3),
    "securityScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_security_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL,
    "nickname" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "balance" DECIMAL(65,30) DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "UserSubscriptionPlan" NOT NULL,
    "status" "UserSubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "price" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "category" "ProjectCategory" NOT NULL,
    "blockchain" TEXT NOT NULL,
    "contractAddress" TEXT,
    "socialLinks" JSONB,
    "team" JSONB,
    "investors" JSONB,
    "funding" JSONB,
    "tokenomics" JSONB,
    "roadmap" JSONB,
    "whitepaper" TEXT,
    "auditReport" TEXT,
    "trustScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "isScam" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractAddress" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "totalSupply" DECIMAL(65,30),
    "circulatingSupply" DECIMAL(65,30),
    "price" DECIMAL(65,30),
    "marketCap" DECIMAL(65,30),
    "volume24h" DECIMAL(65,30),
    "priceChange24h" DECIMAL(65,30),
    "blockchain" TEXT NOT NULL,
    "logo" TEXT,
    "coingeckoId" TEXT,
    "coinmarketcapId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airdrops" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "projectId" TEXT NOT NULL,
    "tokenId" TEXT,
    "status" "AirdropStatus" NOT NULL DEFAULT 'upcoming',
    "type" "AirdropType" NOT NULL DEFAULT 'standard',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3),
    "claimDeadline" TIMESTAMP(3),
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "tokenSymbol" TEXT,
    "participantsCount" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "minRewardAmount" DECIMAL(65,30),
    "maxRewardAmount" DECIMAL(65,30),
    "averageReward" DECIMAL(65,30),
    "rewardDistribution" "RewardDistribution" NOT NULL DEFAULT 'proportional',
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "kycRequired" BOOLEAN NOT NULL DEFAULT false,
    "gasRequired" BOOLEAN NOT NULL DEFAULT false,
    "estimatedGas" DECIMAL(65,30),
    "trustScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "socialLinks" JSONB,
    "requirements" JSONB,
    "eligibilityCriteria" JSONB,
    "rewardStructure" JSONB,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airdrops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airdrop_requirements" (
    "id" TEXT NOT NULL,
    "airdropId" TEXT NOT NULL,
    "type" "RequirementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "parameters" JSONB,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airdrop_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_requirement_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "airdropId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verificationData" JSONB,
    "points" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_requirement_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_airdrop_participations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "airdropId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'registered',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "rewardAmount" DECIMAL(65,30),
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimedAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_airdrop_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airdrop_metrics" (
    "id" TEXT NOT NULL,
    "airdropId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "newParticipants" INTEGER NOT NULL DEFAULT 0,
    "completedParticipants" INTEGER NOT NULL DEFAULT 0,
    "verifiedParticipants" INTEGER NOT NULL DEFAULT 0,
    "totalRewardsDistributed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "averageReward" DECIMAL(65,30),
    "engagementRate" DECIMAL(65,30),
    "completionRate" DECIMAL(65,30),
    "verificationRate" DECIMAL(65,30),
    "socialShares" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(65,30),
    "revenue" DECIMAL(65,30),
    "cost" DECIMAL(65,30),
    "roi" DECIMAL(65,30),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "airdrop_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airdrop_historical_data" (
    "id" TEXT NOT NULL,
    "airdropId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "data" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "airdrop_historical_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shilling_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "campaignType" "CampaignType" NOT NULL,
    "projectId" TEXT,
    "airdropId" TEXT,
    "creatorId" TEXT NOT NULL,
    "budget" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "rewardPerAction" DECIMAL(65,30) NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "requirements" JSONB,
    "guidelines" JSONB,
    "verificationNeeded" BOOLEAN NOT NULL DEFAULT true,
    "autoApproval" BOOLEAN NOT NULL DEFAULT false,
    "escrowEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shilling_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shilling_participations" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "ShillingParticipationStatus" NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "workSubmitted" JSONB,
    "verificationData" JSONB,
    "earnings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "rating" INTEGER,
    "review" TEXT,
    "disputeStatus" TEXT,
    "disputeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shilling_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shilling_payments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "transactionHash" TEXT,
    "paymentAddress" TEXT,
    "gasFee" DECIMAL(65,30),
    "processingFee" DECIMAL(65,30),
    "netAmount" DECIMAL(65,30),
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shilling_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shilling_metrics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "engagement" DECIMAL(65,30),
    "reach" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "costPerImpression" DECIMAL(65,30),
    "costPerClick" DECIMAL(65,30),
    "costPerConversion" DECIMAL(65,30),
    "revenue" DECIMAL(65,30),
    "roi" DECIMAL(65,30),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shilling_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scam_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "projectId" TEXT,
    "airdropId" TEXT,
    "campaignId" TEXT,
    "reportType" "ReportType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "riskScore" DECIMAL(65,30),
    "affectedUsers" INTEGER NOT NULL DEFAULT 0,
    "publicVisible" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scam_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetAudience" "TargetAudience" NOT NULL DEFAULT 'all',
    "targetUsers" TEXT[],
    "projectId" TEXT,
    "airdropId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "expiresAt" TIMESTAMP(3),
    "dismissedBy" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "dismissCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_reports" (
    "id" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "auditType" "AuditType" NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'in_progress',
    "overallScore" DECIMAL(65,30),
    "findings" JSONB,
    "recommendations" JSONB,
    "riskLevel" "RiskLevel",
    "publicReport" TEXT,
    "detailedReport" TEXT,
    "certificate" TEXT,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "nextAuditDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "category" "NotificationCategory" NOT NULL DEFAULT 'info',
    "actionUrl" TEXT,
    "actionText" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "marketCap" DECIMAL(65,30),
    "volume24h" DECIMAL(65,30),
    "priceChange1h" DECIMAL(65,30),
    "priceChange24h" DECIMAL(65,30),
    "priceChange7d" DECIMAL(65,30),
    "circulatingSupply" DECIMAL(65,30),
    "totalSupply" DECIMAL(65,30),
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "unit" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_security_settings_userId_key" ON "user_security_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_userId_address_blockchain_key" ON "user_wallets"("userId", "address", "blockchain");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_projectId_symbol_key" ON "tokens"("projectId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "airdrops_slug_key" ON "airdrops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_requirement_completions_userId_airdropId_requirementId_key" ON "user_requirement_completions"("userId", "airdropId", "requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "user_airdrop_participations_userId_airdropId_key" ON "user_airdrop_participations"("userId", "airdropId");

-- CreateIndex
CREATE UNIQUE INDEX "airdrop_metrics_airdropId_date_key" ON "airdrop_metrics"("airdropId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "shilling_participations_campaignId_participantId_key" ON "shilling_participations"("campaignId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "market_data_symbol_source_timestamp_key" ON "market_data"("symbol", "source", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "system_metrics_metric_timestamp_key" ON "system_metrics"("metric", "timestamp");

-- Performance indexes for frequently queried columns
CREATE INDEX "idx_users_isActive" ON "users"("isActive");

CREATE INDEX "idx_users_isPremium" ON "users"("isPremium");

CREATE INDEX "idx_users_createdAt" ON "users"("createdAt");

CREATE INDEX "idx_airdrops_status" ON "airdrops"("status");

CREATE INDEX "idx_airdrops_startDate" ON "airdrops"("startDate");

CREATE INDEX "idx_airdrops_endDate" ON "airdrops"("endDate");

CREATE INDEX "idx_airdrops_projectId" ON "airdrops"("projectId");

CREATE INDEX "idx_airdrops_featured" ON "airdrops"("featured");

CREATE INDEX "idx_airdrops_trending" ON "airdrops"("trending");

CREATE INDEX "idx_airdrops_trustScore" ON "airdrops"("trustScore");

CREATE INDEX "idx_airdrops_participantsCount" ON "airdrops"("participantsCount");

CREATE INDEX "idx_projects_category" ON "projects"("category");

CREATE INDEX "idx_projects_blockchain" ON "projects"("blockchain");

CREATE INDEX "idx_projects_trustScore" ON "projects"("trustScore");

CREATE INDEX "idx_projects_verificationStatus" ON "projects"("verificationStatus");

CREATE INDEX "idx_projects_isScam" ON "projects"("isScam");

CREATE INDEX "idx_projects_featured" ON "projects"("featured");

CREATE INDEX "idx_user_activity_logs_userId_createdAt" ON "user_activity_logs"("userId", "createdAt");

CREATE INDEX "idx_user_activity_logs_action_createdAt" ON "user_activity_logs"("action", "createdAt");

CREATE INDEX "idx_user_activity_logs_resource_resourceId" ON "user_activity_logs"("resource", "resourceId");

CREATE INDEX "idx_user_activity_logs_timestamp" ON "user_activity_logs"("createdAt");

CREATE INDEX "idx_scam_reports_status" ON "scam_reports"("status");

CREATE INDEX "idx_scam_reports_severity" ON "scam_reports"("severity");

CREATE INDEX "idx_scam_reports_verified" ON "scam_reports"("verified");

CREATE INDEX "idx_scam_reports_createdAt" ON "scam_reports"("createdAt");

CREATE INDEX "idx_security_alerts_isActive" ON "security_alerts"("isActive");

CREATE INDEX "idx_security_alerts_severity" ON "security_alerts"("severity");

CREATE INDEX "idx_security_alerts_expiresAt" ON "security_alerts"("expiresAt");

CREATE INDEX "idx_user_notifications_userId_isRead" ON "user_notifications"("userId", "isRead");

CREATE INDEX "idx_user_notifications_priority" ON "user_notifications"("priority");

CREATE INDEX "idx_user_notifications_expiresAt" ON "user_notifications"("expiresAt");

-- Add foreign key constraints
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_security_settings" ADD CONSTRAINT "user_security_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tokens" ADD CONSTRAINT "tokens_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "airdrops" ADD CONSTRAINT "airdrops_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "airdrops" ADD CONSTRAINT "airdrops_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "airdrop_requirements" ADD CONSTRAINT "airdrop_requirements_airdropId_fkey" FOREIGN KEY ("airdropId") REFERENCES "airdrops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_requirement_completions" ADD CONSTRAINT "user_requirement_completions_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "airdrop_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "airdrop_metrics" ADD CONSTRAINT "airdrop_metrics_airdropId_fkey" FOREIGN KEY ("airdropId") REFERENCES "airdrops"("id") ON DELETE CASCADE ON UPDATE CASCADE;