@echo off
SETLOCAL
SET JABARI_DIR=%~dp0
cd /d "%JABARI_DIR%"

:MENU
cls
echo ==========================================
echo           JABARI AI LAUNCHER
echo ==========================================
echo.
echo [1] Start Jabari (Background)
echo [2] Stop Jabari
echo [3] View Logs (Backend)
echo [4] Check Health Status
echo [5] Exit
echo.
echo ==========================================
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto LOGS
if "%choice%"=="4" goto HEALTH
if "%choice%"=="5" goto EXIT

:START
echo.
echo Launching Jabari...
docker-compose up -d --build
echo.
echo Dashboard is now running at: http://localhost
echo API Documentation at: http://localhost:8000/docs
pause
goto MENU

:STOP
echo.
echo Stopping Jabari...
docker-compose down
echo Done.
pause
goto MENU

:LOGS
echo.
echo Press Ctrl+C to exit logs...
docker logs -f jabari-backend
goto MENU

:HEALTH
echo.
echo Current Container Status:
docker ps --filter "name=jabari"
echo.
pause
goto MENU

:EXIT
exit
