-- Seed data for DropIQ platform

-- Insert sample airdrops
INSERT INTO "airdrops" (
  "id", "name", "description", "logoUrl", "websiteUrl", "status", "category", "blockchain", 
  "requirements", "eligibility", "riskScore", "riskLevel", "startDate", "endDate", 
  "totalSupply", "tokenSymbol", "vestingPeriod", "twitterHandle", "discordInvite", "telegramGroup"
) VALUES
(
  'arb-airdrop-1',
  'Arbitrum One Airdrop',
  'Arbitrum is distributing tokens to early users and contributors who have interacted with the network before the snapshot date.',
  'https://example.com/arbitrum-logo.png',
  'https://arbitrum.one',
  'ACTIVE',
  'Layer 2',
  'Ethereum',
  '[
    {"id": "bridge", "name": "Bridge assets to Arbitrum", "completed": false},
    {"id": "defi", "name": "Use DeFi protocols on Arbitrum", "completed": false},
    {"id": "transactions", "name": "Make at least 10 transactions", "completed": false}
  ]',
  '{
    "minTransactions": 10,
    "minValue": "$100",
    "snapshotDate": "2023-03-23"
  }',
  15,
  'LOW',
  '2023-03-23T00:00:00.000Z',
  '2023-09-23T00:00:00.000Z',
  '1000000000',
  'ARB',
  '3 months',
  '@arbitrum',
  'https://discord.gg/arbitrum',
  'https://t.me/arbitrum'
),
(
  'optimism-airdrop-1',
  'Optimism Airdrop Season 2',
  'Optimism is rewarding users who have contributed to the ecosystem through governance, usage, and development.',
  'https://example.com/optimism-logo.png',
  'https://www.optimism.io',
  'ACTIVE',
  'Layer 2',
  'Ethereum',
  '[
    {"id": "governance", "name": "Participate in governance votes", "completed": false},
    {"id": "usage", "name": "Use Optimism regularly", "completed": false},
    {"id": "bridge", "name": "Bridge assets to Optimism", "completed": false}
  ]',
  '{
    "minGovernanceVotes": 3,
    "minTransactions": 5,
    "minValue": "$50"
  }',
  20,
  'LOW',
  '2023-01-15T00:00:00.000Z',
  '2023-07-15T00:00:00.000Z',
  '500000000',
  'OP',
  '6 months',
  '@optimismFND',
  'https://discord.gg/optimism',
  'https://t.me/optimism_PBC'
),
(
  'zksync-airdrop-1',
  'zkSync Era Airdrop',
  'zkSync is distributing tokens to early adopters and users who have tested the network before the official launch.',
  'https://example.com/zksync-logo.png',
  'https://zksync.io',
  'PENDING',
  'Layer 2',
  'Ethereum',
  '[
    {"id": "testnet", "name": "Use zkSync testnet", "completed": false},
    {"id": "bridge", "name": "Bridge assets to zkSync", "completed": false},
    {"id": "defi", "name": "Use DeFi on zkSync", "completed": false}
  ]',
  '{
    "minTestnetTransactions": 5,
    "minMainnetValue": "$100",
    "earlyAdopter": true
  }',
  35,
  'MEDIUM',
  '2023-06-01T00:00:00.000Z',
  '2023-12-01T00:00:00.000Z',
  '10000000000',
  'ZK',
  '12 months',
  '@zksync',
  'https://discord.gg/zksync',
  'https://t.me/zksync'
);

-- Insert sample vetting reports
INSERT INTO "vetting_reports" (
  "id", "layer", "result", "data", "score", "summary", "risks", "rewards", "model", "airdropId"
) VALUES
(
  'arb-security-1',
  'SECURITY',
  'SAFE',
  '{
    "audits": ["Trail of Bits", "OpenZeppelin"],
    "securityScore": 95,
    "bugsFound": 0,
    "criticalIssues": 0,
    "smartContractVerified": true
  }',
  95,
  'Arbitrum has undergone multiple security audits from reputable firms and has a strong security track record.',
  ARRAY['Smart contract complexity', 'Bridge vulnerabilities'],
  ARRAY['Proven security track record', 'Multiple audits', 'Large ecosystem'],
  'GPT-4 Security Analyzer v1.0',
  'arb-airdrop-1'
),
(
  'arb-tokenomics-1',
  'TOKENOMICS',
  'SAFE',
  '{
    "totalSupply": 10000000000,
    "circulatingSupply": 1500000000,
    "tokenDistribution": {
      "community": 43,
      "team": 27,
      "investors": 19,
      "daoTreasury": 11
    },
    "inflationRate": "2%",
    "vestingPeriod": "4 years"
  }',
  88,
  'Strong tokenomics with fair distribution and reasonable vesting schedules for team and investors.',
  ARRAY['High inflation rate', 'Large investor allocation'],
  ARRAY['Fair community distribution', 'Long-term vesting', 'DAO governance'],
  'GPT-4 Tokenomics Analyzer v1.0',
  'arb-airdrop-1'
),
(
  'arb-team-1',
  'TEAM',
  'SAFE',
  '{
    "teamSize": 15,
    "experience": "High",
    "publicTeam": true,
    "doxxed": true,
    "previousProjects": ["Princeton University", "Ethereum Foundation"]
  }',
  92,
  'Experienced team with strong academic background and previous successful projects in the blockchain space.',
  ARRAY['Centralized team structure'],
  ARRAY['Strong technical expertise', 'Academic credibility', 'Ethereum Foundation experience'],
  'GPT-4 Team Analyzer v1.0',
  'arb-airdrop-1'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_wallets_address" ON "wallets"("address");
CREATE INDEX IF NOT EXISTS "idx_wallets_userId" ON "wallets"("userId");
CREATE INDEX IF NOT EXISTS "idx_airdrops_status" ON "airdrops"("status");
CREATE INDEX IF NOT EXISTS "idx_airdrops_category" ON "airdrops"("category");
CREATE INDEX IF NOT EXISTS "idx_airdrops_riskLevel" ON "airdrops"("riskLevel");
CREATE INDEX IF NOT EXISTS "idx_user_airdrop_statuses_userId" ON "user_airdrop_statuses"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_airdrop_statuses_airdropId" ON "user_airdrop_statuses"("airdropId");
CREATE INDEX IF NOT EXISTS "idx_user_airdrop_statuses_status" ON "user_airdrop_statuses"("status");
CREATE INDEX IF NOT EXISTS "idx_sessions_token" ON "sessions"("token");
CREATE INDEX IF NOT EXISTS "idx_sessions_userId" ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS "idx_sessions_expiresAt" ON "sessions"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_vetting_reports_airdropId" ON "vetting_reports"("airdropId");
CREATE INDEX IF NOT EXISTS "idx_vetting_reports_layer" ON "vetting_reports"("layer");