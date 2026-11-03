@echo off
TITLE Jabari Launcher
echo ========================================================
echo               Starting Jabari (No Docker)
echo ========================================================
echo.

set ROOT_DIR=%~dp0
if exist "%ROOT_DIR%backend" (
    set JABARI_DIR=%ROOT_DIR%
) else if exist "%ROOT_DIR%Jabari\backend" (
    set JABARI_DIR=%ROOT_DIR%Jabari\
) else (
    echo Error: Could not locate backend folder.
    pause
    exit /b 1
)

echo [1/3] Checking PostgreSQL service...
sc query postgresql-x64-18 | find "RUNNING" >nul
if %ERRORLEVEL% equ 0 (
    echo PostgreSQL service is RUNNING.
) else (
    echo Starting PostgreSQL service...
    net start postgresql-x64-18
)

echo.
echo [2/3] Starting Jabari Backend on port 8000...
start "Jabari Backend (FastAPI)" cmd /k "cd /d "%JABARI_DIR%backend" && ..\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [3/3] Starting Jabari Frontend on port 5173...
start "Jabari Frontend (Vite)" cmd /k "cd /d "%JABARI_DIR%frontend" && npm run dev"

echo.
echo ========================================================
echo Jabari is running!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ========================================================
echo.
timeout /t 3 >nul
start http://localhost:5173

