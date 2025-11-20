# راهنمای تنظیم Firebase

## مشکل فعلی
خطای `Missing or insufficient permissions` نشان میدهد که Firestore Security Rules اجازه دسترسی به دیتابیس را نمیدهد.

## راه حل

### گام 1: ورود به Firebase Console
1. به آدرس https://console.firebase.google.com بروید
2. پروژه `hessekhub-finance` را باز کنید

### گام 2: تنظیم Firestore Security Rules
1. از منوی سمت چپ، روی **Firestore Database** کلیک کنید
2. به تب **Rules** بروید
3. Rules فعلی را با کد زیر جایگزین کنید:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // اجازه دسترسی کامل برای development
    // توجه: این rules فقط برای development مناسب است
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. روی دکمه **Publish** کلیک کنید

### گام 3: بررسی تنظیمات
پس از publish کردن rules، صفحه را refresh کنید و باید sidebar و تمام داده‌ها نمایش داده شوند.

## نکات امنیتی

⚠️ **هشدار**: Rules بالا فقط برای development مناسب است. برای production باید rules امن‌تری تنظیم کنید:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // فقط کاربران احراز هویت شده
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## مشکلات دیگر در Console

### 1. Gemini API Key
خطای `API key not valid` مربوط به Gemini API است. برای رفع آن:
- فایل `.env.local` را ویرایش کنید
- یک API key معتبر از https://aistudio.google.com/app/apikey دریافت کنید
- به فایل اضافه کنید: `VITE_GEMINI_API_KEY=your-api-key-here`

### 2. Recharts Warnings
هشدارهای مربوط به width/height نگران‌کننده نیستند و فقط warnings هستند.

### 3. Tailwind CDN Warning
برای production بهتر است Tailwind را به صورت PostCSS نصب کنید، اما برای development مشکلی ندارد.
