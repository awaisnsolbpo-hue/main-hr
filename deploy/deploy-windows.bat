@echo off
REM HR Application Deployment Script for Windows
REM This script builds the frontend and provides instructions

echo =============================================
echo HR Application Deployment Helper (Windows)
echo =============================================
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ERROR: Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/4] Checking for frontend .env.production...
if not exist "frontend\.env.production" (
    echo ERROR: frontend\.env.production not found!
    echo Please create it with your Supabase credentials first.
    echo See deploy\frontend.env.example for template.
    pause
    exit /b 1
)

echo [2/4] Building frontend for production...
cd frontend
call npm install
call npm run build
cd ..

if not exist "frontend\dist\index.html" (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Frontend built successfully!
echo.
echo =============================================
echo NEXT STEPS - Run these commands manually:
echo =============================================
echo.
echo 1. Connect to server:
echo    ssh -p 1122 root@45.58.38.173
echo    Password: BfxYS28PrBwd5Jy3
echo.
echo 2. On the server, run initial setup (first time only):
echo    apt-get update ^&^& apt-get upgrade -y
echo    apt-get install -y curl nginx
echo    curl -fsSL https://deb.nodesource.com/setup_20.x ^| bash -
echo    apt-get install -y nodejs
echo    npm install -g pm2
echo    mkdir -p /var/www/hr-app /var/log/hr-app
echo.
echo 3. Open NEW terminal and transfer files using SCP:
echo.
echo    REM Transfer backend:
echo    scp -P 1122 -r backend\src backend\package.json backend\package-lock.json root@45.58.38.173:/var/www/hr-app/backend/
echo.
echo    REM Transfer frontend dist:
echo    scp -P 1122 -r frontend\dist root@45.58.38.173:/var/www/hr-app/frontend/
echo.
echo    REM Transfer deploy folder:
echo    scp -P 1122 -r deploy root@45.58.38.173:/var/www/hr-app/
echo.
echo    REM Create and transfer backend .env (edit with your credentials first):
echo    scp -P 1122 backend\.env root@45.58.38.173:/var/www/hr-app/backend/
echo.
echo 4. On server, complete deployment:
echo    cd /var/www/hr-app/backend ^&^& npm install --production
echo    cp /var/www/hr-app/deploy/nginx.conf /etc/nginx/sites-available/hr-app
echo    ln -sf /etc/nginx/sites-available/hr-app /etc/nginx/sites-enabled/hr-app
echo    rm -f /etc/nginx/sites-enabled/default
echo    nginx -t ^&^& systemctl restart nginx
echo    cd /var/www/hr-app ^&^& pm2 start deploy/ecosystem.config.cjs
echo    pm2 save ^&^& pm2 startup
echo.
echo =============================================
echo Your app will be available at:
echo Frontend: http://45.58.38.173
echo API: http://45.58.38.173/api
echo Health: http://45.58.38.173/health
echo =============================================
echo.
pause

