@echo off
echo ================================================
echo   Stock Market Simulation - GitHub Push Script
echo ================================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

REM Initialize git repository if not already initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
)

REM Configure git remote
echo Setting up remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/scratchgamingone/stock-simulation-moidfication.git
echo Remote set to: https://github.com/scratchgamingone/stock-simulation-moidfication.git
echo.

REM Show what files will be added (excluding .env)
echo Files to be committed (excluding .env and other ignored files):
echo ------------------------------------------------
git status --short
echo.

REM Confirm before proceeding
set /p confirm="Do you want to proceed with commit and push? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Adding files to staging area...
git add .
echo.

REM Get commit message from user
set /p commitmsg="Enter commit message (or press Enter for default): "
if "%commitmsg%"=="" (
    set commitmsg=Update stock market simulation project
)

echo.
echo Committing changes...
git commit -m "%commitmsg%"
if errorlevel 1 (
    echo.
    echo Note: If there are no changes to commit, this is normal.
    echo.
)

echo.
echo Pushing to GitHub...
echo You may be prompted for your GitHub credentials.
git push -u origin main
if errorlevel 1 (
    echo.
    echo Push to 'main' failed, trying 'master' branch...
    git branch -M main
    git push -u origin main
    if errorlevel 1 (
        echo.
        echo ERROR: Push failed. Please check your credentials and repository settings.
        echo.
        echo Troubleshooting tips:
        echo 1. Make sure you have access to the repository
        echo 2. Check if you need to authenticate with a Personal Access Token
        echo 3. Verify the repository URL is correct
        pause
        exit /b 1
    )
)

echo.
echo ================================================
echo   Successfully pushed to GitHub!
echo ================================================
echo Repository: https://github.com/scratchgamingone/stock-simulation-moidfication
echo.
echo Note: .env file was automatically excluded from the commit.
echo.
pause
