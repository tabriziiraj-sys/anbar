@echo off
chcp 65001 >nul 2>&1
title انبارینو - سیستم مدیریت انبار و امور مالی
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              انبارینو - سیستم مدیریت انبار                 ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: بررسی نصب بودن Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطا] Node.js نصب نیست!
    echo.
    echo لطفاً Node.js را از آدرس زیر دانلود و نصب کنید:
    echo   https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] بررسی پوشه build...
if not exist "dist\index.html" (
    echo       پوشه dist یافت نشد. در حال ساخت...
    echo.
    call npm run build
    if %errorlevel% neq 0 (
        echo.
        echo [خطا] ساخت پروژه با مشکل مواجه شد!
        pause
        exit /b 1
    )
    echo.
    echo [OK] پروژه با موفقیت ساخته شد.
) else (
    echo [OK] پوشه dist موجود است.
)

echo.
echo [2/3] راه‌اندازی سرور روی پورت 3008...
echo.
echo [3/3] باز کردن مرورگر...
echo.

:: باز کردن مرورگر به‌صورت خودکار
start "" "http://localhost:3008"

:: اجرای سرور
node server.js

pause
