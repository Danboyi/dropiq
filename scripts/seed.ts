#!/usr/bin/env tsx

import { seedSampleData } from '../src/lib/seed-data';

async function main() {
  try {
    console.log('🌱 Starting to seed sample data...');
    await seedSampleData();
    console.log('✅ Sample data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

main();