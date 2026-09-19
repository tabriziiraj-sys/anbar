@echo off
chcp 65001 >nul
echo Creating ZIP file for Liara deployment...
echo.

:: Create ZIP file
powershell -Command "Compress-Archive -Path package.json, server.cjs, database.cjs, liara.json, Procfile, src, index.html, vite.config.js, tsconfig.json, db -DestinationPath anbarino-deploy.zip -Force"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ZIP file created successfully!
    echo ========================================
    echo.
    echo File: anbarino-deploy.zip
    echo.
    echo Now upload this file to Liara.ir
    echo.
) else (
    echo.
    echo ERROR: Failed to create ZIP file
    echo.
)

pause
