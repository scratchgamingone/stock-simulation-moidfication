@echo off
setlocal EnableExtensions

title Setup Background Tracker Autostart

echo ============================================
echo Setup Background Tracker Autostart (Windows)
echo ============================================
echo.

where schtasks >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: schtasks is not available on this system.
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Install Node.js from https://nodejs.org/ and run this script again.
    pause
    exit /b 1
)

set "TASK_NAME=StockMarketBackgroundTracker"
set "WORKDIR=%~dp0"
set "WORKDIR=%WORKDIR:~0,-1%"
set "SCRIPT_PATH=%WORKDIR%\scripts\background-price-tracker.js"

for /f "delims=" %%I in ('where node') do (
    set "NODE_EXE=%%I"
    goto :node_found
)

echo ERROR: Unable to resolve node.exe path.
pause
exit /b 1

:node_found
if not exist "%SCRIPT_PATH%" (
    echo ERROR: Tracker script not found: %SCRIPT_PATH%
    pause
    exit /b 1
)

set "TASK_COMMAND=\"%NODE_EXE%\" \"%SCRIPT_PATH%\""

echo Removing old task if it exists...
schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>nul

echo Creating startup task for current user at logon...
schtasks /Create /TN "%TASK_NAME%" /SC ONLOGON /RL LIMITED /TR "%TASK_COMMAND%" /F
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create scheduled task.
    echo Try running this script as Administrator and try again.
    pause
    exit /b 1
)

echo.
echo Success! Background tracker will now start automatically when you sign in.
echo Task name: %TASK_NAME%
echo.
echo Starting the task now...
schtasks /Run /TN "%TASK_NAME%" >nul 2>nul
echo Done.
echo.
pause
endlocal
