#!/bin/bash

echo ""
echo "========================================================"
echo "       Anbarino - Warehouse Management System"
echo "========================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo ""
    echo "Please download and install Node.js from:"
    echo "  https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[1/3] Checking build folder..."
if [ ! -f "dist/index.html" ]; then
    echo "      dist folder not found. Building..."
    echo ""
    npm run build
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Build failed!"
        exit 1
    fi
    echo ""
    echo "[OK] Build completed successfully."
else
    echo "[OK] dist folder exists."
fi

echo ""
echo "[2/3] Starting server on port 3008..."
echo ""
echo "[3/3] Opening browser..."
echo ""

# Open browser automatically (Mac/Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3008"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:3008" 2>/dev/null || echo "Please open browser manually: http://localhost:3008"
fi

# Run server
node server.cjs
