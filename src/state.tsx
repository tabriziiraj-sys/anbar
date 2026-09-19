import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  DB, User, Company, Party, Product, StockDoc, Payment, Purchase, Expense,
  AuditAction, EntityName, Settings, Category,
} from "./lib/db";
import { loadDB, saveDB, resetDB, seedDB, uid, stockOf, SESSION_KEY, noLabel, loadFromServer, getSyncInfo } from "./lib/db";
import { PrintSheet } from "./components/ui";

/* ---------------- مسیریابی ---------------- */

export type Route =
  | "dashboard" | "company" | "users" | "parties" | "products"
  | "stock-in" | "stock-out" | "stock-onhand" | "stock-turn"
  | "deposits" | "payouts" | "ledger"
  | "purchases" | "services" | "expenses" | "misc-pay"
  | "rep-stock" | "rep-inout" | "rep-debtors" | "rep-creditors"
  | "rep-deposits" | "rep-expenses" | "rep-users"
  | "set-print" | "set-general";

export interface Params { [k: string]: string | undefined }

export interface SheetJob {
  kind: "sheet";
  title: string;
  subtitle?: string;
  meta?: [string, string][];
  head: string[];
  rows: (string | number)[][];
  foot?: string[];
}
export interface DocJob { kind: "doc"; docId: string }
export type PrintJob = SheetJob | DocJob;

interface Toast { id: string; msg: string; type: "ok" | "err" | "warn" }

interface AppCtx {
  db: DB;
  user: User | null;
  route: Route;
  params: Params;
  nav: (r: Route, p?: Params) => void;
  login: (u: string, p: string) => string | null;
  logout: () => void;
  serverConnected: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "error";

  toast: (msg: string, type?: Toast["type"]) => void;
  confirm: (msg: string) => Promise<boolean>;
  print: (job: PrintJob) => void;
  printJob: PrintJob | null;

  saveCompany: (c: Company) => void;
  saveUser: (u: { id?: string; fullName: string; username: string; password?: string; active: boolean }) => string | null;
  saveParty: (p: Party) => void;
  deleteParty: (id: string) => string | null;
  saveCategory: (name: string, id?: string) => string | null;
  deleteCategory: (id: string) => string | null;
  saveProduct: (p: Product) => string | null;
  deleteProduct: (id: string) => string | null;
  saveStockDoc: (d: StockDoc) => string | null;
  deleteStockDoc: (id: string) => void;
  savePayment: (p: Payment) => void;
  deletePayment: (id: string) => void;
  savePurchase: (p: Purchase) => void;
  deletePurchase: (id: string) => void;
  saveExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  saveSettings: (s: Settings) => void;
  resetAll: () => void;
  exportBackup: () => string;
  importBackup: (json: string) => string | null;
}

const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("AppCtx");
  return c;
};

/* ---------------- ارائه‌دهنده ---------------- */

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => loadDB());
  const [user, setUser] = useState<User | null>(() => {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return loadDB().users.find((u) => u.id === id) ?? null;
  });
  const [route, setRoute] = useState<Route>("dashboard");
  const [params, setParams] = useState<Params>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [confirmBox, setConfirmBox] = useState<{ msg: string; resolve: (v: boolean) => void } | null>(null);
  const [serverConnected, setServerConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const confirmRef = useRef(confirmBox);
  confirmRef.current = confirmBox;

  // Sync با سرور هنگام لود اولیه
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSyncStatus("syncing");
      const serverDb = await loadFromServer();
      if (cancelled) return;
      if (serverDb) {
        setServerConnected(true);
        // اگه سرور داده جدیدتری داره، آپدیت کن
        setDb((prev) => {
          if (serverDb.seq.in >= prev.seq.in && serverDb.seq.out >= prev.seq.out) {
            saveDB(serverDb);
            return serverDb;
          }
          return prev;
        });
        setSyncStatus("synced");
      } else {
        setServerConnected(false);
        setSyncStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* چاپ */
  useEffect(() => {
    if (!printJob) return;
    const t = setTimeout(() => window.print(), 180);
    const after = () => setPrintJob(null);
    window.addEventListener("afterprint", after);
    return () => { clearTimeout(t); window.removeEventListener("afterprint", after); };
  }, [printJob]);

  /* اعلان‌ها */
  const toast = useCallback((msg: string, type: Toast["type"] = "ok") => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const confirm = useCallback((msg: string) => {
    return new Promise<boolean>((resolve) => setConfirmBox({ msg, resolve }));
  }, []);

  /* ثبت تغییرات + حسابرسی */
  const commit = useCallback(
    (fn: (d: DB) => void, audit?: { action: AuditAction; entity: EntityName; ref: string }, actor?: User) => {
      setDb((prev) => {
        const d: DB = JSON.parse(JSON.stringify(prev));
        fn(d);
        const who = actor ?? user;
        if (audit && who) {
          d.audit.unshift({
            id: uid(), userId: who.id, userName: who.fullName,
            action: audit.action, entity: audit.entity, ref: audit.ref, at: Date.now(),
          });
          if (d.audit.length > 800) d.audit.length = 800;
        }
        saveDB(d);
        return d;
      });
    },
    [user]
  );

  const nav = useCallback((r: Route, p: Params = {}) => {
    setRoute(r);
    setParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ---------------- احراز هویت ---------------- */

  const login = useCallback((username: string, password: string): string | null => {
    const u = db.users.find((x) => x.username.trim().toLowerCase() === username.trim().toLowerCase());
    if (!u) return "نام کاربری یافت نشد.";
    if (u.password !== password) return "رمز عبور اشتباه است.";
    if (!u.active) return "حساب این کاربر غیرفعال شده است. با مدیر سیستم تماس بگیرید.";
    localStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
    commit(() => {}, { action: "login", entity: "login", ref: "ورود به سیستم" }, u);
    setRoute("dashboard");
    return null;
  }, [db.users, commit]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  /* ---------------- عملیات‌ها ---------------- */

  const saveCompany = (c: Company) =>
    commit((d) => { d.company = c; }, { action: "update", entity: "company", ref: "ویرایش اطلاعات شرکت" });

  const saveUser = (u: { id?: string; fullName: string; username: string; password?: string; active: boolean }): string | null => {
    const dup = db.users.find((x) => x.username.trim().toLowerCase() === u.username.trim().toLowerCase() && x.id !== u.id);
    if (dup) return "این نام کاربری قبلاً ثبت شده است.";
    if (!u.fullName.trim()) return "نام و نام خانوادگی الزامی است.";
    if (!u.username.trim()) return "نام کاربری الزامی است.";
    if (u.id) {
      commit((d) => {
        const t = d.users.find((x) => x.id === u.id)!;
        t.fullName = u.fullName.trim();
        t.username = u.username.trim();
        t.active = u.active;
        if (u.password) t.password = u.password;
      }, { action: "update", entity: "user", ref: `ویرایش کاربر «${u.fullName}»${u.password ? " + تغییر رمز" : ""}` });
    } else {
      if (!u.password || u.password.length < 4) return "رمز عبور حداقل ۴ کاراکتر باشد.";
      commit((d) => {
        d.users.push({ id: uid(), fullName: u.fullName.trim(), username: u.username.trim(), password: u.password!, active: u.active, createdAt: Date.now() });
      }, { action: "create", entity: "user", ref: `افزودن کاربر «${u.fullName}»` });
    }
    return null;
  };

  const saveParty = (p: Party) => {
    const exists = db.parties.some((x) => x.id === p.id);
    commit((d) => {
      const now = Date.now();
      if (exists) {
        const i = d.parties.findIndex((x) => x.id === p.id);
        d.parties[i] = { ...p, updatedBy: user?.fullName ?? "", updatedAt: now };
      } else {
        d.parties.push({ ...p, createdBy: user?.fullName ?? "", createdAt: now, updatedBy: user?.fullName ?? "", updatedAt: now });
      }
    }, {
      action: exists ? "update" : "create", entity: "party",
      ref: `${exists ? "ویرایش" : "ثبت"} طرف حساب «${p.name}»`,
    });
  };

  const deleteParty = (id: string): string | null => {
    const used =
      db.stockDocs.some((d) => d.partyId === id) ||
      db.payments.some((d) => d.partyId === id) ||
      db.purchases.some((d) => d.partyId === id) ||
      db.expenses.some((d) => d.partyId === id);
    if (used) return "این طرف حساب در اسناد استفاده شده و قابل حذف نیست. در صورت نیاز غیرفعال تلقی کنید.";
    const p = db.parties.find((x) => x.id === id);
    commit((d) => { d.parties = d.parties.filter((x) => x.id !== id); },
      { action: "delete", entity: "party", ref: `حذف طرف حساب «${p?.name}»` });
    return null;
  };

  const saveCategory = (name: string, id?: string): string | null => {
    const n = name.trim();
    if (!n) return "نام دسته‌بندی الزامی است.";
    const dup = db.categories.some((c) => c.name === n && c.id !== id);
    if (dup) return "این دسته‌بندی قبلاً ثبت شده است.";
    commit((d) => {
      if (id) d.categories = d.categories.map((c) => (c.id === id ? { ...c, name: n } : c));
      else d.categories.push({ id: uid(), name: n });
    }, { action: id ? "update" : "create", entity: "product", ref: `${id ? "ویرایش" : "ثبت"} دسته‌بندی «${n}»` });
    return null;
  };

  const deleteCategory = (id: string): string | null => {
    if (db.products.some((p) => p.categoryId === id)) return "کالایی در این دسته ثبت شده؛ ابتدا کالاها را منتقل کنید.";
    const c = db.categories.find((x) => x.id === id);
    commit((d) => { d.categories = d.categories.filter((x) => x.id !== id); },
      { action: "delete", entity: "product", ref: `حذف دسته‌بندی «${c?.name}»` });
    return null;
  };

  const saveProduct = (p: Product): string | null => {
    if (!p.name.trim() || !p.code.trim()) return "کد و نام کالا الزامی است.";
    const dup = db.products.some((x) => x.code.trim() === p.code.trim() && x.id !== p.id);
    if (dup) return "کد کالا تکراری است.";
    const exists = db.products.some((x) => x.id === p.id);
    commit((d) => {
      const now = Date.now();
      if (exists) {
        const i = d.products.findIndex((x) => x.id === p.id);
        d.products[i] = { ...p, updatedBy: user?.fullName ?? "", updatedAt: now };
      } else {
        d.products.push({ ...p, createdBy: user?.fullName ?? "", createdAt: now, updatedBy: user?.fullName ?? "", updatedAt: now });
      }
    }, {
      action: exists ? "update" : "create", entity: "product",
      ref: `${exists ? "ویرایش" : "ثبت"} کالا «${p.name}»`,
    });
    return null;
  };

  const deleteProduct = (id: string): string | null => {
    if (db.stockDocs.some((d) => d.items.some((i) => i.productId === id)))
      return "این کالا در اسناد ورود/خروج استفاده شده و قابل حذف نیست.";
    const p = db.products.find((x) => x.id === id);
    commit((d) => { d.products = d.products.filter((x) => x.id !== id); },
      { action: "delete", entity: "product", ref: `حذف کالا «${p?.name}»` });
    return null;
  };

  const saveStockDoc = (doc: StockDoc): string | null => {
    const editing = db.stockDocs.some((x) => x.id === doc.id);
    if (!editing) {
      doc.no = db.seq[doc.kind];
    }
    /* کنترل موجودی */
    if (doc.kind === "out" && !db.settings.allowNegative) {
      for (const it of doc.items) {
        const cur = stockOf(db, it.productId) - (editing
          ? (db.stockDocs.find((x) => x.id === doc.id)?.items.find((i) => i.productId === it.productId)?.qty ?? 0)
          : 0);
        if (it.qty > cur) {
          const name = db.products.find((p) => p.id === it.productId)?.name ?? "کالا";
          return `موجودی «${name}» کافی نیست. موجودی فعلی: ${cur.toLocaleString("fa-IR")} — برای اجازه خروج بیش از موجودی، تنظیمات عمومی را تغییر دهید.`;
        }
      }
    }
    const label = noLabel(doc.kind === "in" ? "و" : "خ", doc.no);
    const party = db.parties.find((x) => x.id === doc.partyId)?.name ?? "";
    commit((d) => {
      const now = Date.now();
      if (editing) {
        const i = d.stockDocs.findIndex((x) => x.id === doc.id);
        d.stockDocs[i] = { ...doc, updatedBy: user?.fullName ?? "", updatedAt: now };
      } else {
        d.seq[doc.kind]++;
        d.stockDocs.push({ ...doc, createdBy: user?.fullName ?? "", createdAt: now, updatedBy: user?.fullName ?? "", updatedAt: now });
      }
    }, {
      action: editing ? "update" : "create",
      entity: doc.kind === "in" ? "stockIn" : "stockOut",
      ref: `${editing ? "ویرایش" : "ثبت"} سند ${doc.kind === "in" ? "ورود" : "خروج"} ${label}${party ? " — " + party : ""}`,
    });
    return null;
  };

  const deleteStockDoc = (id: string) => {
    const doc = db.stockDocs.find((x) => x.id === id);
    if (!doc) return;
    const label = noLabel(doc.kind === "in" ? "و" : "خ", doc.no);
    commit((d) => { d.stockDocs = d.stockDocs.filter((x) => x.id !== id); },
      { action: "delete", entity: doc.kind === "in" ? "stockIn" : "stockOut", ref: `حذف سند ${doc.kind === "in" ? "ورود" : "خروج"} ${label}` });
  };

  const savePayment = (p: Payment) => {
    const editing = db.payments.some((x) => x.id === p.id);
    if (!editing) p.no = db.seq.pay;
    const party = db.parties.find((x) => x.id === p.partyId)?.name ?? (p.misc ? "متفرقه" : "");
    const kindFa = p.kind === "in" ? "واریزی" : "پرداختی";
    commit((d) => {
      const now = Date.now();
      if (editing) {
        const i = d.payments.findIndex((x) => x.id === p.id);
        d.payments[i] = { ...p, updatedBy: user?.fullName ?? "", updatedAt: now };
      } else {
        d.seq.pay++;
        d.payments.push({ ...p, createdBy: user?.fullName ?? "", createdAt: now, updatedBy: user?.fullName ?? "", updatedAt: now });
      }
    }, {
      action: editing ? "update" : "create", entity: "payment",
      ref: `${editing ? "ویرایش" : "ثبت"} ${kindFa} ${noLabel("ر", p.no)}${party ? " — " + party : ""}`,
    });
  };

  const deletePayment = (id: string) => {
    const p = db.payments.find((x) => x.id === id);
    if (!p) return;
    commit((d) => { d.payments = d.payments.filter((x) => x.id !== id); },
      { action: "delete", entity: "payment", ref: `حذف ${p.kind === "in" ? "واریزی" : "پرداختی"} ${noLabel("ر", p.no)}` });
  };

  const savePurchase = (p: Purchase) => {
    const editing = db.purchases.some((x) => x.id === p.id);
    if (!editing) p.no = db.seq.purchase;
    const party = db.parties.find((x) => x.id === p.partyId)?.name ?? "";
    commit((d) => {
      const now = Date.now();
      if (editing) {
        const i = d.purchases.findIndex((x) => x.id === p.id);
        d.purchases[i] = { ...p, updatedBy: user?.fullName ?? "", updatedAt: now };
      } else {
        d.seq.purchase++;
        d.purchases.push({ ...p, createdBy: user?.fullName ?? "", createdAt: now, updatedBy: user?.fullName ?? "", updatedAt: now });
      }
    }, {
      action: editing ? "update" : "create", entity: "purchase",
      ref: `${editing ? "ویرایش" : "ثبت"} فاکتور ${noLabel("فا", p.no)} «${p.title}»${party ? " — " + party : ""}`,
    });
  };

  const deletePurchase = (id: string) => {
    const p = db.purchases.find((x) => x.id === id);
    if (!p) return;
    commit((d) => { d.purchases = d.purchases.filter((x) => x.id !== id); },
      { action: "delete", entity: "purchase", ref: `حذف فاکتور ${noLabel("فا", p.no)} «${p.title}»` });
  };

  const saveExpense = (e: Expense) => {
    const editing = db.expenses.some((x) => x.id === e.id);
    if (!editing) e.no = db.seq.expense;
    const type = db.expenseTypes.find((x) => x.id === e.typeId)?.name ?? "";
    commit((d) => {
      const now = Date.now();
      if (editing) {
        const i = d.expenses.findIndex((x) => x.id === e.id);
        d.expenses[i] = { ...e, updatedBy: user?.fullName ?? "", updatedAt: now };
      } else {
        d.seq.expense++;
        d.expenses.push({ ...e, createdBy: user?.fullName ?? "", createdAt: now, updatedBy: user?.fullName ?? "", updatedAt: now });
      }
    }, {
      action: editing ? "update" : "create", entity: "expense",
      ref: `${editing ? "ویرایش" : "ثبت"} هزینه ${noLabel("ه", e.no)} — ${type}`,
    });
  };

  const deleteExpense = (id: string) => {
    const e = db.expenses.find((x) => x.id === id);
    if (!e) return;
    commit((d) => { d.expenses = d.expenses.filter((x) => x.id !== id); },
      { action: "delete", entity: "expense", ref: `حذف هزینه ${noLabel("ه", e.no)}` });
  };

  const saveSettings = (s: Settings) =>
    commit((d) => { d.settings = s; }, { action: "update", entity: "settings", ref: "تغییر تنظیمات سیستم" });

  const resetAll = () => {
    const fresh = resetDB();
    setDb(fresh);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const exportBackup = () => JSON.stringify(db, null, 2);

  const importBackup = (json: string): string | null => {
    try {
      const d = JSON.parse(json) as DB;
      if (!d || d.version !== 1 || !Array.isArray(d.users) || !Array.isArray(d.products))
        return "فایل پشتیبان معتبر نیست.";
      saveDB(d);
      setDb(d);
      return null;
    } catch {
      return "فایل قابل خواندن نیست.";
    }
  };

  const value: AppCtx = {
    db, user, route, params, nav, login, logout,
    serverConnected, syncStatus,
    toast, confirm, print: setPrintJob, printJob,
    saveCompany, saveUser, saveParty, deleteParty, saveCategory, deleteCategory,
    saveProduct, deleteProduct, saveStockDoc, deleteStockDoc,
    savePayment, deletePayment, savePurchase, deletePurchase,
    saveExpense, deleteExpense, saveSettings, resetAll, exportBackup, importBackup,
  };

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* ریشه چاپ */}
      <div id="print-root">
        {printJob && <PrintSheet job={printJob} db={db} />}
      </div>

      {/* اعلان‌ها */}
      <div className="print-hide fixed bottom-5 left-5 z-[90] flex flex-col gap-2 max-w-[340px]" dir="rtl">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "anim-toast shadow-lg shadow-black/10 rounded-lg px-4 py-3 text-[13px] font-medium border backdrop-blur-sm flex items-start gap-2.5 " +
              (t.type === "ok"
                ? "bg-pine-800 text-pine-50 border-pine-700"
                : t.type === "err"
                ? "bg-rose-700 text-rose-100 border-rose-500"
                : "bg-saffron-700 text-saffron-100 border-saffron-500")
            }
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {t.type === "ok" ? <path d="M20 6L9 17l-5-5" />
                : t.type === "err" ? <><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></>
                : <><path d="M12 3l10 18H2z" /><path d="M12 10v4m0 3h.01" /></>}
            </svg>
            <span className="leading-6">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* تأیید حذف */}
      {confirmBox && (
        <div className="print-hide fixed inset-0 z-[95] flex items-center justify-center p-4 anim-fade-in" dir="rtl">
          <div className="absolute inset-0 bg-night/55 backdrop-blur-[2px]" onClick={() => { confirmBox.resolve(false); setConfirmBox(null); }} />
          <div className="relative bg-card rounded-xl shadow-2xl border border-line w-full max-w-sm p-6 anim-pop">
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                <path d="M12 9v4m0 4h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-[15px] mb-1.5">نیاز به تأیید</h3>
            <p className="text-[13px] text-ink-2 leading-6 mb-5">{confirmBox.msg}</p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-[13px] font-semibold border border-line-2 hover:bg-paper transition-colors"
                onClick={() => { confirmBox.resolve(false); setConfirmBox(null); }}
              >
                انصراف
              </button>
              <button
                className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-rose-500 text-white hover:bg-rose-700 transition-colors"
                onClick={() => { confirmBox.resolve(true); setConfirmBox(null); }}
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
