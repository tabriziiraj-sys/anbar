# 🚀 راهنمای استقرار روی Liara.ir

## 📦 ساخت فایل ZIP

### روش ۱: با فایل create-zip.bat (ویندوز)

1. روی فایل `create-zip.bat` دابل‌کلیک کنید
2. فایل `anbarino-deploy.zip` ساخته می‌شود
3. این فایل را در Liara آپلود کنید

### روش ۲: دستی (ویندوز)

1. این فایل‌ها را انتخاب کنید:
   - `package.json`
   - `server.cjs`
   - `database.cjs`
   - `liara.json`
   - `Procfile`
   - پوشه `src`
   - `index.html`
   - `vite.config.js`
   - `tsconfig.json`
   - پوشه `db`

2. راست کلیک → Send to → Compressed (zipped) folder
3. نام فایل: `anbarino-deploy.zip`

### روش ۳: PowerShell

```powershell
Compress-Archive -Path package.json, server.cjs, database.cjs, liara.json, Procfile, src, index.html, vite.config.js, tsconfig.json, db -DestinationPath anbarino-deploy.zip
```

---

## 🌐 آپلود در Liara.ir

### مرحله ۱: ورود به پنل

1. وارد [console.liara.ir](https://console.liara.ir) شوید
2. اپلیکیشن `anbarino` را انتخاب کنید (یا بسازید)

### مرحله ۲: آپلود ZIP

1. روی **استقرار** کلیک کنید
2. روش: **آپلود فایل ZIP**
3. فایل `anbarino-deploy.zip` را انتخاب کنید
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

---

## 🎯 خلاصه

```
1. ساخت ZIP (با create-zip.bat)
   ↓
2. آپلود در Liara
   ↓
3. ساخت دیسک database
   ↓
4. بررسی لاگ‌ها
   ↓
5. دسترسی به سایت
```

---

## 📞 پشتیبانی

- آدرس سایت: `https://anbarino.liara.run`
- کاربر آزمایشی: `admin / 1234`
