import { db } from '@/lib/db';

async function createSampleCampaigns() {
  try {
    // Find or create sample airdrops
    const airdrops = await db.airdrop.findMany({
      take: 3,
      where: { status: 'approved' },
    });

    if (airdrops.length === 0) {
      console.log('No approved airdrops found. Please create some airdrops first.');
      return;
    }

    // Create sample campaigns
    const campaigns = [
      {
        airdropId: airdrops[0].id,
        tier: 'premium',
        amount: 5000, // $50
        currency: 'usd',
        status: 'approved',
        paymentStatus: 'paid',
        stripeSessionId: 'cs_test_premium_' + Date.now(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        submittedBy: 'premium@example.com',
        approvedAt: new Date(),
        approvedBy: 'admin',
      },
      {
        airdropId: airdrops[1]?.id || airdrops[0].id,
        tier: 'standard',
        amount: 2500, // $25
        currency: 'usd',
        status: 'approved',
        paymentStatus: 'paid',
        stripeSessionId: 'cs_test_standard_' + Date.now(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        submittedBy: 'standard@example.com',
        approvedAt: new Date(),
        approvedBy: 'admin',
      },
      {
        airdropId: airdrops[2]?.id || airdrops[0].id,
        tier: 'basic',
        amount: 1000, // $10
        currency: 'usd',
        status: 'approved',
        paymentStatus: 'paid',
        stripeSessionId: 'cs_test_basic_' + Date.now(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        submittedBy: 'basic@example.com',
        approvedAt: new Date(),
        approvedBy: 'admin',
      },
    ];

    for (const campaignData of campaigns) {
      // Check if campaign already exists
      const existing = await db.campaign.findFirst({
        where: { airdropId: campaignData.airdropId },
      });

      if (!existing) {
        const campaign = await db.campaign.create({
          data: campaignData,
        });
        console.log(`Created sample campaign: ${campaign.id} (${campaign.tier})`);
      } else {
        console.log(`Campaign already exists for airdrop: ${campaignData.airdropId}`);
      }
    }

    console.log('Sample campaigns created successfully!');
  } catch (error) {
    console.error('Error creating sample campaigns:', error);
  }
}

// Run the script
createSampleCampaigns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });