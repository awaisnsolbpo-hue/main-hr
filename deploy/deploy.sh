#!/bin/bash

# HR Application Deployment Script
# This script should be run on the server after transferring the files

set -e

echo "======================================"
echo "HR Application Deployment Script"
echo "======================================"

APP_DIR="/var/www/hr-app"
LOG_DIR="/var/log/hr-app"

# Create directories
echo "Creating directories..."
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
mkdir -p $APP_DIR/backend
mkdir -p $APP_DIR/frontend

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Navigate to app directory
cd $APP_DIR

# Setup Backend
echo "Setting up backend..."
cd $APP_DIR/backend

if [ -f "package.json" ]; then
    echo "Installing backend dependencies..."
    npm install --production
else
    echo "ERROR: Backend package.json not found!"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "WARNING: Backend .env file not found!"
    echo "Please create /var/www/hr-app/backend/.env with your environment variables"
fi

# Setup Frontend
echo "Setting up frontend..."
cd $APP_DIR/frontend

if [ -d "dist" ]; then
    echo "Frontend build found!"
else
    echo "ERROR: Frontend dist folder not found!"
    echo "Please build the frontend locally and transfer the dist folder"
    exit 1
fi

# Configure Nginx
echo "Configuring Nginx..."
if [ -f "/etc/nginx/sites-available/hr-app" ]; then
    rm /etc/nginx/sites-available/hr-app
fi

if [ -f "/etc/nginx/sites-enabled/hr-app" ]; then
    rm /etc/nginx/sites-enabled/hr-app
fi

cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/hr-app
ln -sf /etc/nginx/sites-available/hr-app /etc/nginx/sites-enabled/hr-app

# Remove default nginx site if exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test and reload Nginx
echo "Testing Nginx configuration..."
nginx -t

echo "Reloading Nginx..."
systemctl reload nginx

# Start/Restart Backend with PM2
echo "Starting backend with PM2..."
cd $APP_DIR
pm2 delete hr-backend 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

# Setup PM2 to start on boot
echo "Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root
pm2 save

echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Application URL: http://45.58.38.173"
echo "Backend API: http://45.58.38.173/api"
echo "Health Check: http://45.58.38.173/health"
echo ""
echo "Useful commands:"
echo "  pm2 logs hr-backend     - View backend logs"
echo "  pm2 restart hr-backend  - Restart backend"
echo "  pm2 status              - Check PM2 status"
echo "  systemctl status nginx  - Check Nginx status"
echo ""

