import { useMemo, useState } from "react";
import { useApp } from "../state";
import type { Route } from "../state";
import { I, Badge, Btn, Avatar, EmptyState } from "../components/ui";
import { docTotal, faDate, faNum, money, partySum, stockOf } from "../lib/db";

function StatCard({ icon, label, value, sub, tone, delay, onClick }: {
  icon: string; label: string; value: string; sub: string;
  tone: "pine" | "saffron" | "rose" | "moss" | "night"; delay: number; onClick?: () => void;
}) {
  const tones = {
    pine: "bg-pine-50 text-pine-600",
    saffron: "bg-saffron-100 text-saffron-700",
    rose: "bg-rose-100 text-rose-500",
    moss: "bg-moss-100 text-moss-500",
    night: "bg-night-2 text-saffron-300",
  }[tone];
  return (
    <button onClick={onClick}
      className="anim-fade-up text-right bg-card border border-line rounded-xl p-4 hover:shadow-lg hover:shadow-night/5 hover:-translate-y-0.5 transition-all duration-200 group"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-3">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones}`}>
          <I n={icon} className="w-4.5 h-4.5" />
        </span>
        <I n="arrow" className="w-4 h-4 text-ink-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
      </div>
      <div className="font-display text-[23px] leading-7 text-night num">{value}</div>
      <div className="text-[12px] font-bold text-ink-2 mt-0.5">{label}</div>
      <div className="text-[10.5px] text-ink-3 mt-0.5">{sub}</div>
    </button>
  );
}

export default function Dashboard() {
  const { db, user, nav, serverConnected, syncStatus } = useApp();
  const [payTab, setPayTab] = useState<"in" | "out">("in");

  const stats = useMemo(() => {
    const products = db.products;
    let stockValue = 0, lowCount = 0, debtors = 0, creditors = 0, debtCount = 0, credCount = 0;
    for (const p of products) {
      const s = stockOf(db, p.id);
      stockValue += s * p.buyPrice;
      if (s <= p.minStock) lowCount++;
    }
    for (const pt of db.parties) {
      const b = partySum(db, pt.id).balance;
      if (b > 0) { debtors += b; debtCount++; }
      else if (b < 0) { creditors += -b; credCount++; }
    }
    return { products: products.length, stockValue, lowCount, debtors, creditors, debtCount, credCount, cats: db.categories.length };
  }, [db]);

  /* نمودار ۱۴ روز */
  const chart = useMemo(() => {
    const days: { label: string; inV: number; outV: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      let inV = 0, outV = 0;
      for (const doc of db.stockDocs) {
        if (doc.date !== iso) continue;
        if (doc.kind === "in") inV += docTotal(doc);
        else outV += docTotal(doc);
      }
      days.push({
        label: new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" }).format(d),
        inV, outV,
      });
    }
    const max = Math.max(1, ...days.map((d) => Math.max(d.inV, d.outV)));
    return { days, max };
  }, [db]);

  const lowProducts = useMemo(
    () => db.products
      .map((p) => ({ p, s: stockOf(db, p.id) }))
      .filter((x) => x.s <= x.p.minStock)
      .sort((a, b) => a.s - b.s)
      .slice(0, 5),
    [db]
  );

  const recentDocs = useMemo(() => [...db.stockDocs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5), [db]);
  const recentPays = useMemo(
    () => [...db.payments].filter((p) => p.kind === payTab).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [db, payTab]
  );
  const recentExpenses = useMemo(() => [...db.expenses].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5), [db]);

  const goto = (r: Route, p?: Record<string, string>) => nav(r, p);

  return (
    <div>
      {/* وضعیت ذخیره‌سازی */}
      <div className={`mb-4 rounded-xl border p-3.5 flex items-center gap-3 anim-fade-up ${
        serverConnected 
          ? 'bg-emerald-50 border-emerald-200' 
          : syncStatus === 'syncing'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-orange-50 border-orange-200'
      }`}>
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          serverConnected 
            ? 'bg-emerald-100 text-emerald-600' 
            : syncStatus === 'syncing'
            ? 'bg-amber-100 text-amber-600'
            : 'bg-orange-100 text-orange-600'
        }`}>
          {serverConnected ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01"/>
            </svg>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] font-bold ${
            serverConnected ? 'text-emerald-800' : syncStatus === 'syncing' ? 'text-amber-800' : 'text-orange-800'
          }`}>
            {serverConnected ? '✓ داده‌ها روی سرور (SQLite) ذخیره می‌شوند' : syncStatus === 'syncing' ? '⏳ در حال اتصال به سرور...' : '⚠ سرور در دسترس نیست'}
          </div>
          <div className="text-[11px] text-ink-3 mt-0.5">
            {serverConnected 
              ? 'اتصال برقرار — هر تغییر به‌صورت خودکار با پایگاه‌داده SQLite سرور همگام‌سازی می‌شود' 
              : syncStatus === 'syncing'
              ? 'لطفاً صبر کنید...'
              : 'سرور در دسترس نیست — لطفاً اتصال شبکه را بررسی کنید'}
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
          serverConnected 
            ? 'bg-emerald-200/60 text-emerald-700' 
            : syncStatus === 'syncing'
            ? 'bg-amber-200/60 text-amber-700'
            : 'bg-orange-200/60 text-orange-700'
        }`}>
          SQLite
        </span>
      </div>

      {/* خوش‌آمد + اقدامات سریع */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 anim-fade-up">
        <div>
          <h1 className="font-display text-[27px] leading-9 text-night">
            سلام، {user?.fullName.split(" ")[0]} — خوش آمدید
          </h1>
          <p className="text-[12.5px] text-ink-3 mt-0.5">خلاصه وضعیت انبار و امور مالی {db.company.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="soft" icon="trayIn" onClick={() => goto("stock-in", { new: "1" })}>ثبت ورود کالا</Btn>
          <Btn variant="saffron" icon="trayOut" onClick={() => goto("stock-out", { new: "1" })}>ثبت خروج کالا</Btn>
          <Btn variant="outline" icon="wallet" onClick={() => goto("deposits", { new: "1" })}>ثبت واریزی</Btn>
          <Btn variant="outline" icon="receipt" onClick={() => goto("expenses", { new: "1" })}>ثبت هزینه</Btn>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        <StatCard icon="box" tone="pine" delay={0} label="تعداد کالاها" value={faNum(stats.products)} sub={`${faNum(stats.cats)} دسته‌بندی فعال`} onClick={() => goto("products")} />
        <StatCard icon="layers" tone="moss" delay={60} label="ارزش تقریبی موجودی" value={money(stats.stockValue)} sub={`بر اساس قیمت خرید (${db.settings.currency})`} onClick={() => goto("rep-stock")} />
        <StatCard icon="alert" tone="rose" delay={120} label="کالاهای کم‌موجود" value={faNum(stats.lowCount)} sub={stats.lowCount ? "نیازمند تأمین فوری" : "همه کالاها در حد مجاز"} onClick={() => goto("rep-stock", { low: "1" })} />
        <StatCard icon="scale" tone="saffron" delay={180} label="مجموع بدهکاران" value={money(stats.debtors)} sub={`${faNum(stats.debtCount)} طرف حساب بدهکار`} onClick={() => goto("rep-debtors")} />
        <StatCard icon="hand" tone="night" delay={240} label="مجموع بستانکاران" value={money(stats.creditors)} sub={`${faNum(stats.credCount)} طرف حساب بستانکار`} onClick={() => goto("rep-creditors")} />
      </div>

      {/* نمودار + کم‌موجودها */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-5">
        <section className="xl:col-span-8 bg-card border border-line rounded-xl p-5 anim-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[14.5px]">ورود و خروج ۱۴ روز اخیر</h3>
              <p className="text-[11.5px] text-ink-3">مبلغ اسناد به {db.settings.currency}</p>
            </div>
            <div className="flex items-center gap-4 text-[11.5px] font-semibold text-ink-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-pine-500" /> ورود</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-saffron-500" /> خروج</span>
            </div>
          </div>
          <div className="flex items-end gap-[5px] h-[170px] pt-2">
            {chart.days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="text-[9.5px] text-ink-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.inV ? `و: ${money(d.inV / 1_000_000)}م` : ""} {d.outV ? `خ: ${money(d.outV / 1_000_000)}م` : ""}
                </div>
                <div className="w-full flex items-end justify-center gap-[3px] h-[130px]">
                  <div title={`ورود ${d.label}: ${money(d.inV)}`}
                    className="w-[9px] rounded-t-[3px] bg-pine-500 hover:bg-pine-600 anim-bar transition-colors"
                    style={{ height: `${Math.max(2, (d.inV / chart.max) * 100)}%`, animationDelay: `${i * 40}ms` }} />
                  <div title={`خروج ${d.label}: ${money(d.outV)}`}
                    className="w-[9px] rounded-t-[3px] bg-saffron-500 hover:bg-saffron-700 anim-bar transition-colors"
                    style={{ height: `${Math.max(2, (d.outV / chart.max) * 100)}%`, animationDelay: `${i * 40 + 60}ms` }} />
                </div>
                <span className={`text-[9px] text-ink-3 ${i % 2 ? "opacity-0" : ""} whitespace-nowrap`}>{d.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-4 bg-card border border-line rounded-xl p-5 anim-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[14.5px]">هشدار کمبود موجودی</h3>
            <Badge tone={lowProducts.length ? "rose" : "moss"}>{lowProducts.length ? `${faNum(lowProducts.length)} کالا` : "عادی"}</Badge>
          </div>
          {lowProducts.length === 0 ? (
            <EmptyState icon="check" title="موجودی همه کالاها کافی است" />
          ) : (
            <ul className="space-y-2">
              {lowProducts.map(({ p, s }) => (
                <li key={p.id} className="flex items-center gap-3 border border-rose-500/20 bg-rose-100/40 rounded-lg px-3 py-2.5 hover:bg-rose-100 transition-colors">
                  <span className="w-9 h-9 rounded-lg bg-white border border-line flex items-center justify-center text-[11px] font-bold text-pine-700 shrink-0">
                    {p.code.replace("K-", "")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold truncate">{p.name}</span>
                    <span className="text-[10.5px] text-ink-3">حداقل مجاز: {faNum(p.minStock)} {p.unit}</span>
                  </span>
                  <span className="text-left shrink-0">
                    <span className="block font-display text-[17px] text-rose-500 leading-5 num">{faNum(s)}</span>
                    <span className="text-[9.5px] text-ink-3">{p.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => goto("rep-stock", { low: "1" })} className="mt-3 w-full text-[12px] font-bold text-pine-600 hover:text-pine-700 py-2 rounded-lg border border-dashed border-line-2 hover:bg-pine-50 transition-colors">
            مشاهده گزارش کامل موجودی
          </button>
        </section>
      </div>

      {/* فهرست‌های اخیر */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ورود و خروج‌های اخیر */}
        <section className="bg-card border border-line rounded-xl anim-fade-up" style={{ animationDelay: "220ms" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h3 className="font-bold text-[13.5px]">ورود و خروج‌های اخیر</h3>
            <button onClick={() => goto("rep-inout")} className="text-[11.5px] font-bold text-pine-600 hover:text-pine-700">همه ←</button>
          </div>
          <ul className="divide-y divide-line">
            {recentDocs.length === 0 && <li className="p-6 text-center text-[12px] text-ink-3">سندی ثبت نشده است.</li>}
            {recentDocs.map((d) => {
              const isIn = d.kind === "in";
              return (
                <li key={d.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-paper/70 transition-colors cursor-pointer" onClick={() => goto(isIn ? "stock-in" : "stock-out", { view: d.id })}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isIn ? "bg-pine-50 text-pine-600" : "bg-saffron-100 text-saffron-700"}`}>
                    <I n={isIn ? "trayIn" : "trayOut"} className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold truncate">{db.parties.find((p) => p.id === d.partyId)?.name ?? "بدون طرف حساب"}</span>
                    <span className="text-[10.5px] text-ink-3">{faDate(d.date)} · {d.items.length} قلم · {d.createdBy}</span>
                  </span>
                  <span className="text-left shrink-0">
                    <span className={`block text-[12.5px] font-bold num ${isIn ? "text-pine-600" : "text-saffron-700"}`}>{money(docTotal(d))}</span>
                    <span className="text-[9.5px] text-ink-3">{db.settings.currency}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* دریافت و پرداخت */}
        <section className="bg-card border border-line rounded-xl anim-fade-up" style={{ animationDelay: "280ms" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h3 className="font-bold text-[13.5px]">دریافت و پرداخت اخیر</h3>
            <div className="flex bg-paper rounded-lg p-0.5 border border-line">
              {([["in", "واریزی‌ها"], ["out", "پرداختی‌ها"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setPayTab(k)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${payTab === k ? "bg-pine-600 text-white shadow-sm" : "text-ink-2 hover:text-pine-700"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-line">
            {recentPays.length === 0 && <li className="p-6 text-center text-[12px] text-ink-3">موردی ثبت نشده است.</li>}
            {recentPays.map((p) => (
              <li key={p.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-paper/70 transition-colors cursor-pointer"
                onClick={() => goto(p.kind === "in" ? "deposits" : p.misc ? "misc-pay" : "payouts", { view: p.id })}>
                <Avatar name={db.parties.find((x) => x.id === p.partyId)?.name ?? (p.misc ? "م" : "؟")} className="w-8 h-8 text-[11px]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold truncate">{db.parties.find((x) => x.id === p.partyId)?.name ?? "پرداخت متفرقه"}</span>
                  <span className="text-[10.5px] text-ink-3">{faDate(p.date)} · {p.method}</span>
                </span>
                <span className={`text-left shrink-0 text-[12.5px] font-bold num ${p.kind === "in" ? "text-pine-600" : "text-rose-500"}`}>
                  {p.kind === "in" ? "+" : "−"}{money(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* هزینه‌های اخیر */}
        <section className="bg-card border border-line rounded-xl anim-fade-up" style={{ animationDelay: "340ms" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h3 className="font-bold text-[13.5px]">هزینه‌های اخیر</h3>
            <button onClick={() => goto("rep-expenses")} className="text-[11.5px] font-bold text-pine-600 hover:text-pine-700">گزارش ←</button>
          </div>
          <ul className="divide-y divide-line">
            {recentExpenses.length === 0 && <li className="p-6 text-center text-[12px] text-ink-3">هزینه‌ای ثبت نشده است.</li>}
            {recentExpenses.map((e) => (
              <li key={e.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-paper/70 transition-colors cursor-pointer" onClick={() => goto("expenses", { view: e.id })}>
                <span className="w-8 h-8 rounded-lg bg-night-2 text-saffron-300 flex items-center justify-center shrink-0">
                  <I n="receipt" className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold truncate">{db.expenseTypes.find((t) => t.id === e.typeId)?.name}</span>
                  <span className="text-[10.5px] text-ink-3">{faDate(e.date)} · {e.createdBy}</span>
                </span>
                <span className="text-left shrink-0 text-[12.5px] font-bold num text-rose-500">−{money(e.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
