# 🚀 راهنمای استقرار روی Liara.ir

## 📥 دانلود از GitHub

1. روی دکمه سبز **Code** کلیک کنید
2. **Download ZIP** را انتخاب کنید
3. فایل ZIP را استخراج کنید

## 📦 ساخت ZIP برای Liara

### فایل‌هایی که باید در ZIP باشند:

```
✅ package.json
✅ server.cjs
✅ database.cjs
✅ liara.json
✅ Procfile
✅ index.html
✅ vite.config.js
✅ tsconfig.json
✅ src/ (کل پوشه)
✅ db/ (پوشه خالی - برای mount دیسک)
```

### تنظیمات Liara:
```
📌 پورت: 3000
📌 نام دیسک: database
📌 مسیر mount: /app/db
```

### فایل‌هایی که نباید باشند:

```
❌ node_modules/
❌ dist/
❌ package-lock.json
❌ .git/
```

### روش ساخت ZIP:

**ویندوز (PowerShell):**
```powershell
Compress-Archive -Path package.json, server.cjs, database.cjs, liara.json, Procfile, index.html, vite.config.js, tsconfig.json, src, db -DestinationPath anbarino.zip
```

**ویندوز (دستی):**
1. فایل‌های بالا را انتخاب کنید
2. راست کلیک → Send to → Compressed (zipped) folder
3. نام: `anbarino.zip`

## 🌐 آپلود در Liara

### مرحله ۱: ورود

1. وارد [console.liara.ir](https://console.liara.ir) شوید
2. اپلیکیشن `anbarino` را انتخاب کنید

### مرحله ۲: آپلود ZIP

1. روی **استقرار** کلیک کنید
2. روش: **آپلود فایل ZIP**
3. فایل `anbarino.zip` را انتخاب کنید
4. آپلود کنید

### مرحله ۳: ساخت دیسک (مهم!)

1. از منوی سمت چپ → **دیسک‌ها**
2. روی **ایجاد دیسک** کلیک کنید
3. اطلاعات:
   - **نام:** `database`
   - **اندازه:** `1 GB`
   - **مسیر mount:** `db`
4. ایجاد کنید

### مرحله ۴: بررسی

1. روی **لاگ‌ها** کلیک کنید
2. باید این پیام را ببینید:
   ```
   Database initialized successfully
   Server started successfully
   ```
3. آدرس: `https://anbarino.liara.run`

## 👤 کاربرهای آزمایشی

- **Username:** `admin` | **Password:** `1234`
- **Username:** `sara` | **Password:** `1234`

## 🎯 خلاصه

```
1. دانلود ZIP از GitHub
   ↓
2. استخراج ZIP
   ↓
3. انتخاب ۱۰ فایل/پوشه اصلی
   ↓
4. ساخت ZIP جدید
   ↓
5. آپلود در Liara
   ↓
6. ساخت دیسک database
   ↓
7. تمام!
```

**موفق باشید! 🚀**
