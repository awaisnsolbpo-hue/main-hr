#!/bin/bash

# Quick update script - run after pushing changes to GitHub
# Usage: ./deploy/update.sh

set -e

echo "======================================"
echo "Updating HR Application from GitHub"
echo "======================================"

cd /var/www/hr-app

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Update backend
echo "Updating backend..."
cd backend
npm install --production
cd ..

# Update frontend
echo "Rebuilding frontend..."
cd frontend
npm install
npm run build
cd ..

# Restart backend
echo "Restarting backend..."
pm2 restart hr-backend

echo ""
echo "======================================"
echo "✅ Update Complete!"
echo "======================================"
pm2 status

