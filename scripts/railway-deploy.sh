#!/bin/bash

# Railway Deployment Script for DropIQ Platform
# This script handles database migrations and seeding for Railway deployments

set -e

echo "🚀 Starting Railway deployment process..."

# Check if we're in Railway environment
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "✅ Detected Railway environment"
    
    # Generate Prisma client
    echo "📦 Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    echo "🗄️ Running database migrations..."
    npx prisma db push --accept-data-loss
    
    # Seed the database
    echo "🌱 Seeding database..."
    npm run db:seed
    
    echo "✅ Railway deployment setup complete!"
else
    echo "❌ Not in Railway environment. Skipping deployment setup."
    exit 1
fi