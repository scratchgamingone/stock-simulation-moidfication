@echo off
SETLOCAL EnableDelayedExpansion
title Stockmarket Simulation - Setup and Run

echo ============================================
echo Stockmarket Simulation - Setup and Run
echo ============================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from: https://nodejs.org/
    echo Recommended: Node.js v18 LTS, v20 LTS, or v22+
    echo After installation, restart this script.
    echo.
    pause
    exit /b 1
)

REM Display Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js !NODE_VERSION! is installed

REM Extract major version number
for /f "tokens=1 delims=." %%a in ("!NODE_VERSION:v=!") do set NODE_MAJOR=%%a

REM Check if Node.js version is supported
if !NODE_MAJOR! LSS 16 (
    echo ERROR: Node.js v!NODE_MAJOR! is too old!
    echo This project requires Node.js v16 or higher.
    echo Please install Node.js v18 LTS or newer from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version is compatible!
echo.

REM Check if Yarn is installed
echo [2/7] Checking Yarn installation...
where yarn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Yarn is not installed. Installing Yarn globally...
    call npm install -g yarn
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install Yarn!
        echo Please try installing Yarn manually: npm install -g yarn
        pause
        exit /b 1
    )
    echo Yarn installed successfully!
) else (
    for /f "tokens=*" %%i in ('yarn --version') do set YARN_VERSION=%%i
    echo Yarn !YARN_VERSION! is already installed
)
echo.

REM Clean old node_modules if installation failed before
echo [3/6] Checking for previous installation issues...
if exist "node_modules\react-scripts-ts" (
    echo Found old react-scripts-ts installation. Cleaning up for modernization...
    rmdir /s /q node_modules 2>nul
    if exist "yarn.lock" del /f /q yarn.lock
    if exist "package-lock.json" del /f /q package-lock.json
    echo Cleanup complete!
)
echo.

REM Install project dependencies
echo [4/6] Installing project dependencies...
echo This may take a few minutes...
echo Note: Modernized with React 18 and react-scripts 5
echo       Compatible with Node.js v16, v18, v20, v22, v24+
echo.
call yarn install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo.
    echo Troubleshooting tips:
    echo 1. Make sure you have a stable internet connection
    echo 2. Try deleting node_modules folder and running this script again
    echo 3. Check if any antivirus software is blocking the installation
    echo.
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

REM Start background stock tracker service in separate process
echo [5/7] Starting background price tracker service...
set TRACKER_RUNNING=
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":4010" ^| findstr "LISTENING"') do (
    set TRACKER_RUNNING=1
)

if defined TRACKER_RUNNING (
    echo Background tracker is already running on port 4010.
) else (
    start "Stock Tracker Service" /min cmd /c "cd /d %~dp0 && node scripts\background-price-tracker.js"
    echo Background tracker started in a separate window.
)

echo Waiting for background tracker to become ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready=$false; for($i=0; $i -lt 20; $i++){ try { $r=Invoke-RestMethod -Uri 'http://127.0.0.1:4010/health' -Method GET -TimeoutSec 2; if($r.ok){ $ready=$true; break } } catch {}; Start-Sleep -Milliseconds 500 }; if(-not $ready){ exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Background tracker is not reachable yet. Continuing startup.
) else (
    echo Triggering immediate live market refresh before opening app...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-RestMethod -Uri 'http://127.0.0.1:4010/refresh-now' -Method POST -TimeoutSec 60; if($r.ok){ Write-Host ('Refresh complete. UpdatedAt: ' + $r.updatedAt) } else { exit 1 } } catch { exit 1 }"
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Could not trigger immediate refresh. App will still start.
    )
)
echo.

REM Start the development server
echo [6/7] Starting the development server...
echo The application will open automatically in your browser at http://localhost:3000
echo.
echo Note: Get a FREE stock API key from https://finnhub.io/register
echo      and add it to .env file (see README for instructions)
echo Background tracker endpoint: http://127.0.0.1:4010
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.
timeout /t 3 >nul

REM Open the browser after a delay
echo [7/7] Opening browser...
start "" "http://localhost:3000"

REM Start the development server (this will block)
call yarn start

ENDLOCAL


