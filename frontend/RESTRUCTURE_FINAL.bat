@echo off
echo ========================================================
echo HR Application - Complete Project Restructure
echo ========================================================
echo.
echo This will reorganize your project into:
echo   frontend/  - React + Vite app (with VAPI integration)
echo   backend/   - Express API server
echo.
echo Current issues being fixed:
echo   - 'server' folder exists (should be 'backend')
echo   - Frontend files mixed in root
echo   - Need clean separation
echo.
echo ========================================================
echo WARNING: This will move files!
echo ========================================================
echo.
echo RECOMMENDED: Create backup first:
echo   git add .
echo   git commit -m "Before restructure"
echo.
pause

echo.
echo [Step 1/8] Creating folder structure...
if not exist frontend mkdir frontend
if not exist backend mkdir backend
echo Done!

echo.
echo [Step 2/8] Moving frontend SOURCE files...
if exist src (
    echo   - Moving src/
    move src frontend\src
)
if exist public (
    echo   - Moving public/
    move public frontend\public
)
if exist index.html (
    echo   - Moving index.html
    move index.html frontend\index.html
)
echo Done!

echo.
echo [Step 3/8] Moving frontend CONFIG files...
if exist vite.config.ts move vite.config.ts frontend\
if exist tsconfig.json move tsconfig.json frontend\
if exist tsconfig.app.json move tsconfig.app.json frontend\
if exist tsconfig.node.json move tsconfig.node.json frontend\
if exist tailwind.config.ts move tailwind.config.ts frontend\
if exist postcss.config.js move postcss.config.js frontend\
if exist eslint.config.js move eslint.config.js frontend\
if exist components.json move components.json frontend\
if exist vitest.config.ts move vitest.config.ts frontend\
if exist capacitor.config.ts move capacitor.config.ts frontend\
echo Done!

echo.
echo [Step 4/8] Moving frontend DEPENDENCIES...
if exist package.json (
    echo   - Moving package.json
    move package.json frontend\package.json
)
if exist package-lock.json (
    echo   - Moving package-lock.json
    move package-lock.json frontend\package-lock.json
)
if exist node_modules (
    echo   - Moving node_modules (this may take a moment...)
    move node_modules frontend\node_modules
)
if exist bun.lockb move bun.lockb frontend\
echo Done!

echo.
echo [Step 5/8] Moving Android/Capacitor files...
if exist android (
    echo   - Moving android folder
    move android frontend\android
)
echo Done!

echo.
echo [Step 6/8] Handling backend folder...
if exist server (
    if exist backend (
        echo   ERROR: Both 'server' and 'backend' folders exist!
        echo   Please manually merge or delete one.
        pause
    ) else (
        echo   - Renaming 'server' to 'backend'
        ren server backend
    )
) else (
    if exist backend (
        echo   - Backend folder already exists
    ) else (
        echo   WARNING: No server or backend folder found!
        echo   You'll need to create backend manually
    )
)
echo Done!

echo.
echo [Step 7/8] Setting up environment files...
if exist .env (
    echo   - Copying .env to frontend/.env
    copy .env frontend\.env
    echo   - Deleting root .env
    del .env
)

if exist .env.example (
    echo   - Copying .env.example to frontend/.env.example
    copy .env.example frontend\.env.example
    echo   - Keeping root .env.example for reference
)

echo   - Checking backend environment file...
if exist backend\.env (
    echo   - backend/.env already exists
) else (
    if exist backend\.env.example (
        echo   - backend/.env.example exists (you need to configure it)
    ) else (
        echo   WARNING: backend/.env.example not found!
    )
)
echo Done!

echo.
echo [Step 8/8] Creating root package.json...
if exist package.json.root (
    echo   - Moving package.json.root to package.json
    move package.json.root package.json
    echo Done!
) else (
    echo   - Creating new root package.json...
    (
        echo {
        echo   "name": "hr-application",
        echo   "version": "1.0.0",
        echo   "description": "AI-Powered HR Application with VAPI Integration",
        echo   "private": true,
        echo   "scripts": {
        echo     "install:frontend": "cd frontend && npm install",
        echo     "install:backend": "cd backend && npm install",
        echo     "install:all": "npm run install:frontend && npm run install:backend",
        echo     "dev:frontend": "cd frontend && npm run dev",
        echo     "dev:backend": "cd backend && npm run dev",
        echo     "dev": "concurrently -n \"API,APP\" -c \"blue,green\" \"npm run dev:backend\" \"npm run dev:frontend\"",
        echo     "build:frontend": "cd frontend && npm run build",
        echo     "build:backend": "cd backend && npm run build",
        echo     "build": "npm run build:frontend && npm run build:backend",
        echo     "start": "concurrently \"npm run start:backend\" \"npm run start:frontend\""
        echo   },
        echo   "devDependencies": {
        echo     "concurrently": "^8.2.2"
        echo   }
        echo }
    ) > package.json
    echo Done!
)

echo.
echo ========================================================
echo Restructure Complete!
echo ========================================================
echo.
echo New structure:
echo   frontend/
echo   ├── src/          (React app with VAPI integration)
echo   ├── public/
echo   ├── .env
echo   └── package.json
echo.
echo   backend/
echo   ├── src/          (Express API)
echo   ├── .env
echo   └── package.json
echo.
echo   package.json      (Root - manages both)
echo.
echo ========================================================
echo NEXT STEPS:
echo ========================================================
echo.
echo 1. Install root dependencies:
echo    npm install
echo.
echo 2. Install frontend dependencies:
echo    cd frontend
echo    npm install
echo    cd ..
echo.
echo 3. Install backend dependencies:
echo    cd backend
echo    npm install
echo    cd ..
echo.
echo 4. Configure frontend/.env:
echo    - VITE_SUPABASE_URL
echo    - VITE_SUPABASE_PUBLISHABLE_KEY
echo    - VITE_API_BASE_URL=http://localhost:3001/api
echo.
echo 5. Configure backend/.env:
echo    - PORT=3001
echo    - SUPABASE_URL
echo    - SUPABASE_SERVICE_ROLE_KEY
echo    - FRONTEND_URL=http://localhost:5173
echo.
echo 6. Start both servers:
echo    npm run dev
echo.
echo ========================================================
echo.
pause
