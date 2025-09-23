#!/bin/bash

# YaYa POS System Deployment Script
set -e

echo "🚀 Starting YaYa POS System Deployment..."

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Required environment variables are not set"
    echo "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations if needed
echo "🗄️ Running database migrations..."
# Add your migration commands here

# Start the application with PM2 (if using PM2)
if command -v pm2 &> /dev/null; then
    echo "🔄 Starting application with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
else
    echo "▶️ Starting application..."
    npm start
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/api/health"