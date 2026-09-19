# 📋 خلاصه استقرار روی Liara.ir با SQLite

## ✅ تغییرات اعمال شده

- ✅ `database.cjs` - لایه دیتابیس SQLite
- ✅ `server.cjs` - سرور Express با API کامل
- ✅ `src/lib/api.ts` - API client برای فرانت‌اند
- ✅ `liara.json` - پیکربندی Liara با دیسک
- ✅ `DEPLOY-LIARA-SQLITE.md` - راهنمای کامل

---

## 🔧 کاری که باید انجام دهید

### ۱. ویرایش `package.json`

بخش `scripts` را به این شکل تغییر دهید:

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

---

## 🚀 مراحل استقرار (قدم به قدم)

```bash
# ۱. نصب Liara CLI
npm install -g @liara/cli

# ۲. ورود به حساب Liara
liara login

# ۳. ساخت اپلیکیشن
liara create
# نام: anbarino
# پلتفرم: node
# پلن: free
# منطقه: iran

# ۴. ساخت دیسک برای دیتابیس (مهم!)
liara disk create --name database --size 1 --mount-to db

# ۵. استقرار
liara deploy

# ۶. مشاهده لاگ (اختیاری)
liara logs
```

---

## 🌐 آدرس اپلیکیشن

```
https://anbarino.liara.run
```

---

## 💾 دیتابیس SQLite

### ساختار جداول

- `users` - کاربران
- `company` - اطلاعات شرکت
- `parties` - طرف حساب‌ها
- `categories` - دسته‌بندی کالاها
- `products` - کالاها
- `stock_docs` - اسناد ورود/خروج
- `stock_doc_items` - اقلام اسناد
- `payments` - دریافت/پرداخت
- `purchases` - فاکتورهای خرید
- `expenses` - هزینه‌ها
- `expense_types` - انواع هزینه
- `audit_logs` - گزارش حسابرسی
- `settings` - تنظیمات
- `sequences` - دنباله‌های شماره‌گذاری

### مسیر فایل دیتابیس

```
db/anbarino.db
```

### دیسک Liara

- **نام:** `database`
- **اندازه:** `1 GB` (حداقل)
- **مسیر mount:** `db`

---

## 🔄 همگام‌سازی داده‌ها

### Export از مرورگر به سرور

```bash
# ۱. از تنظیمات → دریافت فایل پشتیبان
# ۲. ارسال به سرور
curl -X POST https://anbarino.liara.run/api/db/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

### Import از سرور به مرورگر

```bash
# ۱. دریافت از سرور
curl https://anbarino.liara.run/api/db/export > server-data.json

# ۲. در تنظیمات → بازیابی از فایل پشتیبان
```

---

## 📊 API Endpoints

### کاربران
- `GET /api/users` - لیست کاربران
- `POST /api/users` - ایجاد کاربر
- `PUT /api/users/:id` - ویرایش کاربر

### شرکت
- `GET /api/company` - اطلاعات شرکت
- `PUT /api/company` - ویرایش اطلاعات

### طرف حساب‌ها
- `GET /api/parties` - لیست طرف حساب‌ها
- `POST /api/parties` - ایجاد
- `PUT /api/parties/:id` - ویرایش
- `DELETE /api/parties/:id` - حذف

### کالاها
- `GET /api/products` - لیست کالاها
- `POST /api/products` - ایجاد
- `PUT /api/products/:id` - ویرایش
- `DELETE /api/products/:id` - حذف

### اسناد انبار
- `GET /api/stock-docs` - لیست اسناد
- `POST /api/stock-docs` - ایجاد
- `PUT /api/stock-docs/:id` - ویرایش
- `DELETE /api/stock-docs/:id` - حذف

### دریافت/پرداخت
- `GET /api/payments` - لیست
- `POST /api/payments` - ایجاد
- `PUT /api/payments/:id` - ویرایش
- `DELETE /api/payments/:id` - حذف

### فاکتورها
- `GET /api/purchases` - لیست
- `POST /api/purchases` - ایجاد
- `PUT /api/purchases/:id` - ویرایش
- `DELETE /api/purchases/:id` - حذف

### هزینه‌ها
- `GET /api/expenses` - لیست
- `POST /api/expenses` - ایجاد
- `PUT /api/expenses/:id` - ویرایش
- `DELETE /api/expenses/:id` - حذف

### دیتابیس کامل
- `GET /api/db/export` - خروجی کامل دیتابیس
- `POST /api/db/import` - ورود کامل دیتابیس

---

## 📝 چک‌لیست نهایی

- [ ] `package.json` ویرایش شده
- [ ] `server.cjs` پورت از env می‌خواند ✅
- [ ] `database.cjs` مسیر از env می‌خواند ✅
- [ ] `liara.json` دیسک تعریف شده ✅
- [ ] محلی تست شده
- [ ] Liara CLI نصب شده
- [ ] وارد حساب Liara شده‌اید
- [ ] اپلیکیشن ساخته شده
- [ ] **دیسک `database` ساخته شده** ⚠️
- [ ] استقرار موفق

---

## 🎯 دستورات کاربردی

```bash
# استقرار
liara deploy

# مشاهده لاگ
liara logs

# اطلاعات اپ
liara app info

# مدیریت دیسک
liara disk list
liara disk create --name database --size 1 --mount-to db

# متغیرهای محیطی
liara env set NODE_ENV=production
liara env list

# ورود به شل سرور
liara exec bash
```

---

## ⚠️ نکات مهم

### ۱. دیسک الزامی است!

بدون دیسک، داده‌ها با هر deploy از بین می‌روند.

### ۲. پشتیبان‌گیری

به‌صورت دوره‌ای از دیتابیس پشتیبان بگیرید:

```bash
# از سرور
curl https://anbarino.liara.run/api/db/export > backup.json
```

### ۳. مقیاس‌پذیری

SQLite برای ترافیک کم مناسب است. برای ترافیک بالا از PostgreSQL استفاده کنید.

---

## 📚 راهنمای کامل

برای جزئیات بیشتر، فایل `DEPLOY-LIARA-SQLITE.md` را بخوانید.

---

**موفق باشید! 🚀**
