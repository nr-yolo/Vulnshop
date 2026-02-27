#!/bin/bash

echo "=================================="
echo "🚨 VulnShop Setup Script 🚨"
echo "=================================="
echo ""
echo "⚠️  WARNING: This application is INTENTIONALLY VULNERABLE"
echo "⚠️  FOR SECURITY TRAINING PURPOSES ONLY"
echo ""
read -p "Do you understand and wish to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo ""
echo "🗄️  Initializing database..."
npm run init-db

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Terminal 1: cd backend && npm start"
echo "  2. Terminal 2: cd frontend && npm start"
echo ""
echo "🔐 Default admin credentials: admin/admin"
echo "📚 See README.md for vulnerability documentation"
echo ""
