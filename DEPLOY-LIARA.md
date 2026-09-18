# 🚀 راهنمای استقرار روی Liara.ir

این راهنما مراحل استقرار پروژه انبارینو روی پلتفرم ابری Liara را توضیح می‌دهد.

## ⚠️ نکته مهم قبل از شروع

**ذخیره‌سازی داده‌ها:**
- در حال حاضر داده‌ها در `localStorage` مرورگر ذخیره می‌شوند
- این یعنی **هر کاربر داده‌های جداگانه خود را دارد**
- داده‌ها بین کاربران به اشتراک گذاشته نمی‌شود
- اگر می‌خواهید داده‌ها بین همه کاربران مشترک باشد، باید دیتابیس واقعی (SQLite/PostgreSQL) اضافه شود

**برای استفاده شخصی یا تست:** این روش مناسب است  
**برای استفاده تیمی:** باید دیتابیس سرور اضافه شود

---

## 📋 پیش‌نیازها

1. حساب کاربری در [Liara.ir](https://liara.ir)
2. نصب [Liara CLI](https://docs.liara.ir/cli/install)
3. Node.js نسخه 18 یا بالاتر

---

## 🔧 مرحله ۱: آماده‌سازی پروژه

### ۱.۱ ویرایش `package.json`

فایل `package.json` را باز کنید و بخش `scripts` را به این شکل تغییر دهید:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "start": "node server.cjs",
    "postinstall": "npm run build"
  }
}
```

**توضیح:**
- `start`: سرور را اجرا می‌کند
- `postinstall`: بعد از نصب پکیج‌ها، خودکار build می‌کند

### ۱.۲ بررسی `server.cjs`

مطمئن شوید خط پورت به این شکل است:

```javascript
const PORT = process.env.PORT || 3008;
```

این باعث می‌شود Liara بتواند پورت را به‌صورت خودکار تنظیم کند.

### ۱.۳ بررسی `liara.json`

فایل `liara.json` باید وجود داشته باشد:

```json
{
  "app": "anbarino",
  "port": 3008,
  "build": {
    "location": "iran"
  },
  "disks": []
}
```

**نکته:** نام `app` را می‌توانید تغییر دهید (مثلاً `my-warehouse`).

---

## 🚀 مرحله ۲: نصب Liara CLI

```bash
npm install -g @liara/cli
```

یا با yarn:

```bash
yarn global add @liara/cli
```

---

## 🔐 مرحله ۳: ورود به Liara

```bash
liara login
```

ایمیل و رمز عبور حساب Liara خود را وارد کنید.

---

## 🏗️ مرحله ۴: ساخت اپلیکیشن

```bash
liara create
```

سوالات را اینگونه پاسخ دهید:

```
? Enter a name for your app: anbarino
? Select a platform: node
? Select a plan: free (یا پلن مورد نظر)
? Select a region: iran (تهران)
```

---

## 📤 مرحله ۵: استقرار (Deploy)

```bash
liara deploy
```

**چه اتفاقی می‌افتد:**
1. کد شما به سرور Liara آپلود می‌شود
2. پکیج‌ها نصب می‌شوند (`npm install`)
3. پروژه build می‌شود (`npm run build` از طریق `postinstall`)
4. سرور اجرا می‌شود (`npm start`)

---

## 🌐 مرحله ۶: دسترسی به اپلیکیشن

پس از استقرار موفق، Liara یک آدرس به شما می‌دهد:

```
https://anbarino.liara.run
```

یا اگر نام دیگری انتخاب کردید:

```
https://[app-name].liara.run
```

---

## 🔄 به‌روزرسانی اپلیکیشن

هر زمان تغییراتی در کد دادید:

```bash
liara deploy
```

---

## 📊 مشاهده لاگ‌ها

```bash
liara logs
```

---

## 🛑 توقف اپلیکیشن

```bash
liara scale --replicas 0
```

## ▶️ راه‌اندازی مجدد

```bash
liara scale --replicas 1
```

---

## 🗑️ حذف اپلیکیشن

```bash
liara app delete
```

---

## ⚙️ تنظیمات پیشرفته

### تغییر پورت

در `liara.json`:

```json
{
  "app": "anbarino",
  "port": 8080,
  "build": {
    "location": "iran"
  }
}
```

### اضافه کردن دامنه اختصاصی

```bash
liara domain add --name mydomain.com
```

### متغیرهای محیطی

```bash
liara env set NODE_ENV=production
liara env set CUSTOM_VAR=value
```

---

## 🐛 رفع مشکلات

### مشکل ۱: Build failed

```bash
# لاگ‌ها را بررسی کنید
liara logs

# محلی تست کنید
npm run build
```

### مشکل ۲: Server not starting

```bash
# مطمئن شوید script start در package.json وجود دارد
# مطمئن شوید server.cjs پورت را از env می‌خواند
```

### مشکل ۳: Port already in use

Liara به‌صورت خودکار پورت را تنظیم می‌کند. مطمئن شوید در `server.cjs`:

```javascript
const PORT = process.env.PORT || 3008;
```

---

## 📝 چک‌لیست قبل از Deploy

- [ ] `package.json` دارای `start` و `postinstall` است
- [ ] `server.cjs` پورت را از `process.env.PORT` می‌خواند
- [ ] `liara.json` وجود دارد
- [ ] `.gitignore` ساخته شده
- [ ] محلی تست کرده‌اید: `npm run build && npm start`
- [ ] Liara CLI نصب شده
- [ ] وارد حساب Liara شده‌اید

---

## 💡 نکات تکمیلی

### بهینه‌سازی حجم

قبل از deploy، فایل‌های غیرضروری را حذف کنید:

```bash
# حذف node_modules محلی (در سرور دوباره نصب می‌شود)
rm -rf node_modules

# حذف dist محلی (در سرور دوباره build می‌شود)
rm -rf dist
```

### بررسی حجم اپلیکیشن

```bash
liara app info
```

### استفاده از Disk (برای ذخیره فایل)

اگر می‌خواهید فایل‌های آپلود شده (مثل تصاویر کالا) ذخیره شوند:

1. در `liara.json`:

```json
{
  "app": "anbarino",
  "port": 3008,
  "disks": [
    {
      "name": "data",
      "mountTo": "/app/uploads"
    }
  ]
}
```

2. در `server.cjs` مسیر آپلود را تنظیم کنید

---

## 📞 پشتیبانی

- مستندات Liara: [docs.liara.ir](https://docs.liara.ir)
- تیکت پشتیبانی: از پنل Liara

---

## 🎯 خلاصه دستورات

```bash
# نصب CLI
npm install -g @liara/cli

# ورود
liara login

# ساخت اپ
liara create

# استقرار
liara deploy

# مشاهده لاگ
liara logs

# به‌روزرسانی
liara deploy
```

---

**موفق باشید! 🚀**
