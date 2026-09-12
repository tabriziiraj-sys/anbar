import { useState } from "react";
import { useApp } from "../state";
import { I } from "../components/ui";
import { faNum } from "../lib/db";

export default function Login() {
  const { login, db } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) { setError("نام کاربری و رمز عبور را وارد کنید."); return; }
    setBusy(true);
    setTimeout(() => {
      const err = login(username, password);
      if (err) { setError(err); setBusy(false); }
    }, 550);
  };

  return (
    <div className="app-screen min-h-screen flex app-bg" dir="rtl">
      {/* فرم ورود */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[400px] anim-fade-up">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-12 rounded-xl bg-pine-600 flex items-center justify-center shadow-lg shadow-pine-800/25">
              <svg viewBox="0 0 32 32" width="26" height="26">
                <path d="M16 5l9 5v10l-9 5-9-5V10z" fill="none" stroke="#f2c66d" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M7 10l9 5 9-5M16 15v10" fill="none" stroke="#f2c66d" strokeWidth="2.2" strokeLinejoin="round" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-[28px] leading-8 text-night">انبارینو</span>
              <span className="text-[11.5px] text-ink-3">مدیریت انبار و امور مالی شرکت‌های کوچک</span>
            </span>
          </div>

          <div className="bg-card border border-line rounded-xl p-6 sm:p-7 shadow-xl shadow-night/5">
            <h1 className="font-bold text-[17px] text-night">ورود به حساب کاربری</h1>
            <p className="text-[12.5px] text-ink-3 mt-1 mb-5">برای مدیریت انبار و امور مالی، وارد شوید.</p>

            {error && (
              <div className="flex items-start gap-2 bg-rose-100 text-rose-700 border border-rose-500/25 rounded-lg px-3.5 py-2.5 text-[12.5px] font-semibold mb-4 anim-pop">
                <I n="alert" className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="block text-[12px] font-bold text-ink-2 mb-1.5">نام کاربری</span>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"><I n="user" className="w-4.5 h-4.5" /></span>
                  <input className="ctl pr-10" dir="ltr" style={{ textAlign: "left" }} value={username}
                    onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoFocus />
                </div>
              </label>
              <label className="block">
                <span className="block text-[12px] font-bold text-ink-2 mb-1.5">رمز عبور</span>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"><I n="key" className="w-4.5 h-4.5" /></span>
                  <input className="ctl pr-10 pl-10" dir="ltr" style={{ textAlign: "left" }}
                    type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-pine-600 transition-colors">
                    <I n="eye" className="w-4.5 h-4.5" />
                  </button>
                </div>
              </label>
              <button type="submit" disabled={busy}
                className="w-full bg-pine-600 hover:bg-pine-700 active:scale-[0.98] text-white font-bold text-[14px] rounded-lg py-3 transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-pine-800/20 disabled:opacity-60">
                {busy ? (
                  <>
                    <span className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    در حال ورود...
                  </>
                ) : (
                  <>ورود به سیستم <I n="arrow" className="w-4.5 h-4.5 rotate-180" /></>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-dashed border-line pt-4">
              <p className="text-[11px] text-ink-3 mb-2">ورود آزمایشی (روی هر کدام کلیک کنید):</p>
              <div className="flex gap-2 flex-wrap">
                {db.users.filter((u) => u.active).slice(0, 2).map((u) => (
                  <button key={u.id} type="button"
                    onClick={() => { setUsername(u.username); setPassword("1234"); setError(null); }}
                    className="px-3 py-1.5 rounded-lg bg-pine-50 text-pine-700 text-[11.5px] font-bold border border-pine-200 hover:bg-pine-100 transition-colors">
                    {u.fullName} — <span dir="ltr">{u.username} / 1234</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-ink-3 mt-5">
            این نرم‌افزار کاملاً آفلاین اجرا می‌شود و اطلاعات روی همین دستگاه ذخیره می‌گردد.
          </p>
        </div>
      </div>

      {/* پنل برند */}
      <div className="hidden lg:flex w-[46%] relative overflow-hidden flex-col justify-between p-10 text-white"
        style={{ background: "linear-gradient(150deg,#123330 0%,#0c211e 55%,#0a1b19 100%)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.13]" aria-hidden>
          <defs>
            <pattern id="gp" width="46" height="46" patternUnits="userSpaceOnUse">
              <path d="M23 4l16 9v18l-16 9-16-9V13z" fill="none" stroke="#f2c66d" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gp)" />
        </svg>

        <div className="relative">
          <span className="inline-flex items-center gap-2 text-saffron-300 text-[12px] font-bold border border-saffron-500/30 bg-saffron-500/10 rounded-full px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron-300" style={{ animation: "tickerPulse 1.6s infinite" }} />
            سامانه بومی — بدون نیاز به اینترنت
          </span>
          <h2 className="font-display text-[44px] leading-[1.35] mt-6 max-w-[440px]">
            انبار و حساب‌وکتاب شرکت،<br />
            <span className="text-saffron-300">ساده و همیشه در دسترس</span>
          </h2>
          <p className="text-white/55 text-[13.5px] leading-7 mt-3 max-w-[400px]">
            مخصوص شرکت‌های کوچک؛ بدون پیچیدگی‌های حسابداری — فقط کالا، انبار، طرف حساب، دریافت و پرداخت، خرید و هزینه.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3 max-w-[460px]">
          {[
            { i: "trayIn", t: "ورود و خروج لحظه‌ای کالا", d: "ثبت سند با چند کلیک و کنترل خودکار موجودی" },
            { i: "alert", t: "هشدار کمبود موجودی", d: "کالاهای زیر حد مجاز در داشبورد دیده می‌شوند" },
            { i: "wallet", t: "دریافت و پرداخت", d: "واریزی‌ها، پرداختی‌ها و گردش حساب طرف‌حساب‌ها" },
            { i: "printer", t: "چاپ اسناد با سربرگ", d: "خروجی رسمی A4 + خروجی Excel از گزارش‌ها" },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all duration-200" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="w-9 h-9 rounded-lg bg-pine-600/40 text-saffron-300 flex items-center justify-center mb-2.5">
                <I n={f.i} className="w-4.5 h-4.5" />
              </span>
              <p className="font-bold text-[13px]">{f.t}</p>
              <p className="text-white/45 text-[11.5px] leading-5 mt-1">{f.d}</p>
            </div>
          ))}
        </div>

        <p className="relative text-white/35 text-[11px]">
          {faNum(db.users.length)} کاربر تعریف شده · {faNum(db.products.length)} کالا · {faNum(db.parties.length)} طرف حساب — آماده شروع کار
        </p>
      </div>
    </div>
  );
}
