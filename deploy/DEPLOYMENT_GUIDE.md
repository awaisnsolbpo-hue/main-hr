# HR Application Deployment Guide

This guide explains how to deploy the HR application on your server.

## Server Details
- **IP Address**: 45.58.38.173
- **SSH Port**: 1122
- **Username**: root

## Prerequisites

- Ubuntu/Debian server
- SSH access
- Your Supabase credentials
- Your OpenAI API key (for chatbot)

---

## Step 1: Prepare Environment Files Locally

### Frontend (.env.production)

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=http://45.58.38.173/api
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
VITE_VAPI_PUBLIC_KEY=b20ebfed-ff48-43f9-a287-84b64f553d14
```

### Backend (.env)

Prepare `backend/.env` with production values:

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://45.58.38.173
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
VAPI_PUBLIC_KEY=b20ebfed-ff48-43f9-a287-84b64f553d14
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Step 2: Build Frontend Locally

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already)
npm install

# Build for production
npm run build
```

This creates a `dist` folder with the production build.

---

## Step 3: Connect to Server

```powershell
# Connect via SSH (custom port 1122)
ssh -p 1122 root@45.58.38.173
```

Enter password: `BfxYS28PrBwd5Jy3`

---

## Step 4: Initial Server Setup

On the server, run:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install required packages
apt-get install -y curl wget git build-essential nginx

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

## Step 5: Transfer Files to Server

Open a **new PowerShell window** locally:

```powershell
# Navigate to your project folder
cd "C:\Users\Mark Edward\Desktop\main-hr-main"

# Transfer backend folder (excluding node_modules)
scp -P 1122 -r backend/src backend/package.json backend/package-lock.json root@45.58.38.173:/var/www/hr-app/backend/

# Transfer frontend dist folder
scp -P 1122 -r frontend/dist root@45.58.38.173:/var/www/hr-app/frontend/

# Transfer deploy folder
scp -P 1122 -r deploy root@45.58.38.173:/var/www/hr-app/

# Transfer backend .env file (after creating it)
scp -P 1122 backend/.env root@45.58.38.173:/var/www/hr-app/backend/
```

---

## Step 6: Install Dependencies on Server

SSH into server and run:

```bash
cd /var/www/hr-app/backend
npm install --production
```

---

## Step 7: Configure Nginx

```bash
# Copy nginx configuration
cp /var/www/hr-app/deploy/nginx.conf /etc/nginx/sites-available/hr-app

# Create symlink
ln -sf /etc/nginx/sites-available/hr-app /etc/nginx/sites-enabled/hr-app

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart nginx
systemctl restart nginx
```

---

## Step 8: Start Backend with PM2

```bash
cd /var/www/hr-app

# Start the backend
pm2 start deploy/ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
pm2 save
```

---

## Step 9: Verify Deployment

- **Frontend**: http://45.58.38.173
- **Backend Health**: http://45.58.38.173/health
- **API**: http://45.58.38.173/api

---

## Quick Commands Reference

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs hr-backend     # View logs
pm2 restart hr-backend  # Restart backend
pm2 stop hr-backend     # Stop backend
pm2 delete hr-backend   # Remove from PM2
```

### Nginx Commands
```bash
systemctl status nginx  # Check status
systemctl restart nginx # Restart
systemctl reload nginx  # Reload config
nginx -t                # Test config
```

### Log Files
```bash
# PM2 logs
tail -f /var/log/hr-app/backend-out.log
tail -f /var/log/hr-app/backend-error.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Updating the Application

### Update Frontend
```powershell
# Locally: rebuild
cd frontend
npm run build

# Transfer new dist
scp -P 1122 -r frontend/dist root@45.58.38.173:/var/www/hr-app/frontend/
```

### Update Backend
```powershell
# Transfer updated files
scp -P 1122 -r backend/src root@45.58.38.173:/var/www/hr-app/backend/

# On server: restart
pm2 restart hr-backend
```

---

## Troubleshooting

### Backend not responding
```bash
pm2 logs hr-backend    # Check logs
pm2 restart hr-backend # Try restart
```

### Nginx errors
```bash
nginx -t                          # Test config
tail -f /var/log/nginx/error.log  # Check errors
```

### Port already in use
```bash
lsof -i :3001   # Check what's using port
kill -9 <PID>   # Kill process
pm2 restart hr-backend
```

### CORS issues
- Ensure `FRONTEND_URL` in backend `.env` matches your domain
- Check nginx is passing correct headers

---

## Security Recommendations

1. **Change default passwords**
2. **Setup SSL certificate** (Let's Encrypt):
   ```bash
   apt-get install certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com
   ```
3. **Configure firewall**:
   ```bash
   ufw allow ssh
   ufw allow 'Nginx Full'
   ufw allow 1122/tcp
   ufw enable
   ```
4. **Disable root login** (create new user first)
5. **Setup fail2ban** for brute force protection

