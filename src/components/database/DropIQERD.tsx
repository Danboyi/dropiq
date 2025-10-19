import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DropIQERD = () => {
  return (
    <div className="p-6 space-y-6 overflow-x-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">DropIQ Database ERD</h1>
        <p className="text-gray-600">Entity Relationship Diagram for the DropIQ Platform</p>
      </div>

      {/* User Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">👥 User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded p-3 bg-blue-50">
              <h4 className="font-semibold text-blue-800">User</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• email (Unique)</li>
                <li>• username (Unique)</li>
                <li>• walletAddress (Unique)</li>
                <li>• isPremium</li>
                <li>• referralCode</li>
                <li>• referredBy</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-blue-50">
              <h4 className="font-semibold text-blue-800">UserPreferences</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• userId (FK → User)</li>
                <li>• theme, language</li>
                <li>• notifications</li>
                <li>• security settings</li>
                <li>• preferences</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-blue-50">
              <h4 className="font-semibold text-blue-800">UserWallet</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• userId (FK → User)</li>
                <li>• address</li>
                <li>• blockchain</li>
                <li>• isPrimary</li>
                <li>• balance</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-blue-50">
              <h4 className="font-semibold text-blue-800">UserSubscription</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• userId (FK → User)</li>
                <li>• plan, status</li>
                <li>• stripeCustomerId</li>
                <li>• currentPeriodEnd</li>
                <li>• features</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-blue-50">
              <h4 className="font-semibold text-blue-800">UserSecuritySettings</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• userId (FK → User)</li>
                <li>• twoFactorEnabled</li>
                <li>• sessionTimeout</li>
                <li>• securityScore</li>
                <li>• deviceWhitelist</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Airdrop Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">🎯 Airdrop Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded p-3 bg-green-50">
              <h4 className="font-semibold text-green-800">Airdrop</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• title, slug (Unique)</li>
                <li>• projectId (FK → Project)</li>
                <li>• status, type</li>
                <li>• startDate, endDate</li>
                <li>• totalAmount</li>
                <li>• participantsCount</li>
                <li>• trustScore</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-green-50">
              <h4 className="font-semibold text-green-800">Project</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• name, slug (Unique)</li>
                <li>• category, blockchain</li>
                <li>• trustScore</li>
                <li>• verificationStatus</li>
                <li>• isScam</li>
                <li>• socialLinks</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-green-50">
              <h4 className="font-semibold text-green-800">Token</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• projectId (FK → Project)</li>
                <li>• symbol, name</li>
                <li>• contractAddress</li>
                <li>• price, marketCap</li>
                <li>• totalSupply</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-green-50">
              <h4 className="font-semibold text-green-800">AirdropRequirement</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• airdropId (FK → Airdrop)</li>
                <li>• type, title</li>
                <li>• description</li>
                <li>• points, isRequired</li>
                <li>• parameters</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-green-50">
              <h4 className="font-semibold text-green-800">UserAirdropParticipation</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• userId, airdropId (FK)</li>
                <li>• walletAddress</li>
                <li>• status</li>
                <li>• rewardAmount</li>
                <li>• rewardClaimed</li>
                <li>• referralCode</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-green-50">
              <h4 className="font-semibold text-green-800">AirdropMetrics</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• airdropId (FK → Airdrop)</li>
                <li>• date</li>
                <li>• totalParticipants</li>
                <li>• engagementRate</li>
                <li>• conversionRate</li>
                <li>• revenue, cost</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shilling Marketplace Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-600">💰 Shilling Marketplace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded p-3 bg-purple-50">
              <h4 className="font-semibold text-purple-800">ShillingCampaign</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• title, description</li>
                <li>• creatorId (FK → User)</li>
                <li>• budget, status</li>
                <li>• rewardPerAction</li>
                <li>• maxParticipants</li>
                <li>• escrowEnabled</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-purple-50">
              <h4 className="font-semibold text-purple-800">ShillingParticipation</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• campaignId (FK)</li>
                <li>• participantId (FK)</li>
                <li>• status</li>
                <li>• earnings</li>
                <li>• rating, review</li>
                <li>• workSubmitted</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-purple-50">
              <h4 className="font-semibold text-purple-800">ShillingPayment</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• campaignId (FK)</li>
                <li>• participantId (FK)</li>
                <li>• amount, status</li>
                <li>• paymentMethod</li>
                <li>• transactionHash</li>
                <li>• paidAt</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">🛡️ Security Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded p-3 bg-red-50">
              <h4 className="font-semibold text-red-800">ScamReport</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• reporterId (FK → User)</li>
                <li>• reportType, severity</li>
                <li>• title, description</li>
                <li>• status, verified</li>
                <li>• riskScore</li>
                <li>• evidence</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-red-50">
              <h4 className="font-semibold text-red-800">SecurityAlert</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• type, severity</li>
                <li>• title, message</li>
                <li>• targetAudience</li>
                <li>• isActive</li>
                <li>• actionRequired</li>
                <li>• expiresAt</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-red-50">
              <h4 className="font-semibold text-red-800">AuditReport</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• auditorId (FK → User)</li>
                <li>• targetType, auditType</li>
                <li>• overallScore</li>
                <li>• findings</li>
                <li>• riskLevel</li>
                <li>• publicReport</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">📊 Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded p-3 bg-orange-50">
              <h4 className="font-semibold text-orange-800">UserActivityLog</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• userId (FK → User)</li>
                <li>• action, resource</li>
                <li>• metadata</li>
                <li>• ipAddress</li>
                <li>• sessionId</li>
                <li>• success</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-orange-50">
              <h4 className="font-semibold text-orange-800">UserNotification</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• userId (FK → User)</li>
                <li>• type, title</li>
                <li>• message</li>
                <li>• isRead, priority</li>
                <li>• actionUrl</li>
                <li>• expiresAt</li>
              </ul>
            </div>
            <div className="border rounded p-3 bg-orange-50">
              <h4 className="font-semibold text-orange-800">MarketData</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>• id (PK)</li>
                <li>• symbol, name</li>
                <li>• price, marketCap</li>
                <li>• volume24h</li>
                <li>• priceChange24h</li>
                <li>• source</li>
                <li>• timestamp</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relationships Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-indigo-600">🔗 Key Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold">User Relationships</h5>
              <p>1 → N: User → UserWallet, UserPreferences, UserSubscription, UserSecuritySettings</p>
              <p>1 → N: User → UserAirdropParticipation, UserActivityLog, UserNotification</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold">Airdrop Relationships</h5>
              <p>1 → N: Project → Airdrop, Token</p>
              <p>1 → N: Airdrop → AirdropRequirement, UserAirdropParticipation, AirdropMetrics</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h5 className="font-semibold">Marketplace Relationships</h5>
              <p>1 → N: User → ShillingCampaign (as creator)</p>
              <p>1 → N: ShillingCampaign → ShillingParticipation, ShillingPayment</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h5 className="font-semibold">Security Relationships</h5>
              <p>1 → N: User → ScamReport (as reporter), AuditReport (as auditor)</p>
              <p>1 → N: Airdrop → ScamReport, SecurityAlert</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-teal-600">⚡ Performance & Scalability Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold mb-2">Indexing Strategy</h5>
              <ul className="space-y-1">
                <li>• Composite indexes on frequently queried columns</li>
                <li>• Time-based indexes for analytics queries</li>
                <li>• Unique constraints for data integrity</li>
                <li>• Partial indexes for active records</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Scalability Design</h5>
              <ul className="space-y-1">
                <li>• Horizontal partitioning by date for analytics</li>
                <li>• Read replicas for reporting queries</li>
                <li>• JSON columns for flexible metadata</li>
                <li>• Soft deletes for data retention</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Data Types Optimization</h5>
              <ul className="space-y-1">
                <li>• Decimal for financial data</li>
                <li>• Array for multi-value fields</li>
                <li>• JSON for flexible schemas</li>
                <li>• Timestamp with timezone</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Caching Strategy</h5>
              <ul className="space-y-1">
                <li>• User sessions and preferences</li>
                <li>• Active airdrop listings</li>
                <li>• Market data and prices</li>
                <li>• Analytics aggregations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DropIQERD;