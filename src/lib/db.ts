/* ============================================================
   موتور داده انبارینو — طرح معادل SQLite
   جداول: users, company, parties, product_categories, products,
   stock_docs, stock_doc_items, payments, purchases, expenses,
   expense_types, audit_logs, settings
   ذخیره‌سازی: localStorage (کاملاً آفلاین)
   ============================================================ */

export type PartyType = "customer" | "supplier" | "other";
export type DocKind = "in" | "out";
export type PayKind = "in" | "out";
export type PurchaseType = "goods" | "service" | "equipment" | "office";
export type AuditAction = "create" | "update" | "delete" | "login";
export type EntityName =
  | "login" | "user" | "company" | "party" | "product"
  | "stockIn" | "stockOut" | "payment" | "purchase" | "expense" | "settings";

export interface User {
  id: string;
  fullName: string;
  username: string;
  password: string;
  active: boolean;
  createdAt: number;
}

export interface Company {
  name: string;
  logo: string | null;
  phone: string;
  mobile: string;
  address: string;
  economicCode: string;
  nationalId: string;
  regNo: string;
  note: string;
}

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  phone: string;
  mobile: string;
  address: string;
  nationalId: string;
  note: string;
  createdBy: string; createdAt: number;
  updatedBy: string; updatedAt: number;
}

export interface Category { id: string; name: string }

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  unit: string;
  image: string | null;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  note: string;
  createdBy: string; createdAt: number;
  updatedBy: string; updatedAt: number;
}

export interface StockItem { productId: string; qty: number; price: number }

export interface StockDoc {
  id: string;
  kind: DocKind;
  no: number;
  date: string;            // ISO (yyyy-mm-dd)
  partyId: string | null;
  note: string;
  items: StockItem[];
  createdBy: string; createdAt: number;
  updatedBy: string; updatedAt: number;
}

export interface Payment {
  id: string;
  kind: PayKind;
  misc: boolean;           // پرداخت متفرقه (بدون تسویه حساب)
  no: number;
  date: string;
  partyId: string | null;
  amount: number;
  method: string;
  refNo: string;
  note: string;
  createdBy: string; createdAt: number;
  updatedBy: string; updatedAt: number;
}

export interface Purchase {
  id: string;
  type: PurchaseType;
  no: number;
  date: string;
  partyId: string | null;
  title: string;
  amount: number;
  note: string;
  image: string | null;
  createdBy: string; createdAt: number;
  updatedBy: string; updatedAt: number;
}

export interface Expense {
  id: string;
  no: number;
  date: string;
  typeId: string;
  partyId: string | null;
  amount: number;
  method: string;
  note: string;
  image: string | null;
  createdBy: string; createdAt: number;
  updatedBy: string; updatedAt: number;
}

export interface ExpenseType { id: string; name: string }

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: EntityName;
  ref: string;
  at: number;
}

export interface Settings {
  allowNegative: boolean;
  currency: string;
  print: { showLogo: boolean; showSign: boolean; footer: string };
}

export interface DB {
  version: number;
  seq: { in: number; out: number; pay: number; purchase: number; expense: number };
  users: User[];
  company: Company;
  parties: Party[];
  categories: Category[];
  products: Product[];
  stockDocs: StockDoc[];
  payments: Payment[];
  purchases: Purchase[];
  expenses: Expense[];
  expenseTypes: ExpenseType[];
  audit: AuditLog[];
  settings: Settings;
}

/* ---------------- کلیدها و برچسب‌ها ---------------- */

export const PARTY_TYPE_FA: Record<PartyType, string> = {
  customer: "مشتری", supplier: "فروشنده", other: "سایر",
};
export const PURCHASE_TYPE_FA: Record<PurchaseType, string> = {
  goods: "خرید کالا", service: "خدمات", equipment: "تجهیزات", office: "لوازم اداری",
};
export const PAY_METHODS = ["کارت به کارت", "واریز بانکی", "نقدی", "سایر"];
export const ENTITY_FA: Record<EntityName, string> = {
  login: "ورود به سیستم", user: "کاربر", company: "اطلاعات شرکت", party: "طرف حساب",
  product: "کالا", stockIn: "ورود کالا", stockOut: "خروج کالا",
  payment: "دریافت/پرداخت", purchase: "فاکتور خرید", expense: "هزینه", settings: "تنظیمات",
};
export const ACTION_FA: Record<AuditAction, string> = {
  create: "ثبت", update: "ویرایش", delete: "حذف", login: "ورود",
};

/* ---------------- ابزارهای عمومی ---------------- */

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const tsAgo = (days: number, h = 10, m = 20) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

export const faNum = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export const money = (n: number) => {
  const r = Math.round(n);
  return (r < 0 ? "−" : "") + faNum(Math.abs(r).toLocaleString("en-US")).replace(/,/g, "٬");
};

export const faDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};
export const faDateLong = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
};
export const faTime = (ts: number) =>
  new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
export const faDateTime = (ts: number) =>
  new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts)) +
  " — " + faTime(ts);

export const noLabel = (prefix: string, no: number) => `${prefix}‑${faNum(no)}`;

/* ---------------- محاسبات انبار و حساب ---------------- */

export const docTotal = (d: StockDoc) =>
  d.items.reduce((s, i) => s + i.qty * i.price, 0);

export const stockOf = (db: DB, productId: string) =>
  db.stockDocs.reduce(
    (s, d) =>
      s + d.items
        .filter((i) => i.productId === productId)
        .reduce((a, i) => a + (d.kind === "in" ? i.qty : -i.qty), 0),
    0
  );

export interface PartyLedgerSum {
  docInSum: number; docOutSum: number; depSum: number; paySum: number; balance: number;
}
/** balance > 0 ⇒ طرف حساب بدهکار | balance < 0 ⇒ بستانکار */
export const partySum = (db: DB, partyId: string): PartyLedgerSum => {
  let docInSum = 0, docOutSum = 0, depSum = 0, paySum = 0;
  for (const d of db.stockDocs) {
    if (d.partyId !== partyId) continue;
    if (d.kind === "in") docInSum += docTotal(d);
    else docOutSum += docTotal(d);
  }
  for (const p of db.payments) {
    if (p.partyId !== partyId) continue;
    if (p.kind === "in") depSum += p.amount;
    else paySum += p.amount;
  }
  return { docInSum, docOutSum, depSum, paySum, balance: docOutSum - docInSum - depSum + paySum };
};

/* ---------------- فایل و خروجی ---------------- */

export function fileToDataUrl(file: File, max = 560): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(mime, 0.85));
      };
      img.onerror = () => reject(new Error("img"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------------- بارگذاری / ذخیره / داده نمونه ---------------- */

const DB_KEY = "anbarino_db_v1";
export const SESSION_KEY = "anbarino_session";

export function saveDB(db: DB) {
  // ذخیره در localStorage (cache محلی)
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  catch { /* حجم زیاد */ }
  
  // Sync به سرور SQLite
  syncToServer(db);
}

// وضعیت آخرین sync
let _lastSyncToServer: number | null = null;
let _syncError: string | null = null;
export const getSyncInfo = () => ({ lastSync: _lastSyncToServer, error: _syncError });

async function syncToServer(db: DB) {
  try {
    // اول health check
    const healthRes = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
    if (!healthRes.ok) throw new Error("Server unavailable");
    
    // sync کامل دیتابیس به سرور
    const res = await fetch("/api/sync/full", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(db),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      _lastSyncToServer = Date.now();
      _syncError = null;
    } else {
      _syncError = `HTTP ${res.status}`;
    }
  } catch (err: any) {
    _syncError = err?.message || "Sync failed";
  }
}

export async function loadFromServer(): Promise<DB | null> {
  try {
    const res = await fetch("/api/sync/full", { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version === 1) {
        return data as DB;
      }
    }
  } catch {
    // سرور در دسترس نیست
  }
  return null;
}

export async function loadDBAsync(): Promise<DB> {
  // اول از سرور SQLite بخون
  try {
    const serverDb = await loadFromServer();
    if (serverDb) {
      // ذخیره در localStorage برای cache
      saveDB(serverDb);
      return serverDb;
    }
  } catch { /* سرور در دسترس نیست */ }
  
  // اگه سرور نبود، از localStorage بخون
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.version === 1) return db;
    }
  } catch { /* داده خراب → بازسازی */ }
  
  // اگه هیچی نبود، داده نمونه بساز
  const fresh = seedDB();
  saveDB(fresh);
  return fresh;
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.version === 1) return db;
    }
  } catch { /* داده خراب → بازسازی */ }
  const fresh = seedDB();
  saveDB(fresh);
  return fresh;
}

export function seedDB(): DB {
  const U1 = "u-admin", U2 = "u-sara";
  const n1 = "علی احمدی", n2 = "سارا محمدی";
  const A = "علی احمدی";
  const st = (by: string, days: number, h = 10, m = 15) => ({
    createdBy: by, createdAt: tsAgo(days, h, m), updatedBy: by, updatedAt: tsAgo(days, h, m + 6),
  });

  const categories: Category[] = [
    { id: "c1", name: "مواد غذایی" },
    { id: "c2", name: "نوشیدنی" },
    { id: "c3", name: "شوینده و بهداشتی" },
    { id: "c4", name: "خشکبار و ادویه" },
  ];

  const P = (
    id: string, code: string, name: string, categoryId: string, unit: string,
    minStock: number, buyPrice: number, sellPrice: number, note = ""
  ): Product => ({ id, code, name, categoryId, unit, image: null, minStock, buyPrice, sellPrice, note, ...st(A, 40) });

  const products: Product[] = [
    P("p1", "K-1001", "برنج طارم ممتاز ۱۰ کیلویی", "c1", "کیسه", 15, 8_900_000, 9_850_000, "محصول شالیکوبی امسال"),
    P("p2", "K-1002", "روغن آفتابگردان ۱٫۸ لیتری", "c1", "بطری", 20, 980_000, 1_150_000),
    P("p3", "K-1003", "چای ممتاز لاهیجان ۵۰۰ گرمی", "c2", "بسته", 10, 2_150_000, 2_580_000),
    P("p4", "K-1004", "زعفران نگین ۴٫۶ گرمی", "c4", "قوطی", 5, 18_500_000, 22_400_000, "درجه یک صادراتی"),
    P("p5", "K-1005", "مایع ظرفشویی ۱ لیتری", "c3", "عدد", 60, 390_000, 480_000),
    P("p6", "K-1006", "دستمال کاغذی ۳۰۰ برگ", "c3", "بسته", 40, 62_000, 95_000),
    P("p7", "K-1007", "ماکارونی فرمی ۷۰۰ گرمی", "c1", "بسته", 30, 185_000, 230_000),
    P("p8", "K-1008", "نوشابه کولا ۱٫۵ لیتری", "c2", "بطری", 24, 410_000, 520_000),
    P("p9", "K-1009", "هل سبز ۱۰۰ گرمی", "c4", "بسته", 20, 9_800_000, 11_900_000),
  ];

  const PT = (
    id: string, name: string, type: PartyType, phone: string, mobile: string,
    address: string, nationalId: string, note = ""
  ): Party => ({ id, name, type, phone, mobile, address, nationalId, note, ...st(A, 60) });

  const parties: Party[] = [
    PT("pt1", "فروشگاه زنجیره‌ای رفاه", "customer", "021-66445521", "09121112233", "تهران، بلوار کشاورز، پلاک ۴۵", "10104567821", "تحویل هفته‌ای دو بار"),
    PT("pt2", "سوپرمارکت امید", "customer", "021-44332211", "09355556677", "تهران، خیابان پیروزی، کوچه شهید فلاحی", "00821345690"),
    PT("pt3", "هایپر استار شعبه شرق", "customer", "021-77889900", "09129998877", "تهران، بزرگراه باقری، مجتمع تجاری ستاره", "10109876543"),
    PT("pt4", "پخش مواد غذایی البرز", "supplier", "026-34556677", "09124443322", "کرج، شهرک صنعتی بهارستان، قطعه ۱۲", "411234567890", "شرکت پخش اصلی"),
    PT("pt5", "بازرگانی آفتاب تجارت", "supplier", "021-88776655", "09198887766", "تهران، خیابان ولیعصر، برج آفتاب، طبقه ۶", "411987654321"),
    PT("pt6", "خشکبار رضایی", "supplier", "051-33445566", "09151234567", "مشهد، بازار رضا، راسته خشکبارفروش‌ها", "09211112223"),
    PT("pt7", "خدمات فنی افشار", "other", "—", "09123456780", "تهران، خیابان جمهوری", "—", "تعمیرات تجهیزات انبار"),
  ];

  const stockDocs: StockDoc[] = [
    { id: "sd1", kind: "in", no: 1001, date: daysAgoISO(12), partyId: "pt4", note: "محموله هفتگی البرز", items: [
      { productId: "p1", qty: 40, price: 8_900_000 },
      { productId: "p2", qty: 60, price: 980_000 },
      { productId: "p7", qty: 120, price: 185_000 },
    ], ...st(n1, 12, 9, 40) },
    { id: "sd2", kind: "in", no: 1002, date: daysAgoISO(8), partyId: "pt5", note: "خرید نقدی با تخفیف", items: [
      { productId: "p3", qty: 50, price: 2_150_000 },
      { productId: "p8", qty: 100, price: 410_000 },
      { productId: "p5", qty: 80, price: 390_000 },
      { productId: "p6", qty: 150, price: 62_000 },
    ], ...st(n2, 8, 11, 5) },
    { id: "sd3", kind: "in", no: 1003, date: daysAgoISO(3), partyId: "pt6", note: "زعفران و هل درجه یک", items: [
      { productId: "p4", qty: 25, price: 18_500_000 },
      { productId: "p9", qty: 12, price: 9_800_000 },
    ], ...st(n1, 3, 13, 25) },
    { id: "sd4", kind: "out", no: 1001, date: daysAgoISO(10), partyId: "pt1", note: "سفارش شماره ۲۲۳ رفاه", items: [
      { productId: "p1", qty: 15, price: 9_850_000 },
      { productId: "p7", qty: 40, price: 230_000 },
    ], ...st(n1, 10, 14, 10) },
    { id: "sd5", kind: "out", no: 1002, date: daysAgoISO(6), partyId: "pt2", note: "", items: [
      { productId: "p2", qty: 24, price: 1_150_000 },
      { productId: "p5", qty: 30, price: 480_000 },
    ], ...st(n2, 6, 16, 45) },
    { id: "sd6", kind: "out", no: 1003, date: daysAgoISO(4), partyId: "pt3", note: "ارسال با باربری", items: [
      { productId: "p3", qty: 20, price: 2_580_000 },
      { productId: "p8", qty: 48, price: 520_000 },
    ], ...st(n1, 4, 10, 30) },
    { id: "sd7", kind: "out", no: 1004, date: daysAgoISO(1), partyId: "pt1", note: "سفارش فوری زعفران", items: [
      { productId: "p4", qty: 8, price: 22_400_000 },
      { productId: "p6", qty: 60, price: 95_000 },
    ], ...st(n2, 1, 12, 50) },
  ];

  const payments: Payment[] = [
    { id: "py1", kind: "in", misc: false, no: 2201, date: daysAgoISO(5), partyId: "pt1", amount: 45_000_000, method: "کارت به کارت", refNo: "۹۸۷۶۵۴۳۲۱", note: "بخشی از حساب رفاه", ...st(n1, 5, 12, 10) },
    { id: "py2", kind: "in", misc: false, no: 2202, date: daysAgoISO(2), partyId: "pt2", amount: 12_000_000, method: "واریز بانکی", refNo: "TRX-55412", note: "", ...st(n2, 2, 9, 35) },
    { id: "py3", kind: "in", misc: false, no: 2203, date: daysAgoISO(1), partyId: "pt3", amount: 20_000_000, method: "نقدی", refNo: "", note: "تحویل حضوری صندوق", ...st(n1, 1, 17, 5) },
    { id: "py4", kind: "out", misc: false, no: 2204, date: daysAgoISO(7), partyId: "pt4", amount: 30_000_000, method: "واریز بانکی", refNo: "۱۱۲۲۳۳۴۴", note: "علی‌الحساب محموله", ...st(n1, 7, 10, 55) },
    { id: "py5", kind: "out", misc: false, no: 2205, date: daysAgoISO(2), partyId: "pt5", amount: 25_000_000, method: "کارت به کارت", refNo: "۸۸۹۹۷۷", note: "", ...st(n2, 2, 15, 20) },
    { id: "py6", kind: "out", misc: true, no: 2206, date: daysAgoISO(4), partyId: null, amount: 3_500_000, method: "نقدی", refNo: "", note: "کرایه حمل داخل شهری", ...st(n1, 4, 13, 40) },
  ];

  const purchases: Purchase[] = [
    { id: "pu1", type: "goods", no: 501, date: daysAgoISO(6), partyId: "pt4", title: "کارتن و نایلون بسته‌بندی", amount: 18_400_000, note: "", image: null, ...st(n1, 6, 11, 15) },
    { id: "pu2", type: "office", no: 502, date: daysAgoISO(9), partyId: null, title: "کاغذ A4 و ملزومات اداری", amount: 6_200_000, note: "از فروشگاه افق", image: null, ...st(n2, 9, 14, 25) },
    { id: "pu3", type: "equipment", no: 503, date: daysAgoISO(15), partyId: null, title: "دستگاه بارکدخوان انبار", amount: 42_000_000, note: "مدل NL-300", image: null, ...st(n1, 15, 12, 30) },
    { id: "pu4", type: "service", no: 504, date: daysAgoISO(5), partyId: "pt7", title: "تعمیر جک پالت برقی", amount: 8_500_000, note: "تعویض روغن هیدرولیک", image: null, ...st(n1, 5, 16, 10) },
  ];

  const expenseTypes: ExpenseType[] = [
    { id: "et1", name: "برق" }, { id: "et2", name: "آب" }, { id: "et3", name: "گاز" },
    { id: "et4", name: "اینترنت و تلفن" }, { id: "et5", name: "اجاره" }, { id: "et6", name: "حمل‌ونقل" },
    { id: "et7", name: "تعمیرات" }, { id: "et8", name: "لوازم اداری" }, { id: "et9", name: "پذیرایی" }, { id: "et10", name: "سایر" },
  ];

  const expenses: Expense[] = [
    { id: "ex1", no: 801, date: daysAgoISO(20), typeId: "et1", partyId: null, amount: 4_800_000, method: "واریز بانکی", note: "قبض دوره", image: null, ...st(n1, 20, 9, 12) },
    { id: "ex2", no: 802, date: daysAgoISO(28), typeId: "et5", partyId: null, amount: 85_000_000, method: "واریز بانکی", note: "اجاره ماهانه انبار", image: null, ...st(n1, 28, 10, 40) },
    { id: "ex3", no: 803, date: daysAgoISO(12), typeId: "et4", partyId: null, amount: 2_900_000, method: "کارت به کارت", note: "", image: null, ...st(n2, 12, 15, 50) },
    { id: "ex4", no: 804, date: daysAgoISO(6), typeId: "et6", partyId: "pt7", amount: 6_400_000, method: "نقدی", note: "باربری محموله کرج", image: null, ...st(n2, 6, 13, 15) },
    { id: "ex5", no: 805, date: daysAgoISO(2), typeId: "et7", partyId: "pt7", amount: 12_600_000, method: "کارت به کارت", note: "سرویس قفسه‌بندی سالن ۲", image: null, ...st(n1, 2, 11, 35) },
  ];

  const audit: AuditLog[] = [
    { id: uid(), userId: U1, userName: n1, action: "login", entity: "login", ref: "ورود به سیستم", at: tsAgo(1, 8, 2) },
    { id: uid(), userId: U2, userName: n2, action: "create", entity: "payment", ref: "رسید ۲۲۰۲ — سوپرمارکت امید", at: tsAgo(2, 9, 35) },
    { id: uid(), userId: U1, userName: n1, action: "create", entity: "stockOut", ref: "سند خروج خ‑۱۰۰۴ — فروشگاه رفاه", at: tsAgo(1, 12, 50) },
    { id: uid(), userId: U1, userName: n1, action: "create", entity: "expense", ref: "سند هزینه ه‑۸۰۵ — تعمیرات", at: tsAgo(2, 11, 35) },
    { id: uid(), userId: U1, userName: n1, action: "create", entity: "stockIn", ref: "سند ورود و‑۱۰۰۳ — خشکبار رضایی", at: tsAgo(3, 13, 25) },
    { id: uid(), userId: U2, userName: n2, action: "create", entity: "stockOut", ref: "سند خروج خ‑۱۰۰۲ — سوپرمارکت امید", at: tsAgo(6, 16, 45) },
    { id: uid(), userId: U1, userName: n1, action: "create", entity: "purchase", ref: "فاکتور خرید ۵۰۳ — بارکدخوان", at: tsAgo(15, 12, 30) },
  ];

  return {
    version: 1,
    seq: { in: 1004, out: 1005, pay: 2207, purchase: 505, expense: 806 },
    users: [
      { id: U1, fullName: n1, username: "admin", password: "1234", active: true, createdAt: tsAgo(90, 9, 0) },
      { id: U2, fullName: n2, username: "sara", password: "1234", active: true, createdAt: tsAgo(80, 9, 0) },
      { id: "u-reza", fullName: "رضا کریمی", username: "reza", password: "1234", active: false, createdAt: tsAgo(70, 9, 0) },
    ],
    company: {
      name: "بازرگانی آریا گستر",
      logo: null,
      phone: "۰۲۱‑۴۴۵۵۶۶۷۷",
      mobile: "۰۹۱۲‑۱۲۳۴۵۶۷",
      address: "تهران، خیابان آزادی، نبش خیابان بهبودی، پلاک ۱۲۸، واحد ۳",
      economicCode: "۴۱۱۲۳۴۵۶۷۸۹۰",
      nationalId: "۱۰۱۰۲۳۴۵۶۷۸",
      regNo: "۴۵۶۷۸",
      note: "پخش عمده مواد غذایی و خشکبار",
    },
    parties, categories, products, stockDocs, payments, purchases, expenses, expenseTypes, audit,
    settings: {
      allowNegative: false,
      currency: "ریال",
      print: { showLogo: true, showSign: true, footer: "از همکاری شما صمیمانه سپاسگزاریم. این سند بدون مهر و امضا فاقد اعتبار است." },
    },
  };
}

export function resetDB(): DB {
  const fresh = seedDB();
  saveDB(fresh);
  return fresh;
}
