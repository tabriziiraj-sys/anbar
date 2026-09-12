@echo off
title Anbarino - Warehouse Management System
color 0A

echo.
echo ========================================================
echo        Anbarino - Warehouse Management System
echo ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo   https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking build folder...
if not exist "dist\index.html" (
    echo       dist folder not found. Building...
    echo.
    call npm run build
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Build completed successfully.
) else (
    echo [OK] dist folder exists.
)

echo.
echo [2/3] Starting server on port 3008...
echo.
echo [3/3] Opening browser...
echo.

:: Open browser automatically
start "" "http://localhost:3008"

:: Run server
node server.cjs

pause
