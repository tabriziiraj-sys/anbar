import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DB, StockDoc } from "../lib/db";
import { docTotal, faDate, faDateTime, faNum, faTime, fileToDataUrl, money, noLabel } from "../lib/db";
import type { PrintJob } from "../state";

/* ================= آیکون‌ها (SVG درون‌خطی) ================= */

const P: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  building: <><path d="M3 21h18" /><path d="M5 21V5a1 1 0 011-1h8a1 1 0 011 1v16" /><path d="M15 9h4a1 1 0 011 1v11" /><path d="M8 8h2m-2 4h2m-2 4h2" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M2.8 20c.6-3.4 3-5.2 6.2-5.2s5.6 1.8 6.2 5.2" /><path d="M15.5 4.6a3.2 3.2 0 010 6.8M17.8 14.9c2 .7 3.2 2.3 3.6 4.6" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20.2c.8-3.9 3.6-5.9 7-5.9s6.2 2 7 5.9" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 14.5h4" /></>,
  box: <><path d="M12 2.7l8.5 4.4v9.8L12 21.3l-8.5-4.4V7.1z" /><path d="M3.8 7.3L12 11.6l8.2-4.3" /><path d="M12 11.6v9.6" /></>,
  trayIn: <><path d="M12 3v10" /><path d="M8 9.5l4 4 4-4" /><path d="M3.5 13.5v4A2.5 2.5 0 006 20h12a2.5 2.5 0 002.5-2.5v-4" /></>,
  trayOut: <><path d="M12 13V3" /><path d="M8 6.5l4-4 4 4" /><path d="M3.5 13.5v4A2.5 2.5 0 006 20h12a2.5 2.5 0 002.5-2.5v-4" /></>,
  layers: <><path d="M12 3l9 4.7-9 4.7-9-4.7z" /><path d="M3.4 12.4L12 17l8.6-4.6" /><path d="M3.4 16.9L12 21.5l8.6-4.6" /></>,
  loop: <><path d="M20 12a8 8 0 11-2.3-5.6" /><path d="M20 3.5V8h-4.5" /></>,
  wallet: <><path d="M3 7.5A2.5 2.5 0 015.5 5h11A2.5 2.5 0 0119 7.5V9" /><path d="M3 7.5V17A2.5 2.5 0 005.5 19.5h13A2.5 2.5 0 0021 17v-5.5A2.5 2.5 0 0018.5 9H3" /><circle cx="16.5" cy="14.2" r="1.1" fill="currentColor" stroke="none" /></>,
  banknote: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 12h.01M18 12h.01" /></>,
  receipt: <><path d="M6 2.8h12a1 1 0 011 1V21l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3.8a1 1 0 011-1z" /><path d="M9 8h6M9 12h6" /></>,
  cart: <><circle cx="9" cy="19.5" r="1.6" /><circle cx="17" cy="19.5" r="1.6" /><path d="M3 4h2.5l2.2 11h9.8l2-8H7" /></>,
  wrench: <><path d="M14.5 6.5a4.5 4.5 0 006 5.7L14 18.7a2.3 2.3 0 01-3.2-3.2l6.5-6.5a4.5 4.5 0 00-5.7-6z" /><path d="M5 19l3-3" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7.5 15.5v-4M12 15.5V7.5M16.5 15.5v-6.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5L16 16" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  pencil: <><path d="M17 3.5a2.1 2.1 0 013 3L8.5 18l-4.5 1 1-4.5z" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V7" /><path d="M6.5 7l.8 12.5a1.5 1.5 0 001.5 1.5h6.4a1.5 1.5 0 001.5-1.5L17.5 7" /><path d="M10 11v6m4-6v6" /></>,
  printer: <><path d="M7 8V3.5h10V8" /><rect x="3.5" y="8" width="17" height="9" rx="2" /><path d="M7 14h10v6.5H7z" /></>,
  download: <><path d="M12 3.5v11" /><path d="M7.5 10.5l4.5 4.5 4.5-4.5" /><path d="M4 17.5v1A2.5 2.5 0 006.5 21h11a2.5 2.5 0 002.5-2.5v-1" /></>,
  x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  check: <><path d="M20 6.5L9.5 17 4 11.5" /></>,
  chevD: <><path d="M6 9.5l6 6 6-6" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  logout: <><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" /><path d="M15 8l4 4-4 4" /><path d="M19 12H9" /></>,
  menu: <><path d="M4 6.5h16M4 12h16M4 17.5h16" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4.5 17.5l4.8-4.5 3.2 3 2.5-2.3 4.5 4" /></>,
  upload: <><path d="M12 15.5V4.5" /><path d="M7.5 8.5L12 4l4.5 4.5" /><path d="M4 17.5v1A2.5 2.5 0 006.5 21h11a2.5 2.5 0 002.5-2.5v-1" /></>,
  alert: <><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9.5v4m0 3.5h.01" /></>,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M19 12a7 7 0 00-.15-1.4l2-1.55-2-3.46-2.35.95a7 7 0 00-2.42-1.4L13.7 2.7h-3.4l-.38 2.44a7 7 0 00-2.42 1.4l-2.35-.95-2 3.46 2 1.55a7 7 0 010 2.8l-2 1.55 2 3.46 2.35-.95a7 7 0 002.42 1.4l.38 2.44h3.4l.38-2.44a7 7 0 002.42-1.4l2.35.95 2-3.46-2-1.55c.1-.46.15-.92.15-1.4z" /></>,
  filter: <><path d="M4 5h16l-6.2 7.2v5.3L10.2 20v-7.8z" /></>,
  arrow: <><path d="M15 6l-6 6 6 6" /></>,
  file: <><path d="M6 2.8h8l4.5 4.5V21a1 1 0 01-1 1H6a1 1 0 01-1-1V3.8a1 1 0 011-1z" /><path d="M14 2.8V8h4.5" /></>,
  key: <><circle cx="8" cy="14.5" r="4.5" /><path d="M11.5 11.5L20 3" /><path d="M17.5 5.5l2.5 2.5M15 8l2 2" /></>,
  hand: <><path d="M8 12V6.5a1.5 1.5 0 013 0V11" /><path d="M11 10.5V4.8a1.5 1.5 0 013 0v5.7" /><path d="M14 10.5V6a1.5 1.5 0 013 0v6.8" /><path d="M17 12.8c0-1 .8-1.8 1.8-1.4.8.3 1 .9.7 1.9l-1.6 5A5 5 0 0113.2 22h-1.4a5 5 0 01-4-2l-3.4-4.4c-.7-.9-.3-2 .7-2.2.7-.1 1.3.2 1.7.8L8 15.5" /></>,
  scale: <><path d="M12 4v16M7 20h10" /><path d="M12 6.5L5.5 9m6.5-2.5L18.5 9" /><path d="M3 13.5L5.5 9 8 13.5a2.6 2.6 0 01-5 0zM16 13.5L18.5 9 21 13.5a2.6 2.6 0 01-5 0z" /></>,
};

export function I({ n, className = "w-5 h-5" }: { n: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[n] ?? P.box}
    </svg>
  );
}

/* ================= دکمه ================= */

type BtnProps = {
  variant?: "primary" | "outline" | "ghost" | "danger" | "soft" | "saffron";
  size?: "sm" | "md";
  icon?: string;
  className?: string;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Btn({ variant = "primary", size = "md", icon, className = "", children, ...rest }: BtnProps) {
  const v = {
    primary: "bg-pine-600 text-white hover:bg-pine-700 active:bg-pine-800 shadow-sm shadow-pine-800/20",
    saffron: "bg-saffron-500 text-night hover:bg-saffron-300 shadow-sm",
    outline: "border border-line-2 bg-white text-ink hover:border-pine-500 hover:text-pine-600",
    ghost: "text-ink-2 hover:bg-pine-50 hover:text-pine-700",
    soft: "bg-pine-50 text-pine-700 hover:bg-pine-100",
    danger: "bg-rose-100 text-rose-700 hover:bg-rose-500 hover:text-white",
  }[variant];
  const s = size === "sm" ? "px-2.5 py-1.5 text-[12px] rounded-md gap-1.5" : "px-4 py-2.5 text-[13px] rounded-lg gap-2";
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none ${v} ${s} ${className}`}
      {...rest}
    >
      {icon && <I n={icon} className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
      {children}
    </button>
  );
}

export function IconBtn({ icon, title, onClick, tone = "gray" }: { icon: string; title: string; onClick: (e: React.MouseEvent) => void; tone?: "gray" | "rose" | "pine" | "saffron" }) {
  const t = {
    gray: "text-ink-3 hover:text-pine-700 hover:bg-pine-50",
    rose: "text-ink-3 hover:text-rose-700 hover:bg-rose-100",
    pine: "text-pine-600 hover:bg-pine-50",
    saffron: "text-ink-3 hover:text-saffron-700 hover:bg-saffron-100",
  }[tone];
  return (
    <button title={title} onClick={onClick} className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors ${t}`}>
      <I n={icon} className="w-4 h-4" />
    </button>
  );
}

/* ================= فرم ================= */

export function Field({ label, required, hint, error, children, className = "" }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[12px] font-bold text-ink-2 mb-1.5">
        {label}
        {required && <span className="text-rose-500 mx-0.5">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-[11px] text-ink-3 mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-rose-500 font-semibold mt-1">{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-right group w-full">
      <span className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${checked ? "bg-pine-600" : "bg-line-2"}`}>
        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "right-[21px]" : "right-[3px]"}`} />
      </span>
      <span>
        <span className="block text-[13px] font-bold text-ink group-hover:text-pine-700 transition-colors">{label}</span>
        {desc && <span className="block text-[11.5px] text-ink-3 leading-5">{desc}</span>}
      </span>
    </button>
  );
}

export function Avatar({ name, className = "w-9 h-9 text-[13px]" }: { name: string; className?: string }) {
  const colors = ["bg-pine-600", "bg-saffron-500 text-night", "bg-moss-500", "bg-rose-500", "bg-night-3"];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return (
    <span className={`inline-flex items-center justify-center rounded-full text-white font-bold shrink-0 ${colors[h % colors.length]} ${className}`}>
      {name.trim().slice(0, 1)}
    </span>
  );
}

export function Badge({ tone = "gray", children }: { tone?: "pine" | "rose" | "saffron" | "moss" | "gray" | "night"; children: ReactNode }) {
  const t = {
    pine: "bg-pine-50 text-pine-700 border-pine-200",
    rose: "bg-rose-100 text-rose-700 border-rose-500/25",
    saffron: "bg-saffron-100 text-saffron-700 border-saffron-500/30",
    moss: "bg-moss-100 text-moss-700 border-moss-500/25",
    gray: "bg-paper text-ink-2 border-line-2",
    night: "bg-night-2 text-saffron-300 border-night-3",
  }[tone];
  return <span className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-md border text-[11px] font-bold whitespace-nowrap ${t}`}>{children}</span>;
}

/* ================= سرصفحه ================= */

export function PageHead({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5 anim-fade-up">
      <div>
        <h1 className="font-display text-[26px] leading-9 text-night">{title}</h1>
        {desc && <p className="text-[12.5px] text-ink-3 mt-0.5">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-[330px]">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"><I n="search" className="w-4 h-4" /></span>
      <input className="ctl pr-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "جستجو..."} />
      {value && (
        <button className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-rose-500" onClick={() => onChange("")}>
          <I n="x" className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ================= مودال ================= */

export function Modal({ title, icon, onClose, children, wide = false, footer }: { title: string; icon?: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-5 anim-fade-in" dir="rtl">
      <div className="absolute inset-0 bg-night/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-card w-full ${wide ? "max-w-3xl" : "max-w-lg"} sm:rounded-xl rounded-t-xl shadow-2xl border border-line anim-pop max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line shrink-0">
          <h3 className="font-bold text-[15px] flex items-center gap-2.5">
            {icon && <span className="w-8 h-8 rounded-lg bg-pine-50 text-pine-600 flex items-center justify-center"><I n={icon} className="w-4.5 h-4.5" /></span>}
            {title}
          </h3>
          <button className="w-8 h-8 rounded-md flex items-center justify-center text-ink-3 hover:bg-rose-100 hover:text-rose-500 transition-colors" onClick={onClose}>
            <I n="x" className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto grow">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line flex justify-end gap-2 shrink-0 bg-paper/60 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

/* ================= جدول داده ================= */

export interface Col<T> {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  sortVal?: (r: T) => string | number;
  cls?: string;
  render: (r: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, keyFor, onRow, empty, footer }: {
  columns: Col<T>[];
  rows: T[];
  keyFor: (r: T) => string;
  onRow?: (r: T) => void;
  empty?: ReactNode;
  footer?: ReactNode;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortVal) return rows;
    return [...rows].sort((a, b) => {
      const va = col.sortVal!(a), vb = col.sortVal!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "fa") * dir;
    });
  }, [rows, sortKey, dir, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const cur = Math.min(page, pages - 1);
  const view = sorted.slice(cur * size, cur * size + size);

  const clickSort = (c: Col<T>) => {
    if (!c.sortable) return;
    if (sortKey === c.key) setDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(c.key); setDir(-1); }
  };

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden anim-fade-up">
      <div className="overflow-x-auto max-h-[62vh]">
        <table className="tbl min-w-[640px]">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.cls}>
                  {c.sortable ? (
                    <button className="inline-flex items-center gap-1 hover:text-pine-700 transition-colors" onClick={() => clickSort(c)}>
                      {c.label}
                      <span className={`text-[9px] transition-transform ${sortKey === c.key ? "text-pine-600" : "text-ink-3"} ${sortKey === c.key && dir === 1 ? "rotate-180" : ""}`}>
                        <I n="chevD" className="w-3 h-3" />
                      </span>
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={keyFor(r)} className={onRow ? "cursor-pointer" : ""} onClick={() => onRow?.(r)}>
                {columns.map((c) => <td key={c.key} className={c.cls}>{c.render(r)}</td>)}
              </tr>
            ))}
            {view.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  {empty ?? <EmptyState title="رکوردی یافت نشد" desc="با این فیلترها موردی وجود ندارد. فیلترها را تغییر دهید یا رکورد جدید ثبت کنید." />}
                </td>
              </tr>
            )}
          </tbody>
          {footer && view.length > 0 && <tfoot>{footer}</tfoot>}
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-line bg-paper/50 text-[12px] text-ink-2">
        <div className="flex items-center gap-2">
          <span>نمایش</span>
          <select className="ctl !w-auto !py-1 !px-2 !text-[12px]" value={size} onChange={(e) => { setSize(+e.target.value); setPage(0); }}>
            {[10, 25, 50].map((s) => <option key={s} value={s}>{faNum(s)}</option>)}
          </select>
          <span>از {faNum(sorted.length)} رکورد</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-md border border-line-2 flex items-center justify-center hover:bg-pine-50 disabled:opacity-40 disabled:pointer-events-none" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
            <I n="chevD" className="w-3.5 h-3.5 -rotate-90" />
          </button>
          <span className="px-2 font-bold">{faNum(cur + 1)} / {faNum(pages)}</span>
          <button className="w-7 h-7 rounded-md border border-line-2 flex items-center justify-center hover:bg-pine-50 disabled:opacity-40 disabled:pointer-events-none" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
            <I n="chevD" className="w-3.5 h-3.5 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, desc, icon = "box" }: { title: string; desc?: string; icon?: string }) {
  return (
    <div className="py-12 text-center">
      <span className="w-14 h-14 rounded-2xl bg-paper border border-line inline-flex items-center justify-center text-ink-3 mb-3">
        <I n={icon} className="w-7 h-7" />
      </span>
      <p className="font-bold text-[13.5px] text-ink-2">{title}</p>
      {desc && <p className="text-[12px] text-ink-3 mt-1 max-w-[300px] mx-auto leading-5">{desc}</p>}
    </div>
  );
}

/* ================= آپلود تصویر ================= */

export function ImageInput({ value, onChange, label = "تصویر" }: { value: string | null; onChange: (v: string | null) => void; label?: string }) {
  return (
    <div>
      <span className="block text-[12px] font-bold text-ink-2 mb-1.5">{label}</span>
      <div className="flex items-center gap-3">
        <span className="w-16 h-16 rounded-lg border border-dashed border-line-2 bg-paper flex items-center justify-center overflow-hidden shrink-0">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <I n="image" className="w-6 h-6 text-ink-3" />}
        </span>
        <div className="flex flex-col gap-1.5">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-pine-50 text-pine-700 text-[12px] font-bold cursor-pointer hover:bg-pine-100 transition-colors w-fit">
            <I n="upload" className="w-3.5 h-3.5" />
            بارگذاری تصویر
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              onChange(await fileToDataUrl(f));
            }} />
          </label>
          {value && (
            <button type="button" className="text-[11.5px] text-rose-500 font-semibold w-fit hover:underline" onClick={() => onChange(null)}>حذف تصویر</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= برگه چاپ A4 ================= */

export function PrintSheet({ job, db }: { job: PrintJob; db: DB }) {
  const c = db.company;
  const s = db.settings;

  const Letterhead = ({ title, no }: { title: string; no: string }) => (
    <div className="letterhead-rule">
      <table style={{ border: "none", width: "100%" }}>
        <tbody>
          <tr>
            {s.print.showLogo && (
              <td style={{ border: "none", width: 64, verticalAlign: "middle" }}>
                {c.logo
                  ? <img src={c.logo} alt="logo" style={{ width: 58, height: 58, objectFit: "contain" }} />
                  : (
                    <svg viewBox="0 0 32 32" width="52" height="52">
                      <rect width="32" height="32" rx="8" fill="#0b574d" />
                      <path d="M16 6l9 5v10l-9 5-9-5V11z" fill="none" stroke="#f2c66d" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M7 11l9 5 9-5M16 16v10" fill="none" stroke="#f2c66d" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  )}
              </td>
            )}
            <td style={{ border: "none", verticalAlign: "middle" }}>
              <div style={{ fontFamily: "Lalezar, Vazirmatn", fontSize: 21, color: "#0b574d", lineHeight: 1.3 }}>{c.name}</div>
              <div style={{ fontSize: 10.5, color: "#444" }}>{c.address}</div>
              <div style={{ fontSize: 10.5, color: "#444" }}>
                تلفن: {c.phone} {c.mobile ? `— همراه: ${c.mobile}` : ""}
                {c.economicCode ? ` — کد اقتصادی: ${c.economicCode}` : ""}
                {c.nationalId ? ` — شناسه ملی: ${c.nationalId}` : ""}
                {c.regNo ? ` — شماره ثبت: ${c.regNo}` : ""}
              </div>
            </td>
            <td style={{ border: "none", width: 170, verticalAlign: "middle", textAlign: "center" }}>
              <div style={{ border: "1.5px solid #0b574d", borderRadius: 8, padding: "6px 10px", display: "inline-block", minWidth: 130 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0b574d" }}>{title}</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>شماره: <b>{no}</b></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const localISO = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const Foot = ({ doc }: { doc?: StockDoc }) => (
    <div style={{ marginTop: 22 }}>
      {doc && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderTop: "1px solid #999", paddingTop: 8, flexWrap: "wrap", gap: 6 }}>
          <span>ثبت‌کننده: <b>{doc.createdBy}</b></span>
          <span>تاریخ ثبت: <b>{faDate(localISO(doc.createdAt))}</b></span>
          <span>ساعت: <b>{faTime(doc.createdAt)}</b></span>
          {doc.updatedAt !== doc.createdAt && <span>آخرین ویرایش: {faDateTime(doc.updatedAt)}</span>}
        </div>
      )}
      {s.print.footer && <div style={{ textAlign: "center", fontSize: 11, color: "#555", marginTop: 14 }}>{s.print.footer}</div>}
      {s.print.showSign && (
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 42, fontSize: 12 }}>
          <span>امضاء تحویل‌دهنده: ______________</span>
          <span>امضاء تحویل‌گیرنده: ______________</span>
          <span>مهر و امضاء: ______________</span>
        </div>
      )}
    </div>
  );

  if (job.kind === "doc") {
    const doc = db.stockDocs.find((d) => d.id === job.docId);
    if (!doc) return null;
    const isIn = doc.kind === "in";
    return (
      <div className="print-sheet">
        <Letterhead title={isIn ? "سند ورود کالا" : "سند خروج کالا"} no={noLabel(isIn ? "و" : "خ", doc.no)} />
        <table style={{ marginTop: 10 }}>
          <tbody>
            <tr>
              <th style={{ width: 90 }}>تاریخ سند</th><td>{faDate(doc.date)}</td>
              <th style={{ width: 90 }}>طرف حساب</th><td>{db.parties.find((p) => p.id === doc.partyId)?.name ?? "—"}</td>
            </tr>
            {doc.note && (
              <tr><th>توضیحات</th><td colSpan={3}>{doc.note}</td></tr>
            )}
          </tbody>
        </table>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 38 }}>ردیف</th>
              <th style={{ width: 80 }}>کد کالا</th>
              <th>نام کالا</th>
              <th style={{ width: 60 }}>واحد</th>
              <th style={{ width: 70 }}>تعداد</th>
              <th style={{ width: 110 }}>قیمت واحد ({s.currency})</th>
              <th style={{ width: 130 }}>مبلغ کل</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((it, i) => {
              const p = db.products.find((x) => x.id === it.productId);
              return (
                <tr key={i}>
                  <td>{faNum(i + 1)}</td>
                  <td>{p?.code ?? "—"}</td>
                  <td>{p?.name ?? "کالای حذف‌شده"}</td>
                  <td>{p?.unit ?? "—"}</td>
                  <td>{faNum(it.qty)}</td>
                  <td>{money(it.price)}</td>
                  <td><b>{money(it.qty * it.price)}</b></td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={6} style={{ textAlign: "left", fontWeight: 800 }}>جمع کل</td>
              <td style={{ fontWeight: 800 }}>{money(docTotal(doc))} {s.currency}</td>
            </tr>
          </tbody>
        </table>
        <Foot doc={doc} />
      </div>
    );
  }

  /* برگه گزارش */
  return (
    <div className="print-sheet">
      <Letterhead title={job.title} no={job.subtitle ?? ""} />
      {job.meta && (
        <div style={{ fontSize: 11.5, color: "#444", margin: "6px 0 10px", display: "flex", gap: 18, flexWrap: "wrap" }}>
          {job.meta.map(([k, v], i) => <span key={i}>{k}: <b>{v}</b></span>)}
        </div>
      )}
      <table>
        <thead>
          <tr>{job.head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {job.rows.map((r, i) => (
            <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
          {job.rows.length === 0 && (
            <tr><td colSpan={job.head.length} style={{ textAlign: "center", color: "#777" }}>رکوردی وجود ندارد</td></tr>
          )}
        </tbody>
      </table>
      {job.foot && (
        <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 12, fontWeight: 700 }}>
          {job.foot.map((f, i) => <span key={i}>{f}</span>)}
        </div>
      )}
      <Foot />
    </div>
  );
}
