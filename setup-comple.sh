#!/bin/bash

echo "🧹 Complete setup for Personal Finance Tracker..."

# Clean up any existing files
echo "🗑️ Cleaning up old files..."
rm -rf node_modules server/node_modules
rm -f package-lock.json server/package-lock.json yarn.lock pnpm-lock.yaml
rm -rf .next server/.next

# Create environment files
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
fi

if [ ! -f server/.env ]; then
    echo "📝 Creating server/.env file..."
    cat > server/.env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_tracker
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
EOF
fi

# Install dependencies with all required packages
echo "📦 Installing frontend dependencies (this may take a few minutes)..."
npm install

echo "📦 Installing backend dependencies..."
cd server && npm install && cd ..

# Test build to make sure everything works
echo "🔨 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Setup complete!"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "🚀 Ready to start!"
echo ""
echo "1. Start database services:"
echo "   npm run docker:services"
echo ""
echo "2. Start backend (new terminal):"
echo "   npm run dev:backend"
echo ""
echo "3. Start frontend (new terminal):"
echo "   npm run dev:frontend"
echo ""
echo "4. Open http://localhost:3000"
echo ""
echo "📊 Demo accounts:"
echo "   Admin: admin@demo.com / admin123"
echo "   User: user@demo.com / user123"
echo "   Read-only: readonly@demo.com / readonly123"
