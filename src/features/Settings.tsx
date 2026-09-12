import { useState } from "react";
import { useApp } from "../state";
import { faNum } from "../lib/db";
import { Btn, PageHead, Toggle, Field, Badge } from "../components/ui";

export function SettingsPrintPage() {
  const { db, saveSettings, toast } = useApp();
  const [p, setP] = useState({ ...db.settings.print });
  const [currency, setCurrency] = useState(db.settings.currency);

  return (
    <div>
      <PageHead title="تنظیمات چاپ" desc="شکل سربرگ و پاصفحه اسناد چاپی روی کاغذ A4 را مدیریت کنید."
        actions={<Btn icon="check" onClick={() => { saveSettings({ ...db.settings, print: p, currency }); toast("تنظیمات چاپ ذخیره شد."); }}>ذخیره تنظیمات</Btn>} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-card border border-line rounded-xl p-6 space-y-6 anim-fade-up">
          <Toggle checked={p.showLogo} onChange={(v) => setP({ ...p, showLogo: v })}
            label="نمایش لوگوی شرکت در سربرگ" desc="لوگو از بخش «اطلاعات پایه → اطلاعات شرکت» بارگذاری می‌شود." />
          <Toggle checked={p.showSign} onChange={(v) => setP({ ...p, showSign: v })}
            label="نمایش محل امضاء و مهر" desc="سه محل امضاء (تحویل‌دهنده، تحویل‌گیرنده، مهر) پایین سند چاپ می‌شود." />
          <Field label="واحد پول در اسناد">
            <select className="ctl" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="ریال">ریال</option>
              <option value="تومان">تومان</option>
            </select>
          </Field>
          <Field label="متن پاصفحه اسناد" hint="این متن زیر همه اسناد چاپی نمایش داده می‌شود.">
            <textarea className="ctl min-h-[80px]" value={p.footer} onChange={(e) => setP({ ...p, footer: e.target.value })} />
          </Field>
        </div>

        <div className="bg-card border border-line rounded-xl p-6 anim-fade-up" style={{ animationDelay: "80ms" }}>
          <h3 className="font-bold text-[13.5px] mb-3">پیش‌نمایش پاصفحه سند</h3>
          <div className="border border-line-2 rounded-lg p-5 text-[12px] leading-7 bg-white">
            <div className="flex justify-between border-t border-ink-2 pt-2 text-ink-2">
              <span>ثبت‌کننده: <b>علی احمدی</b></span>
              <span>تاریخ ثبت: <b>۱۴۰۵/۰۶/۱۰</b></span>
              <span>ساعت: <b>۱۴:۳۵</b></span>
            </div>
            {p.footer && <p className="text-center text-ink-3 mt-3">{p.footer}</p>}
            {p.showSign && (
              <div className="flex justify-around mt-10 text-ink-2">
                <span>امضاء تحویل‌دهنده: ____________</span>
                <span>امضاء تحویل‌گیرنده: ____________</span>
                <span>مهر و امضاء: ____________</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-ink-3 mt-3 leading-5">
            نام ثبت‌کننده، تاریخ و ساعت ثبت به‌صورت خودکار از مشخصات سند درج می‌شود و قابل حذف نیست — برای شفافیت کامل عملیات.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SettingsGeneralPage() {
  const { db, saveSettings, toast, confirm, resetAll, exportBackup, importBackup } = useApp();
  const [allow, setAllow] = useState(db.settings.allowNegative);

  const stats = [
    { l: "کالاها", v: db.products.length },
    { l: "طرف حساب‌ها", v: db.parties.length },
    { l: "اسناد ورود", v: db.stockDocs.filter((d) => d.kind === "in").length },
    { l: "اسناد خروج", v: db.stockDocs.filter((d) => d.kind === "out").length },
    { l: "دریافت/پرداخت", v: db.payments.length },
    { l: "فاکتورها", v: db.purchases.length },
    { l: "اسناد هزینه", v: db.expenses.length },
    { l: "گزارش حسابرسی", v: db.audit.length },
  ];

  return (
    <div>
      <PageHead title="تنظیمات عمومی" desc="رفتار سیستم، پشتیبان‌گیری و مدیریت داده‌های محلی." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-card border border-line rounded-xl p-6 anim-fade-up">
            <h3 className="font-bold text-[13.5px] mb-4">رفتار انبار</h3>
            <Toggle checked={allow} onChange={setAllow}
              label="اجازه خروج بیش از موجودی (موجودی منفی)"
              desc="وقتی خاموش باشد، سیستم اجازه ثبت سند خروج بیشتر از موجودی کالا را نمی‌دهد." />
            <div className="flex justify-end mt-4">
              <Btn icon="check" onClick={() => { saveSettings({ ...db.settings, allowNegative: allow }); toast("تنظیمات ذخیره شد."); }}>ذخیره</Btn>
            </div>
            {allow && (
              <div className="mt-3 flex items-start gap-2 bg-saffron-100 text-saffron-700 border border-saffron-500/30 rounded-lg px-3.5 py-2.5 text-[12px] font-semibold anim-pop">
                توجه: با فعال بودن این گزینه، موجودی کالا می‌تواند منفی شود و گزارش‌ها دقیق نخواهند بود.
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-xl p-6 anim-fade-up" style={{ animationDelay: "80ms" }}>
            <h3 className="font-bold text-[13.5px] mb-3">حجم داده‌های سیستم</h3>
            <div className="grid grid-cols-4 gap-2">
              {stats.map((s, i) => (
                <div key={i} className="bg-paper rounded-lg p-2.5 text-center">
                  <span className="block font-display text-[18px] text-night num">{faNum(s.v)}</span>
                  <span className="text-[10px] text-ink-3">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-line rounded-xl p-6 anim-fade-up" style={{ animationDelay: "60ms" }}>
            <h3 className="font-bold text-[13.5px] mb-1.5">پشتیبان‌گیری</h3>
            <p className="text-[12px] text-ink-3 leading-6 mb-4">
              داده‌ها در مرورگر همین دستگاه ذخیره می‌شوند. برای جلوگیری از دست رفتن اطلاعات، به‌صورت دوره‌ای فایل پشتیبان بگیرید و در جای امن نگهداری کنید.
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn icon="download" onClick={() => {
                const blob = new Blob([exportBackup()], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `anbarino-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
                toast("فایل پشتیبان دریافت شد.");
              }}>دریافت فایل پشتیبان</Btn>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold border border-line-2 bg-white text-ink hover:border-pine-500 hover:text-pine-600 cursor-pointer transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5V4.5" /><path d="M7.5 8.5L12 4l4.5 4.5" /><path d="M4 17.5v1A2.5 2.5 0 006.5 21h11a2.5 2.5 0 002.5-2.5v-1" /></svg>
                بازیابی از فایل پشتیبان
                <input type="file" accept=".json,application/json" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const ok = await confirm("با بازیابی، همه داده‌های فعلی با محتوای فایل جایگزین می‌شود. ادامه می‌دهید؟");
                  if (!ok) return;
                  const err = importBackup(await f.text());
                  if (err) toast(err, "err");
                  else toast("اطلاعات از فایل پشتیبان بازیابی شد.");
                }} />
              </label>
            </div>
          </div>

          <div className="bg-card border border-rose-500/30 rounded-xl p-6 anim-fade-up" style={{ animationDelay: "120ms" }}>
            <h3 className="font-bold text-[13.5px] text-rose-700 mb-1.5 flex items-center gap-2">
              بازنشانی سیستم <Badge tone="rose">خطرناک</Badge>
            </h3>
            <p className="text-[12px] text-ink-3 leading-6 mb-4">
              همه داده‌های واردشده حذف و داده‌های نمونه اولیه دوباره ساخته می‌شود. این عمل قابل بازگشت نیست — قبل از آن حتماً پشتیبان بگیرید.
            </p>
            <Btn variant="danger" icon="alert" onClick={async () => {
              const ok = await confirm("همه اطلاعات سیستم حذف و به حالت اولیه برگردد؟ این عمل قابل بازگشت نیست.");
              if (!ok) return;
              resetAll();
            }}>بازنشانی کامل داده‌ها</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
