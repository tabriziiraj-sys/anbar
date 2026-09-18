# 📋 خلاصه استقرار روی Liara.ir

## ✅ فایل‌های آماده شده

- ✅ `server.cjs` - پورت از env خوانده می‌شود
- ✅ `liara.json` - پیکربندی Liara
- ✅ `.gitignore` - نادیده گرفتن فایل‌های غیرضروری
- ✅ `Procfile` - دستور اجرای سرور
- ✅ `DEPLOY-LIARA.md` - راهنمای کامل

---

## 🔧 کاری که باید انجام دهید

### ۱. ویرایش `package.json`

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

**چرا؟**
- `start`: برای اجرای سرور در Liara
- `postinstall`: برای build خودکار بعد از نصب پکیج‌ها

---

## 🚀 مراحل استقرار

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

# ۴. استقرار
liara deploy

# ۵. مشاهده لاگ (اختیاری)
liara logs
```

---

## 🌐 آدرس اپلیکیشن

پس از استقرار:

```
https://anbarino.liara.run
```

---

## ⚠️ نکته مهم: ذخیره‌سازی داده‌ها

**وضعیت فعلی:**
- داده‌ها در `localStorage` مرورگر ذخیره می‌شوند
- هر کاربر داده‌های جداگانه دارد
- داده‌ها بین کاربران به اشتراک گذاشته نمی‌شود

**برای استفاده شخصی/تست:** ✅ مناسب است  
**برای استفاده تیمی:** ❌ نیاز به دیتابیس سرور دارد

---

## 📝 چک‌لیست نهایی

- [ ] `package.json` ویرایش شده (script start و postinstall)
- [ ] `server.cjs` پورت را از env می‌خواند
- [ ] `liara.json` وجود دارد
- [ ] `.gitignore` ساخته شده
- [ ] محلی تست شده: `npm run build && npm start`
- [ ] Liara CLI نصب شده
- [ ] وارد حساب Liara شده‌اید

---

## 🎯 دستورات سریع

```bash
# استقرار
liara deploy

# به‌روزرسانی
liara deploy

# مشاهده لاگ
liara logs

# اطلاعات اپ
liara app info
```

---

## 📚 راهنمای کامل

برای جزئیات بیشتر، فایل `DEPLOY-LIARA.md` را بخوانید.

---

**موفق باشید! 🚀**
