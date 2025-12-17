@echo off
echo ===================================
echo HR Application - Project Restructure
echo ===================================
echo.

echo This script will reorganize the project into:
echo   - frontend/ folder (React app)
echo   - backend/ folder (Express API)
echo.

echo WARNING: This will move files around!
echo Make sure you have a backup or git commit.
echo.

pause

echo.
echo [1/6] Creating folders...
if not exist frontend mkdir frontend
if not exist backend mkdir backend
echo Done!

echo.
echo [2/6] Moving frontend files...
if exist src move src frontend\
if exist public move public frontend\
if exist index.html move index.html frontend\
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
echo [3/6] Moving frontend dependencies...
if exist package.json move package.json frontend\
if exist package-lock.json move package-lock.json frontend\
if exist node_modules move node_modules frontend\
if exist bun.lockb move bun.lockb frontend\
echo Done!

echo.
echo [4/6] Moving android folder (if exists)...
if exist android move android frontend\
echo Done!

echo.
echo [5/6] Renaming server to backend...
if exist server (
    echo Renaming server folder...
    move server backend
    echo Done!
) else (
    echo Server folder not found - skipping
)

echo.
echo [6/6] Moving environment files...
if exist .env move .env frontend\.env
if exist .env.example copy .env.example frontend\.env.example
echo Done!

echo.
echo ===================================
echo Creating root package.json...
echo ===================================
if exist package.json.root (
    move package.json.root package.json
    echo Root package.json created!
) else (
    echo Warning: package.json.root not found
    echo You'll need to create it manually
)

echo.
echo ===================================
echo Restructure Complete!
echo ===================================
echo.
echo Next steps:
echo   1. Verify frontend/ and backend/ folders
echo   2. Run: npm install (in root)
echo   3. Configure frontend/.env
echo   4. Configure backend/.env
echo   5. Run: npm run dev
echo.

pause
