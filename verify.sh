#!/bin/bash

# MindVault Deployment Verification Script

echo "🔍 MINDVAULT DEPLOYMENT VERIFICATION"
echo "======================================"
echo ""

# Check if files exist
echo "✅ Checking files..."

if [ -f "backend/vercel.json" ]; then
    echo "  ✓ backend/vercel.json exists"
else
    echo "  ✗ backend/vercel.json missing!"
fi

if [ -f "backend/.env" ]; then
    echo "  ✓ backend/.env exists"
else
    echo "  ✗ backend/.env missing!"
fi

if [ -f "frontend/.env.production" ]; then
    echo "  ✓ frontend/.env.production exists"
else
    echo "  ✗ frontend/.env.production missing!"
fi

if [ -f "vercel.json" ]; then
    echo "  ✓ root vercel.json exists"
else
    echo "  ✗ root vercel.json missing!"
fi

echo ""
echo "📦 Checking dependencies..."
if [ -d "backend/node_modules" ]; then
    echo "  ✓ Backend dependencies installed"
else
    echo "  ⚠ Backend dependencies not installed. Run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo "  ✓ Frontend dependencies installed"
else
    echo "  ⚠ Frontend dependencies not installed. Run: cd frontend && npm install"
fi

echo ""
echo "🔧 Checking TypeScript files..."
if [ -f "backend/src/app.ts" ]; then
    echo "  ✓ backend/src/app.ts exists"
else
    echo "  ✗ backend/src/app.ts missing!"
fi

if [ -f "frontend/src/App.tsx" ]; then
    echo "  ✓ frontend/src/App.tsx exists"
else
    echo "  ✗ frontend/src/App.tsx missing!"
fi

echo ""
echo "📋 DEPLOYMENT CHECKLIST:"
echo "========================"
echo ""
echo "□ 1. MongoDB Atlas cluster created"
echo "□ 2. MongoDB connection string obtained"
echo "□ 3. Backend deployed to Vercel with env vars:"
echo "      - JWT_SECRET"
echo "      - MONGODB_URI"
echo "      - NODE_ENV=production"
echo "□ 4. Backend URL copied"
echo "□ 5. Frontend deployed to Vercel with env var:"
echo "      - VITE_API_URL=<backend-url>"
echo "□ 6. Tested signup/login on production"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Setup MongoDB Atlas (see ULTRA_QUICK_DEPLOY.md)"
echo "2. Deploy to Vercel (see COMPLETE_DEPLOYMENT_GUIDE.md)"
echo ""
