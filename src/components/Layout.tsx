import { useState } from "react";
import type { ReactNode } from "react";
import { useApp } from "../state";
import type { Route } from "../state";
import { I, Avatar } from "./ui";
import { faDateLong, faNum } from "../lib/db";
import { todayISO } from "../lib/db";

interface MenuItem { r: Route; label: string; icon: string }
interface MenuGroup { group: string; items: MenuItem[] }

const MENU: MenuGroup[] = [
  { group: "", items: [{ r: "dashboard", label: "داشبورد", icon: "grid" }] },
  {
    group: "اطلاعات پایه",
    items: [
      { r: "company", label: "اطلاعات شرکت", icon: "building" },
      { r: "users", label: "کاربران", icon: "users" },
      { r: "parties", label: "طرف حساب‌ها", icon: "card" },
      { r: "products", label: "کالاها", icon: "box" },
    ],
  },
  {
    group: "انبار",
    items: [
      { r: "stock-in", label: "ورود کالا", icon: "trayIn" },
      { r: "stock-out", label: "خروج کالا", icon: "trayOut" },
      { r: "stock-onhand", label: "موجودی کالا", icon: "layers" },
      { r: "stock-turn", label: "گردش کالا", icon: "loop" },
    ],
  },
  {
    group: "طرف حساب‌ها",
    items: [
      { r: "deposits", label: "واریزی‌ها", icon: "wallet" },
      { r: "payouts", label: "پرداختی‌ها", icon: "banknote" },
      { r: "ledger", label: "گردش حساب", icon: "scale" },
    ],
  },
  {
    group: "فاکتورها و هزینه‌ها",
    items: [
      { r: "purchases", label: "خرید کالا", icon: "cart" },
      { r: "services", label: "فاکتور خدمات", icon: "wrench" },
      { r: "expenses", label: "هزینه‌ها", icon: "receipt" },
      { r: "misc-pay", label: "سایر پرداخت‌ها", icon: "hand" },
    ],
  },
  {
    group: "گزارشات",
    items: [
      { r: "rep-stock", label: "موجودی کالا", icon: "chart" },
      { r: "rep-inout", label: "ورود و خروج", icon: "loop" },
      { r: "rep-debtors", label: "بدهکاران", icon: "scale" },
      { r: "rep-creditors", label: "بستانکاران", icon: "hand" },
      { r: "rep-deposits", label: "واریزی‌ها", icon: "wallet" },
      { r: "rep-expenses", label: "هزینه‌ها", icon: "receipt" },
      { r: "rep-users", label: "عملکرد کاربران", icon: "users" },
    ],
  },
  {
    group: "تنظیمات",
    items: [
      { r: "set-print", label: "تنظیمات چاپ", icon: "printer" },
      { r: "set-general", label: "تنظیمات عمومی", icon: "gear" },
    ],
  },
];

const TITLES: Record<Route, string> = Object.fromEntries(
  MENU.flatMap((g) => g.items.map((i) => [i.r, i.label]))
) as Record<Route, string>;

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-4">
      <span className="w-10 h-10 rounded-xl bg-pine-600 flex items-center justify-center shadow-lg shadow-black/30 shrink-0 anim-float">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <path d="M16 5l9 5v10l-9 5-9-5V10z" fill="none" stroke="#f2c66d" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M7 10l9 5 9-5M16 15v10" fill="none" stroke="#f2c66d" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        <span className="block font-display text-[22px] leading-7 text-saffron-300">انبارینو</span>
        <span className="block text-[10.5px] text-white/45 font-medium tracking-wide">انبار و امور مالی شرکت</span>
      </span>
    </div>
  );
}

function NavList({ route, onNav, serverConnected }: { route: Route; onNav: (r: Route) => void; serverConnected: boolean }) {
  return (
    <nav className="px-3 pb-6 flex-1 overflow-y-auto">
      {MENU.map((g, gi) => (
        <div key={gi} className="mt-3">
          {g.group && (
            <div className="px-3 mb-1.5 text-[10.5px] font-bold text-white/35 tracking-wide">{g.group}</div>
          )}
          {g.items.map((it) => {
            const active = route === it.r;
            return (
              <button
                key={it.r}
                onClick={() => onNav(it.r)}
                className={`relative w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg mb-0.5 text-[13px] font-semibold transition-all duration-150 ${
                  active ? "bg-pine-600/25 text-saffron-300" : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && <span className="absolute inset-y-2 right-0 w-[3px] rounded-full bg-saffron-500" />}
                <I n={it.icon} className={`w-[17px] h-[17px] ${active ? "text-saffron-300" : "text-white/40"}`} />
                {it.label}
              </button>
            );
          })}
        </div>
      ))}
      <div className="mt-6 mx-2 rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] text-white/50 leading-5">
        <span className="text-saffron-300 font-bold">نسخه {faNum("1.0")}</span>
        <br />
        <>
          <span className="text-sky-400">✓ داده‌ها روی مرورگر (محلی) ذخیره می‌شوند</span>
          <br />
          <span className="text-white/40">حالت آفلاین — بدون نیاز به اینترنت</span>
        </>
      </div>
    </nav>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { route, nav, user, logout, db, serverConnected, syncStatus } = useApp();
  const [drawer, setDrawer] = useState(false);

  const go = (r: Route) => { nav(r); setDrawer(false); };

  return (
    <div className="app-screen flex min-h-screen app-bg">
      {/* سایدبار دسکتاپ */}
      <aside className="hidden lg:flex flex-col w-[248px] shrink-0 sticky top-0 h-screen bg-night bg-gradient-to-b from-night-2 via-night to-night border-l border-white/5"
        style={{ background: "linear-gradient(180deg,#123330 0%,#0c211e 45%,#0a1b19 100%)" }}>
        <Brand />
        <NavList route={route} onNav={go} serverConnected={serverConnected} />
      </aside>

      {/* سایدبار موبایل */}
      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden anim-fade-in">
          <div className="absolute inset-0 bg-night/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 right-0 w-[260px] flex flex-col anim-fade-up"
            style={{ background: "linear-gradient(180deg,#123330 0%,#0c211e 45%,#0a1b19 100%)" }}>
            <Brand />
            <NavList route={route} onNav={go} serverConnected={serverConnected} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* هدر */}
        <header className="sticky top-0 z-40 bg-card/85 backdrop-blur-md border-b border-line">
          <div className="flex items-center gap-3 px-4 lg:px-7 h-[60px]">
            <button className="lg:hidden w-9 h-9 rounded-lg border border-line-2 flex items-center justify-center text-ink-2" onClick={() => setDrawer(true)}>
              <I n="menu" className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="font-bold text-[15px] text-night truncate">{TITLES[route]}</h2>
            </div>
            <div className="mr-auto flex items-center gap-2.5">
              {/* نشانگر وضعیت ذخیره‌سازی */}
              <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1.5 border ${
                'text-sky-700 bg-sky-50 border-sky-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                {'محلی (مرورگر)'}
              </span>
              <span className="hidden md:flex items-center gap-2 text-[12px] text-ink-2 bg-paper border border-line rounded-lg px-3 py-1.5">
                <I n="calendar" className="w-4 h-4 text-pine-600" />
                {faDateLong(todayISO())}
              </span>
              <span className="hidden sm:block text-left leading-4">
                <span className="block text-[12.5px] font-bold text-night">{user?.fullName}</span>
                <span className="block text-[10.5px] text-ink-3">کاربر سیستم</span>
              </span>
              <Avatar name={user?.fullName ?? "؟"} />
              <button
                title="خروج از حساب"
                onClick={() => { if (window.confirm("از حساب کاربری خارج می‌شوید؟")) logout(); }}
                className="w-9 h-9 rounded-lg border border-line-2 flex items-center justify-center text-ink-3 hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-100/50 transition-colors"
              >
                <I n="logout" className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-7 max-w-[1400px] w-full mx-auto">
          {children}
          <footer className="mt-10 pb-4 text-center text-[11px] text-ink-3">
            {db.company.name} — سامانه انبارینو · تمامی عملیات با نام کاربر «{user?.fullName}» ثبت می‌شود
          </footer>
        </main>
      </div>
    </div>
  );
}
