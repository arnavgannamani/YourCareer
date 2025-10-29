#!/bin/bash

# Demo script for MyCareer OVR
# Seeds 4 fixture users and displays their dashboards

echo "🎮 MyCareer OVR - Demo Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure your database"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
npm run db:push

echo ""
echo "🌱 Seeding demo data..."
npm run db:seed

echo ""
echo "================================"
echo "✅ Demo setup complete!"
echo ""
echo "🚀 Starting development server..."
echo ""
echo "Demo users (for testing):"
echo "1. alex.johnson@example.com - High school grad"
echo "2. sam.chen@example.com - Tier-1 intern"
echo "3. jordan.smith@example.com - Associate (promoted)"
echo "4. casey.williams@example.com - Dormant user"
echo ""
echo "Open http://localhost:3000 in your browser"
echo ""

npm run dev

