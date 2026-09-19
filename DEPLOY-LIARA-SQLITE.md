# 🚀 راهنمای کامل استقرار روی Liara.ir با دیتابیس SQLite

## 📋 مراحل کامل

### مرحله ۱: آماده‌سازی پروژه

#### ۱.۱ ویرایش `package.json`

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

#### ۱.۲ تست محلی

قبل از استقرار، محلی تست کنید:

```bash
# ساخت پروژه
npm run build

# اجرای سرور
npm start
```

مرورگر را باز کنید: `http://localhost:3008`

---

### مرحله ۲: نصب Liara CLI

```bash
npm install -g @liara/cli
```

---

### مرحله ۳: ورود به حساب Liara

```bash
liara login
```

ایمیل و رمز عبور حساب Liara خود را وارد کنید.

---

### مرحله ۴: ساخت اپلیکیشن

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

### مرحله ۵: ساخت دیسک برای دیتابیس

**مهم:** دیتابیس SQLite نیاز به دیسک دارد تا داده‌ها پایدار بمانند.

#### روش ۱: از طریق پنل Liara

1. وارد پنل Liara شوید: [console.liara.ir](https://console.liara.ir)
2. اپلیکیشن `anbarino` را انتخاب کنید
3. از منوی سمت چپ، **دیسک‌ها** را انتخاب کنید
4. روی **ایجاد دیسک** کلیک کنید
5. اطلاعات را وارد کنید:
   - **نام دیسک:** `database`
   - **اندازه:** `1 GB` (یا بیشتر)
   - **مسیر mount:** `db`
6. روی **ایجاد** کلیک کنید

#### روش ۲: از طریق CLI

```bash
liara disk create --name database --size 1 --mount-to db
```

---

### مرحله ۶: استقرار برنامه

```bash
liara deploy
```

**چه اتفاقی می‌افتد:**
1. کد شما به سرور Liara آپلود می‌شود
2. پکیج‌ها نصب می‌شوند (`npm install`)
3. پروژه build می‌شود (`npm run build` از طریق `postinstall`)
4. سرور اجرا می‌شود (`npm start`)
5. دیتابیس SQLite در پوشه `db` ساخته می‌شود
6. داده‌های نمونه درج می‌شوند

---

### مرحله ۷: دسترسی به اپلیکیشن

پس از استقرار موفق، Liara یک آدرس به شما می‌دهد:

```
https://anbarino.liara.run
```

---

## 🔧 همگام‌سازی داده‌ها

### همگام‌سازی بین مرورگر و سرور

فرانت‌اند از `localStorage` استفاده می‌کند. برای همگام‌سازی با سرور:

#### Export (از مرورگر به سرور)

در تنظیمات → تنظیمات عمومی:
1. روی **دریافت فایل پشتیبان** کلیک کنید
2. فایل JSON دانلود می‌شود
3. از طریق API به سرور ارسال کنید:

```bash
curl -X POST https://anbarino.liara.run/api/db/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

#### Import (از سرور به مرورگر)

1. داده‌ها را از سرور دریافت کنید:

```bash
curl https://anbarino.liara.run/api/db/export > server-data.json
```

2. در تنظیمات → تنظیمات عمومی:
3. روی **بازیابی از فایل پشتیبان** کلیک کنید
4. فایل `server-data.json` را انتخاب کنید

---

## 📊 مدیریت دیتابیس

### مشاهده لاگ‌ها

```bash
liara logs
```

### ورود به شل سرور

```bash
liara exec bash
```

### مشاهده فایل دیتابیس

```bash
# بعد از ورود به شل
ls -lh db/
```

### پشتیبان‌گیری از دیتابیس

```bash
# از شل سرور
sqlite3 db/anbarino.db ".backup backup-$(date +%Y%m%d).db"
```

---

## 🔄 به‌روزرسانی اپلیکیشن

هر زمان تغییراتی در کد دادید:

```bash
liara deploy
```

---

## 🛑 مدیریت اپلیکیشن

### توقف اپلیکیشن

```bash
liara scale --replicas 0
```

### راه‌اندازی مجدد

```bash
liara scale --replicas 1
```

### حذف اپلیکیشن

```bash
liara app delete
```

---

## ⚙️ متغیرهای محیطی

### تنظیم متغیر

```bash
liara env set NODE_ENV=production
liara env set DB_PATH=/app/db/anbarino.db
```

### مشاهده متغیرها

```bash
liara env list
```

### حذف متغیر

```bash
liara env unset VAR_NAME
```

---

## 🌐 دامنه اختصاصی

### اضافه کردن دامنه

```bash
liara domain add --name mydomain.com
```

### تنظیم SSL

Liara به‌صورت خودکار SSL را تنظیم می‌کند.

---

## 📈 مانیتورینگ

### مشاهده آمار

```bash
liara app info
```

### مشاهده لاگ‌های real-time

```bash
liara logs --follow
```

---

## 🐛 رفع مشکلات

### مشکل ۱: دیتابیس ساخته نمی‌شود

**علت:** دیسک ساخته نشده است

**راه‌حل:**
```bash
# بررسی دیسک‌ها
liara disk list

# ساخت دیسک
liara disk create --name database --size 1 --mount-to db
```

### مشکل ۲: Build failed

```bash
# لاگ‌ها را بررسی کنید
liara logs

# محلی تست کنید
npm run build
```

### مشکل ۳: Server not starting

```bash
# مطمئن شوید script start در package.json وجود دارد
# مطمئن شوید server.cjs پورت را از env می‌خواند
```

### مشکل ۴: داده‌ها از بین می‌روند

**علت:** دیسک ساخته نشده یا مسیر mount اشتباه است

**راه‌حل:**
1. مطمئن شوید دیسک `database` ساخته شده
2. مسیر mount باید `db` باشد
3. در `database.cjs` مسیر باید `db/anbarino.db` باشد

---

## 📝 چک‌لیست نهایی

- [ ] `package.json` ویرایش شده (script start و postinstall)
- [ ] `server.cjs` پورت را از env می‌خواند
- [ ] `database.cjs` مسیر دیتابیس را از env می‌خواند
- [ ] `liara.json` دیسک `database` را تعریف کرده
- [ ] محلی تست شده: `npm run build && npm start`
- [ ] Liara CLI نصب شده
- [ ] وارد حساب Liara شده‌اید
- [ ] اپلیکیشن ساخته شده
- [ ] دیسک `database` ساخته شده (اندازه 1GB+)
- [ ] استقرار موفق: `liara deploy`
- [ ] لاگ‌ها بررسی شده: `liara logs`

---

## 🎯 خلاصه دستورات

```bash
# نصب CLI
npm install -g @liara/cli

# ورود
liara login

# ساخت اپ
liara create

# ساخت دیسک
liara disk create --name database --size 1 --mount-to db

# استقرار
liara deploy

# مشاهده لاگ
liara logs

# به‌روزرسانی
liara deploy

# اطلاعات اپ
liara app info
```

---

## 💡 نکات مهم

### ۱. پایداری داده‌ها

- دیتابیس SQLite در دیسک `database` ذخیره می‌شود
- بدون دیسک، داده‌ها با هر deploy از بین می‌روند
- حتماً دیسک بسازید!

### ۲. پشتیبان‌گیری

- به‌صورت دوره‌ای از دیتابیس پشتیبان بگیرید
- از طریق API export کنید
- فایل را در جای امن نگهداری کنید

### ۳. مقیاس‌پذیری

- SQLite برای وب‌سایت‌های کوچک مناسب است
- برای ترافیک بالا، از PostgreSQL یا MySQL استفاده کنید
- Liara از هر دو پشتیبانی می‌کند

### ۴. امنیت

- رمزهای عبور را hash کنید (در نسخه بعدی)
- از HTTPS استفاده کنید (Liara خودکار تنظیم می‌کند)
- متغیرهای حساس را در env قرار دهید

---

## 📞 پشتیبانی

- مستندات Liara: [docs.liara.ir](https://docs.liara.ir)
- تیکت پشتیبانی: از پنل Liara
- مستندات SQLite در Liara: [docs.liara.ir/paas/nodejs/how-tos/connect-to-db/sqlite](https://docs.liara.ir/paas/nodejs/how-tos/connect-to-db/sqlite/)

---

## 🎉 موفق باشید!

پروژه شما با دیتابیس SQLite آماده استقرار روی Liara.ir است.

**آدرس نهایی:** `https://anbarino.liara.run`

**کاربرهای آزمایشی:**
- `admin / 1234`
- `sara / 1234`
