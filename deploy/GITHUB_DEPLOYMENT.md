# GitHub-Based Deployment Guide

Deploy your HR application using GitHub for easy updates and version control.

---

## Prerequisites

1. GitHub account
2. Your code pushed to a GitHub repository
3. Server access (45.58.38.173)

---

## Step 1: Push Code to GitHub

### Initialize Git (if not already done)

```powershell
cd "C:\Users\Mark Edward\Desktop\main-hr-main"

# Initialize git
git init

# Create .gitignore
```

### Create `.gitignore` file

Make sure these files are NOT pushed to GitHub:

```gitignore
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment files (contain secrets!)
.env
.env.local
.env.production
frontend/.env
frontend/.env.production
backend/.env

# Build output
frontend/dist/

# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### Push to GitHub

```powershell
# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repo (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/hr-app.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## Step 2: Initial Server Setup

Connect to your server:

```powershell
ssh -p 1122 root@45.58.38.173
# Password: BfxYS28PrBwd5Jy3
```

Run initial setup:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install required packages
apt-get install -y curl nginx git

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Create directories
mkdir -p /var/www/hr-app
mkdir -p /var/log/hr-app
```

---

## Step 3: Clone Repository on Server

```bash
cd /var/www

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/hr-app.git hr-app

cd hr-app
```

---

## Step 4: Create Environment Files on Server

### Backend .env

```bash
nano /var/www/hr-app/backend/.env
```

Add:
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://45.58.38.173
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
VAPI_PUBLIC_KEY=b20ebfed-ff48-43f9-a287-84b64f553d14
OPENAI_API_KEY=your_openai_api_key_here
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Frontend .env.production

```bash
nano /var/www/hr-app/frontend/.env.production
```

Add:
```env
VITE_API_BASE_URL=http://45.58.38.173/api
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
VITE_VAPI_PUBLIC_KEY=b20ebfed-ff48-43f9-a287-84b64f553d14
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 5: Deploy Application

```bash
cd /var/www/hr-app

# Make deploy script executable
chmod +x deploy/deploy-github.sh

# Run deployment (builds frontend, installs deps, configures nginx, starts PM2)
./deploy/deploy-github.sh
```

---

## Step 6: Verify Deployment

- **Frontend**: http://45.58.38.173
- **API Health**: http://45.58.38.173/health

---

## 🔄 Updating the Application

### From Local Machine

1. Make your changes
2. Commit and push:
   ```powershell
   git add .
   git commit -m "Your update message"
   git push
   ```

### On Server

```bash
cd /var/www/hr-app

# Pull latest changes
git pull origin main

# Rebuild frontend
cd frontend && npm install && npm run build && cd ..

# Restart backend
pm2 restart hr-backend
```

### Quick Update Script

Create a simple update script on the server:

```bash
nano /var/www/hr-app/update.sh
```

Add:
```bash
#!/bin/bash
cd /var/www/hr-app
git pull origin main
cd frontend && npm install && npm run build && cd ..
cd backend && npm install --production && cd ..
pm2 restart hr-backend
echo "✅ Update complete!"
```

Make executable:
```bash
chmod +x /var/www/hr-app/update.sh
```

Now you can update with just:
```bash
/var/www/hr-app/update.sh
```

---

## 🔐 Using Private Repository

If your repo is private, you'll need to authenticate:

### Option 1: Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` access
3. Clone using:
   ```bash
   git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/hr-app.git hr-app
   ```

### Option 2: SSH Key

1. On server, generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "server@45.58.38.173"
   cat ~/.ssh/id_ed25519.pub
   ```
2. Add the public key to GitHub → Settings → SSH Keys
3. Clone using SSH URL:
   ```bash
   git clone git@github.com:YOUR_USERNAME/hr-app.git hr-app
   ```

---

## Useful Commands

```bash
# Check deployment status
pm2 status

# View logs
pm2 logs hr-backend

# Restart backend
pm2 restart hr-backend

# Check nginx
systemctl status nginx

# Pull latest code
cd /var/www/hr-app && git pull

# Full redeploy
cd /var/www/hr-app && ./deploy/deploy-github.sh
```

