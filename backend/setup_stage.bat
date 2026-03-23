@echo off
setlocal enabledelayedexpansion

echo ==================================================
echo   XION 2026 — STAGE SETUP UTILITY
echo ==================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b
)
echo [OK] Python detected.

:: 2. Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b
)
echo [OK] Node.js detected.

:: 3. Install Python Dependencies
echo.
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b
)

:: 4. Install Frontend Dependencies
echo.
echo [2/4] Installing Node dependencies...
cd ..
npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b
)

:: 5. Build Project
echo.
echo [3/4] Building production bundle...
npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b
)

:: 6. Success
echo.
echo ==================================================
echo   SETUP COMPLETE! 
echo ==================================================
echo.
echo To start the demo:
echo 1. Run start_backend.bat (in this folder)
echo 2. Open index.html in Chrome (from dist/ folder) or run 'npm run preview'
echo.
pause
