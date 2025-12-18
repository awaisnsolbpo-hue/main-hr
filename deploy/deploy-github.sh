#!/bin/bash

# HR Application Deployment Script (GitHub-based)
# Run this on the server to deploy from GitHub

set -e

echo "======================================"
echo "HR App Deployment from GitHub"
echo "======================================"

APP_DIR="/var/www/hr-app"
LOG_DIR="/var/log/hr-app"
REPO_URL="${1:-https://github.com/YOUR_USERNAME/YOUR_REPO.git}"
BRANCH="${2:-main}"

# Create directories
echo "Creating directories..."
mkdir -p $APP_DIR
mkdir -p $LOG_DIR

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

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    apt-get install -y git
fi

# Clone or pull repository
cd $APP_DIR

if [ -d ".git" ]; then
    echo "Pulling latest changes from GitHub..."
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "Cloning repository from GitHub..."
    cd /var/www
    rm -rf hr-app
    git clone --branch $BRANCH $REPO_URL hr-app
    cd $APP_DIR
fi

# Preserve .env files if they exist
echo "Checking environment files..."

# Setup Backend
echo "Setting up backend..."
cd $APP_DIR/backend

if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  WARNING: Backend .env file not found!"
    echo "Please create /var/www/hr-app/backend/.env"
    echo ""
fi

echo "Installing backend dependencies..."
npm install --production

# Setup Frontend
echo "Setting up frontend..."
cd $APP_DIR/frontend

if [ ! -f ".env.production" ]; then
    echo ""
    echo "⚠️  WARNING: Frontend .env.production file not found!"
    echo "Creating from example..."
    if [ -f "$APP_DIR/deploy/frontend.env.example" ]; then
        cp $APP_DIR/deploy/frontend.env.example .env.production
        echo "Please edit /var/www/hr-app/frontend/.env.production with your credentials"
    fi
fi

echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

# Configure Nginx
echo "Configuring Nginx..."
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/hr-app
ln -sf /etc/nginx/sites-available/hr-app /etc/nginx/sites-enabled/hr-app
rm -f /etc/nginx/sites-enabled/default

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
pm2 startup systemd -u root --hp /root 2>/dev/null || true
pm2 save

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "Application URL: http://45.58.38.173"
echo "Backend API: http://45.58.38.173/api"
echo "Health Check: http://45.58.38.173/health"
echo ""

