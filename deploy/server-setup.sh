#!/bin/bash

# Server Initial Setup Script
# Run this FIRST on a fresh Ubuntu/Debian server

set -e

echo "======================================"
echo "Server Initial Setup"
echo "======================================"

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential packages
echo "Installing essential packages..."
apt-get install -y curl wget git build-essential nginx ufw

# Install Node.js 20.x
echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node installation
node --version
npm --version

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Configure firewall
echo "Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 1122/tcp  # Custom SSH port
ufw --force enable

# Start and enable Nginx
echo "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Create application directories
echo "Creating application directories..."
mkdir -p /var/www/hr-app
mkdir -p /var/log/hr-app

# Set permissions
chown -R root:root /var/www/hr-app
chmod -R 755 /var/www/hr-app

echo "======================================"
echo "Server setup complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Transfer your application files to /var/www/hr-app"
echo "2. Create backend .env file with your credentials"
echo "3. Run the deploy.sh script"
echo ""

