#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              انبارینو - سیستم مدیریت انبار                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# بررسی نصب بودن Node.js
if ! command -v node &> /dev/null; then
    echo "[خطا] Node.js نصب نیست!"
    echo ""
    echo "لطفاً Node.js را از آدرس زیر دانلود و نصب کنید:"
    echo "  https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[1/3] بررسی پوشه build..."
if [ ! -f "dist/index.html" ]; then
    echo "      پوشه dist یافت نشد. در حال ساخت..."
    echo ""
    npm run build
    if [ $? -ne 0 ]; then
        echo ""
        echo "[خطا] ساخت پروژه با مشکل مواجه شد!"
        exit 1
    fi
    echo ""
    echo "[OK] پروژه با موفقیت ساخته شد."
else
    echo "[OK] پوشه dist موجود است."
fi

echo ""
echo "[2/3] راه‌اندازی سرور روی پورت 3008..."
echo ""
echo "[3/3] باز کردن مرورگر..."
echo ""

# باز کردن مرورگر به‌صورت خودکار (مک/لینوکس)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3008"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:3008" 2>/dev/null || echo "لطفاً مرورگر را به‌صورت دستی باز کنید: http://localhost:3008"
fi

# اجرای سرور
node server.js
