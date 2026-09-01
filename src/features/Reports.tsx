import { useMemo, useState } from "react";
import { useApp } from "../state";
import type { Params } from "../state";
import type { AuditLog, Party, Product, StockDoc } from "../lib/db";
import {
  docTotal, faDate, faDateTime, faNum, money, noLabel, partySum, stockOf, downloadCSV,
  ENTITY_FA, ACTION_FA,
} from "../lib/db";
import { Btn, IconBtn, Badge, PageHead, SearchBox, DataTable, EmptyState, Avatar } from "../components/ui";
import type { Col } from "../components/ui";

/* ================= گزارش موجودی کالا ================= */

export function StockReportPage({ params }: { params: Params }) {
  const { db, nav, print, toast } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [lowOnly, setLowOnly] = useState(params.low === "1");

  const rows = useMemo(() => db.products
    .filter((p) => (cat === "all" || p.categoryId === cat))
    .filter((p) => (p.name + p.code).includes(q))
    .map((p) => {
      const s = stockOf(db, p.id);
      return { p, s, value: s * p.buyPrice, low: s <= p.minStock };
    })
    .filter((r) => !lowOnly || r.low)
    .sort((a, b) => a.p.code.localeCompare(b.p.code)), [db, q, cat, lowOnly]);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "—";

  const cols: Col<typeof rows[number]>[] = [
    {
      key: "p", label: "کالا", sortable: true, sortVal: (r) => r.p.name,
      render: ({ p }) => (
        <span className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg border border-line bg-paper overflow-hidden flex items-center justify-center shrink-0">
            {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <span className="font-display text-pine-600">{p.name.slice(0, 1)}</span>}
          </span>
          <span><span className="block font-bold text-[12.5px]">{p.name}</span><span className="text-[10.5px] text-ink-3" dir="ltr">{p.code}</span></span>
        </span>
      ),
    },
    { key: "cat", label: "دسته", render: ({ p }) => <span className="text-[11.5px] text-ink-2">{catName(p.categoryId)}</span> },
    { key: "unit", label: "واحد", render: ({ p }) => <span className="text-[12px]">{p.unit}</span> },
    {
      key: "s", label: "موجودی فعلی", sortable: true, sortVal: (r) => r.s,
      render: ({ p, s, low }) => (
        <span className="flex items-center gap-2">
          <b className={`font-display text-[17px] num ${low ? "text-rose-500" : "text-night"}`}>{faNum(s)}</b>
          {low && <Badge tone="rose">کمتر از حداقل {faNum(p.minStock)}</Badge>}
        </span>
      ),
    },
    { key: "min", label: "حداقل", sortable: true, sortVal: (r) => r.p.minStock, render: ({ p }) => <span className="num text-[12px] text-ink-2">{faNum(p.minStock)}</span> },
    { key: "price", label: "قیمت خرید", sortable: true, sortVal: (r) => r.p.buyPrice, render: ({ p }) => <span className="num text-[12px]">{money(p.buyPrice)}</span> },
    { key: "value", label: "ارزش موجودی", sortable: true, sortVal: (r) => r.value, render: ({ value }) => <b className="num text-[12.5px]">{money(value)}</b> },
    {
      key: "act", label: "", cls: "w-[90px]",
      render: ({ p }) => (
        <span className="flex gap-0.5">
          <IconBtn icon="loop" title="گردش کالا" tone="saffron" onClick={() => nav("stock-turn", { product: p.id })} />
          <IconBtn icon="pencil" title="ویرایش کالا" onClick={() => nav("products")} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title="گزارش موجودی کالا" desc="موجودی لحظه‌ای، ارزش ریالی انبار و کالاهای زیر حد مجاز."
        actions={
          <>
            <Btn variant="outline" icon="printer" onClick={() => {
              print({
                kind: "sheet", title: "گزارش موجودی کالا", subtitle: `${faNum(rows.length)} قلم`,
                meta: [["ارزش کل موجودی", `${money(totalValue)} ${db.settings.currency}`], ["کالاهای کم‌موجود", faNum(rows.filter((r) => r.low).length)]],
                head: ["کد", "نام کالا", "دسته", "واحد", "موجودی", "حداقل", "قیمت خرید", "ارزش موجودی", "وضعیت"],
                rows: rows.map((r) => [r.p.code, r.p.name, catName(r.p.categoryId), r.p.unit, r.s, r.p.minStock, money(r.p.buyPrice), money(r.value), r.low ? "کمبود" : "عادی"]),
                foot: [`جمع ارزش موجودی: ${money(totalValue)} ${db.settings.currency}`],
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ گزارش</Btn>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("stock-report", [["کد", "نام", "دسته", "واحد", "موجودی", "حداقل", "قیمت خرید", "ارزش", "وضعیت"],
              ...rows.map((r) => [r.p.code, r.p.name, catName(r.p.categoryId), r.p.unit, r.s, r.p.minStock, r.p.buyPrice, r.value, r.low ? "کمبود" : "عادی"])])
            }>خروجی Excel</Btn>
          </>
        } />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی کالا..." />
        <select className="ctl !w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">همه دسته‌ها</option>
          {db.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setLowOnly(!lowOnly)}
          className={`px-3 py-2 rounded-lg text-[12px] font-bold border transition-all ${lowOnly ? "bg-rose-500 text-white border-rose-500" : "bg-card border-line-2 text-ink-2 hover:border-rose-500/50"}`}>
          فقط کم‌موجودها ({faNum(db.products.filter((p) => stockOf(db, p.id) <= p.minStock).length)})
        </button>
        <span className="mr-auto text-[12px] text-ink-3">ارزش: <b className="num text-ink">{money(totalValue)}</b> {db.settings.currency}</span>
      </div>
      <DataTable columns={cols} rows={rows} keyFor={(r) => r.p.id}
        empty={<EmptyState icon="layers" title={lowOnly ? "کالای کم‌موجودی نیست" : "کالایی یافت نشد"} desc={lowOnly ? "همه کالاها در حد مجاز هستند." : ""} />} />
    </div>
  );
}

/* ================= گردش کالا ================= */

export function StockTurnoverPage({ params }: { params: Params }) {
  const { db, print, toast } = useApp();
  const [productId, setProductId] = useState(params.product ?? db.products[0]?.id ?? "");
  const product = db.products.find((p) => p.id === productId);

  const moves = useMemo(() => {
    if (!productId) return [];
    const list = db.stockDocs
      .filter((d) => d.items.some((i) => i.productId === productId))
      .map((d) => {
        const it = d.items.find((i) => i.productId === productId)!;
        return {
          id: d.id, date: d.date, at: d.createdAt, no: noLabel(d.kind === "in" ? "و" : "خ", d.no),
          kind: d.kind, qty: it.qty, price: it.price,
          party: db.parties.find((p) => p.id === d.partyId)?.name ?? "—", by: d.createdBy,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.at - b.at);
    let run = 0;
    return list.map((m) => ({ ...m, stock: (run += m.kind === "in" ? m.qty : -m.qty) }));
  }, [db, productId]);

  const totalIn = moves.filter((m) => m.kind === "in").reduce((s, m) => s + m.qty, 0);
  const totalOut = moves.filter((m) => m.kind === "out").reduce((s, m) => s + m.qty, 0);
  const final = totalIn - totalOut;

  const cols: Col<typeof moves[number]>[] = [
    { key: "date", label: "تاریخ", sortable: true, sortVal: (m) => m.date, render: (m) => <span className="text-[12.5px]">{faDate(m.date)}</span> },
    { key: "no", label: "شماره سند", render: (m) => <b className="num text-[12.5px]">{m.no}</b> },
    {
      key: "kind", label: "نوع عملیات",
      render: (m) => m.kind === "in" ? <Badge tone="pine">ورود</Badge> : <Badge tone="saffron">خروج</Badge>,
    },
    {
      key: "qty", label: "تعداد", sortable: true, sortVal: (m) => m.qty * (m.kind === "in" ? 1 : -1),
      render: (m) => <b className={`num text-[13px] ${m.kind === "in" ? "text-pine-600" : "text-rose-500"}`}>{m.kind === "in" ? "+" : "−"}{faNum(m.qty)}</b>,
    },
    { key: "stock", label: "موجودی بعد", sortable: true, sortVal: (m) => m.stock, render: (m) => <span className="num font-bold text-[12.5px]">{faNum(m.stock)}</span> },
    { key: "party", label: "طرف حساب", render: (m) => <span className="text-[12px]">{m.party}</span> },
    { key: "by", label: "ثبت‌کننده", render: (m) => <span className="text-[11.5px] text-ink-2">{m.by}<span className="block text-[10px] text-ink-3">{faDateTime(m.at)}</span></span> },
  ];

  return (
    <div>
      <PageHead title="گزارش گردش کالا" desc="ریز ورود و خروج یک کالا با موجودی پس از هر عملیات."
        actions={
          <>
            <Btn variant="outline" icon="printer" disabled={!product} onClick={() => {
              if (!product) return;
              print({
                kind: "sheet", title: "گردش کالا", subtitle: product.name,
                meta: [["کالا", `${product.code} — ${product.name}`], ["موجودی اولیه", faNum(0)], ["ورودها", faNum(totalIn)], ["خروج‌ها", faNum(totalOut)], ["موجودی نهایی", faNum(final)]],
                head: ["تاریخ", "سند", "نوع", "تعداد", "موجودی بعد", "طرف حساب", "ثبت‌کننده"],
                rows: moves.map((m) => [faDate(m.date), m.no, m.kind === "in" ? "ورود" : "خروج", (m.kind === "in" ? "+" : "-") + m.qty, m.stock, m.party, m.by]),
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ گردش</Btn>
            <Btn variant="outline" icon="download" disabled={!product} onClick={() =>
              downloadCSV("turnover-" + (product?.code ?? ""), [["تاریخ", "سند", "نوع", "تعداد", "موجودی بعد", "طرف حساب", "ثبت‌کننده"],
              ...moves.map((m) => [faDate(m.date), m.no, m.kind === "in" ? "ورود" : "خروج", (m.kind === "in" ? "+" : "-") + m.qty, m.stock, m.party, m.by])])
            }>خروجی Excel</Btn>
          </>
        } />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="ctl !w-auto min-w-[260px]" value={productId} onChange={(e) => setProductId(e.target.value)}>
          {db.products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
        {product && <Badge tone="gray">واحد: {product.unit}</Badge>}
      </div>

      {product && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { l: "موجودی اولیه", v: faNum(0), c: "text-ink" },
            { l: "جمع ورودها", v: `+${faNum(totalIn)}`, c: "text-pine-600" },
            { l: "جمع خروج‌ها", v: `−${faNum(totalOut)}`, c: "text-rose-500" },
            { l: "موجودی نهایی", v: faNum(final), c: "text-night" },
            { l: "ارزش موجودی", v: money(final * product.buyPrice), c: "text-saffron-700" },
          ].map((x, i) => (
            <div key={i} className="bg-card border border-line rounded-xl p-3.5 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="block text-[10.5px] text-ink-3 mb-1">{x.l}</span>
              <b className={`num text-[16px] ${x.c}`}>{x.v}</b>
            </div>
          ))}
        </div>
      )}

      <DataTable columns={cols} rows={moves} keyFor={(m) => m.id}
        empty={<EmptyState icon="loop" title="عملیاتی برای این کالا ثبت نشده" />} />
    </div>
  );
}

/* ================= گزارش ورود و خروج ================= */

export function InOutReportPage() {
  const { db, print, toast, nav } = useApp();
  const [kind, setKind] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => db.stockDocs
    .filter((d) => kind === "all" || d.kind === kind)
    .filter((d) => !from || d.date >= from).filter((d) => !to || d.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt), [db, kind, from, to]);

  const sumIn = rows.filter((d) => d.kind === "in").reduce((s, d) => s + docTotal(d), 0);
  const sumOut = rows.filter((d) => d.kind === "out").reduce((s, d) => s + docTotal(d), 0);

  const cols: Col<StockDoc>[] = [
    {
      key: "kind", label: "نوع", sortable: true, sortVal: (d) => d.kind,
      render: (d) => d.kind === "in" ? <Badge tone="pine">ورود</Badge> : <Badge tone="saffron">خروج</Badge>,
    },
    { key: "no", label: "شماره", sortable: true, sortVal: (d) => d.no + (d.kind === "in" ? 0 : 100000), render: (d) => <b className="num">{noLabel(d.kind === "in" ? "و" : "خ", d.no)}</b> },
    { key: "date", label: "تاریخ", sortable: true, sortVal: (d) => d.date, render: (d) => <span className="text-[12.5px]">{faDate(d.date)}</span> },
    { key: "party", label: "طرف حساب", render: (d) => <span className="font-bold text-[12.5px]">{db.parties.find((p) => p.id === d.partyId)?.name ?? "—"}</span> },
    { key: "cnt", label: "اقلام", render: (d) => <span className="text-[12px]">{faNum(d.items.length)} قلم</span> },
    {
      key: "total", label: "مبلغ", sortable: true, sortVal: (d) => docTotal(d) * (d.kind === "in" ? 1 : -1),
      render: (d) => <b className={`num ${d.kind === "in" ? "text-pine-600" : "text-saffron-700"}`}>{d.kind === "in" ? "+" : "−"}{money(docTotal(d))}</b>,
    },
    { key: "by", label: "ثبت‌کننده", render: (d) => <span className="text-[11.5px] text-ink-2">{d.createdBy}</span> },
    {
      key: "act", label: "", cls: "w-[90px]",
      render: (d) => (
        <span className="flex gap-0.5">
          <IconBtn icon="eye" title="مشاهده سند" onClick={() => nav(d.kind === "in" ? "stock-in" : "stock-out", { view: d.id })} />
          <IconBtn icon="printer" title="چاپ" tone="saffron" onClick={() => print({ kind: "doc", docId: d.id })} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title="گزارش ورود و خروج" desc="فهرست همه اسناد انبار با جمع مبالغ ورود و خروج."
        actions={
          <>
            <Btn variant="outline" icon="printer" onClick={() => {
              print({
                kind: "sheet", title: "گزارش ورود و خروج", subtitle: `${faNum(rows.length)} سند`,
                meta: [["جمع ورود", `${money(sumIn)} ${db.settings.currency}`], ["جمع خروج", `${money(sumOut)} ${db.settings.currency}`]],
                head: ["نوع", "شماره", "تاریخ", "طرف حساب", "اقلام", "مبلغ", "ثبت‌کننده"],
                rows: rows.map((d) => [d.kind === "in" ? "ورود" : "خروج", noLabel(d.kind === "in" ? "و" : "خ", d.no), faDate(d.date), db.parties.find((p) => p.id === d.partyId)?.name ?? "—", d.items.length, docTotal(d), d.createdBy]),
                foot: [`جمع ورود: ${money(sumIn)}`, `جمع خروج: ${money(sumOut)}`],
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ</Btn>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("inout", [["نوع", "شماره", "تاریخ", "طرف حساب", "اقلام", "مبلغ", "ثبت‌کننده"],
              ...rows.map((d) => [d.kind === "in" ? "ورود" : "خروج", noLabel(d.kind === "in" ? "و" : "خ", d.no), faDate(d.date), db.parties.find((p) => p.id === d.partyId)?.name ?? "", d.items.length, docTotal(d), d.createdBy])])
            }>خروجی Excel</Btn>
          </>
        } />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-card border border-line rounded-lg p-0.5">
          {([["all", "همه"], ["in", "ورود"], ["out", "خروج"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${kind === k ? "bg-pine-600 text-white shadow-sm" : "text-ink-2 hover:text-pine-700"}`}>{l}</button>
          ))}
        </div>
        <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-[12px] text-ink-3">تا</span>
        <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        <span className="mr-auto text-[12px]">
          <b className="num text-pine-600">+{money(sumIn)}</b>
          <span className="text-ink-3 mx-2">|</span>
          <b className="num text-saffron-700">−{money(sumOut)}</b> {db.settings.currency}
        </span>
      </div>
      <DataTable columns={cols} rows={rows} keyFor={(d) => d.id}
        empty={<EmptyState icon="loop" title="سندی در این بازه نیست" />} />
    </div>
  );
}

/* ================= بدهکاران / بستانکاران ================= */

interface BalRow { party: Party; s: ReturnType<typeof partySum> }

function BalanceReportPage({ mode }: { mode: "debtors" | "creditors" }) {
  const { db, nav, print, toast } = useApp();
  const isDebtor = mode === "debtors";

  const rows = useMemo(() => db.parties
    .map((party) => ({ party, s: partySum(db, party.id) }))
    .filter((r) => (isDebtor ? r.s.balance > 0 : r.s.balance < 0))
    .sort((a, b) => Math.abs(b.s.balance) - Math.abs(a.s.balance)), [db, isDebtor]);

  const totalBal = rows.reduce((s, r) => s + Math.abs(r.s.balance), 0);

  const cols: Col<BalRow>[] = [
    {
      key: "party", label: "طرف حساب", sortable: true, sortVal: (r) => r.party.name,
      render: ({ party }) => (
        <span className="flex items-center gap-3"><Avatar name={party.name} /><span><span className="block font-bold text-[13px]">{party.name}</span><span className="text-[10.5px] text-ink-3" dir="ltr">{party.mobile || party.phone || "—"}</span></span></span>
      ),
    },
    {
      key: "base", label: isDebtor ? "مجموع خرید از ما (خروج)" : "مجموع فروش به ما (ورود)",
      sortable: true, sortVal: (r) => (isDebtor ? r.s.docOutSum : r.s.docInSum),
      render: ({ s }) => <span className="num text-[12.5px]">{money(isDebtor ? s.docOutSum : s.docInSum)}</span>,
    },
    {
      key: "paid", label: isDebtor ? "مجموع واریزی" : "مجموع پرداختی ما",
      sortable: true, sortVal: (r) => (isDebtor ? r.s.depSum : r.s.paySum),
      render: ({ s }) => <span className="num text-[12.5px] text-pine-600">{money(isDebtor ? s.depSum : s.paySum)}</span>,
    },
    {
      key: "bal", label: isDebtor ? "مانده بدهی" : "مانده بستانکاری", sortable: true, sortVal: (r) => Math.abs(r.s.balance),
      render: ({ s }) => (
        <b className={`num text-[14px] font-display ${isDebtor ? "text-rose-500" : "text-pine-600"}`}>
          {money(Math.abs(s.balance))} <span className="text-[10px] font-body">{db.settings.currency}</span>
        </b>
      ),
    },
    {
      key: "act", label: "عملیات", cls: "w-[130px]",
      render: ({ party }) => (
        <span className="flex gap-1">
          <Btn size="sm" variant="soft" icon="loop" onClick={() => nav("ledger", { party: party.id })}>گردش حساب</Btn>
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title={isDebtor ? "گزارش بدهکاران" : "گزارش بستانکاران"}
        desc={isDebtor ? "طرف حساب‌هایی که به شرکت بدهکارند — بر اساس فاکتورهای فروش و واریزی‌ها." : "طرف حساب‌هایی که شرکت به آنها بدهکار است — بر اساس خریدها و پرداختی‌ها."}
        actions={
          <>
            <Btn variant="outline" icon="printer" onClick={() => {
              print({
                kind: "sheet", title: isDebtor ? "گزارش بدهکاران" : "گزارش بستانکاران", subtitle: `${faNum(rows.length)} طرف حساب`,
                meta: [["جمع کل", `${money(totalBal)} ${db.settings.currency}`]],
                head: ["طرف حساب", isDebtor ? "مجموع خرید" : "مجموع فروش", isDebtor ? "واریزی‌ها" : "پرداختی‌ها", "مانده"],
                rows: rows.map((r) => [r.party.name, money(isDebtor ? r.s.docOutSum : r.s.docInSum), money(isDebtor ? r.s.depSum : r.s.paySum), money(Math.abs(r.s.balance))]),
                foot: [`جمع: ${money(totalBal)} ${db.settings.currency}`],
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ</Btn>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV(mode, [["طرف حساب", "مجموع سند", "دریافت/پرداخت", "مانده"],
              ...rows.map((r) => [r.party.name, isDebtor ? r.s.docOutSum : r.s.docInSum, isDebtor ? r.s.depSum : r.s.paySum, Math.abs(r.s.balance)])])
            }>خروجی Excel</Btn>
          </>
        } />
      <div className={`rounded-xl border p-4 mb-4 flex flex-wrap items-center justify-between gap-3 anim-fade-up ${isDebtor ? "bg-rose-100/50 border-rose-500/25" : "bg-pine-50 border-pine-200"}`}>
        <span className="text-[13px] font-bold">{isDebtor ? "جمع کل مطالبات از بدهکاران" : "جمع کل بدهی شرکت به بستانکاران"}</span>
        <span className={`font-display text-[24px] num ${isDebtor ? "text-rose-500" : "text-pine-700"}`}>{money(totalBal)} <span className="text-[12px] font-body">{db.settings.currency}</span></span>
      </div>
      <DataTable columns={cols} rows={rows} keyFor={(r) => r.party.id}
        empty={<EmptyState icon={isDebtor ? "scale" : "hand"} title={isDebtor ? "بدهکاری وجود ندارد" : "بستانکاری وجود ندارد"} desc="همه حساب‌ها تسویه است." />} />
    </div>
  );
}

export const DebtorsPage = () => <BalanceReportPage mode="debtors" />;
export const CreditorsPage = () => <BalanceReportPage mode="creditors" />;

/* ================= گزارش واریزی‌ها ================= */

export function DepositsReportPage() {
  const { db, print, toast } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState("");

  const rows = useMemo(() => db.payments
    .filter((p) => p.kind === "in")
    .filter((p) => !method || p.method === method)
    .filter((p) => !from || p.date >= from).filter((p) => !to || p.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date)), [db, from, to, method]);

  const total = rows.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHead title="گزارش واریزی‌ها" desc="دریافتی‌های شرکت در بازه زمانی دلخواه، به تفکیک روش پرداخت."
        actions={
          <>
            <Btn variant="outline" icon="printer" onClick={() => {
              print({
                kind: "sheet", title: "گزارش واریزی‌ها", subtitle: `${faNum(rows.length)} مورد`,
                meta: [["جمع دریافتی", `${money(total)} ${db.settings.currency}`]],
                head: ["شماره", "تاریخ", "طرف حساب", "روش", "پیگیری", "مبلغ", "ثبت‌کننده"],
                rows: rows.map((p) => [noLabel("ر", p.no), faDate(p.date), db.parties.find((x) => x.id === p.partyId)?.name ?? "—", p.method, p.refNo, money(p.amount), p.createdBy]),
                foot: [`جمع: ${money(total)} ${db.settings.currency}`],
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ</Btn>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("deposits-report", [["شماره", "تاریخ", "طرف حساب", "روش", "مبلغ", "ثبت‌کننده"],
              ...rows.map((p) => [noLabel("ر", p.no), faDate(p.date), db.parties.find((x) => x.id === p.partyId)?.name ?? "", p.method, p.amount, p.createdBy])])
            }>خروجی Excel</Btn>
          </>
        } />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-[12px] text-ink-3">تا</span>
        <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        <select className="ctl !w-auto" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">همه روش‌ها</option>
          {["کارت به کارت", "واریز بانکی", "نقدی", "سایر"].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="mr-auto text-[12px] text-ink-3">جمع: <b className="num text-pine-600">{money(total)}</b> {db.settings.currency}</span>
      </div>
      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <table className="tbl">
          <thead><tr><th>شماره</th><th>تاریخ</th><th>طرف حساب</th><th>روش پرداخت</th><th>پیگیری</th><th>مبلغ</th><th>ثبت‌کننده</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="num font-bold">{noLabel("ر", p.no)}</td>
                <td>{faDate(p.date)}</td>
                <td className="font-bold">{db.parties.find((x) => x.id === p.partyId)?.name ?? "—"}</td>
                <td><Badge tone="gray">{p.method}</Badge></td>
                <td className="text-[11.5px] text-ink-2" dir="ltr">{p.refNo || "—"}</td>
                <td className="num font-bold text-pine-600">+{money(p.amount)}</td>
                <td className="text-[11.5px] text-ink-2">{p.createdBy}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}><EmptyState icon="wallet" title="واریزی در این بازه نیست" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= گزارش هزینه‌ها ================= */

export function ExpensesReportPage() {
  const { db, print, toast } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeId, setTypeId] = useState("");
  const [partyId, setPartyId] = useState("");

  const rows = useMemo(() => db.expenses
    .filter((e) => !typeId || e.typeId === typeId)
    .filter((e) => !partyId || e.partyId === partyId)
    .filter((e) => !from || e.date >= from).filter((e) => !to || e.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date)), [db, typeId, partyId, from, to]);

  const total = rows.reduce((s, e) => s + e.amount, 0);
  const byType = useMemo(() => db.expenseTypes
    .map((t) => ({ t, sum: rows.filter((e) => e.typeId === t.id).reduce((s, e) => s + e.amount, 0) }))
    .filter((x) => x.sum > 0)
    .sort((a, b) => b.sum - a.sum), [db, rows]);

  return (
    <div>
      <PageHead title="گزارش هزینه‌ها" desc="تحلیل هزینه‌ها بر اساس بازه تاریخ، نوع هزینه و طرف حساب."
        actions={
          <>
            <Btn variant="outline" icon="printer" onClick={() => {
              print({
                kind: "sheet", title: "گزارش هزینه‌ها", subtitle: `${faNum(rows.length)} سند`,
                meta: [["جمع هزینه‌ها", `${money(total)} ${db.settings.currency}`], ...byType.map((x) => [x.t.name, money(x.sum)] as [string, string])],
                head: ["سند", "تاریخ", "نوع", "طرف حساب", "مبلغ", "ثبت‌کننده"],
                rows: rows.map((e) => [noLabel("ه", e.no), faDate(e.date), db.expenseTypes.find((t) => t.id === e.typeId)?.name ?? "", db.parties.find((x) => x.id === e.partyId)?.name ?? "—", money(e.amount), e.createdBy]),
                foot: [`جمع: ${money(total)} ${db.settings.currency}`],
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ</Btn>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("expenses-report", [["نوع هزینه", "مبلغ"], ...byType.map((x) => [x.t.name, x.sum]), [], ["جمع", total]])
            }>خروجی Excel</Btn>
          </>
        } />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-[12px] text-ink-3">تا</span>
        <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        <select className="ctl !w-auto" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">همه انواع</option>
          {db.expenseTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="ctl !w-auto" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
          <option value="">همه طرف حساب‌ها</option>
          {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* تفکیک بر اساس نوع */}
      <div className="bg-card border border-line rounded-xl p-5 mb-4 anim-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[13.5px]">هزینه به تفکیک نوع</h3>
          <b className="font-display text-[20px] text-rose-500 num">{money(total)} <span className="text-[11px] font-body text-ink-3">{db.settings.currency}</span></b>
        </div>
        {byType.length === 0 ? <p className="text-[12px] text-ink-3 text-center py-4">هزینه‌ای در این بازه ثبت نشده است.</p> : (
          <div className="space-y-2.5">
            {byType.map(({ t, sum }) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="w-[110px] text-[12px] font-bold shrink-0">{t.name}</span>
                <span className="flex-1 h-[10px] rounded-full bg-paper overflow-hidden">
                  <span className="block h-full rounded-full bg-gradient-to-l from-rose-500 to-saffron-500 transition-all duration-700"
                    style={{ width: `${Math.max(3, (sum / (byType[0]?.sum || 1)) * 100)}%` }} />
                </span>
                <span className="w-[120px] text-left num text-[12px] font-bold text-ink-2 shrink-0">{money(sum)}</span>
                <span className="w-[46px] text-left text-[10.5px] text-ink-3 shrink-0">{faNum(Math.round((sum / (total || 1)) * 100))}٪</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <table className="tbl">
          <thead><tr><th>سند</th><th>تاریخ</th><th>نوع</th><th>طرف حساب</th><th>روش</th><th>مبلغ</th><th>ثبت‌کننده</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="num font-bold">{noLabel("ه", e.no)}</td>
                <td>{faDate(e.date)}</td>
                <td><Badge tone="saffron">{db.expenseTypes.find((t) => t.id === e.typeId)?.name}</Badge></td>
                <td className="text-[12px]">{db.parties.find((x) => x.id === e.partyId)?.name ?? "—"}</td>
                <td className="text-[11.5px] text-ink-2">{e.method}</td>
                <td className="num font-bold text-rose-500">−{money(e.amount)}</td>
                <td className="text-[11.5px] text-ink-2">{e.createdBy}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}><EmptyState icon="receipt" title="هزینه‌ای نیست" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= عملکرد کاربران ================= */

export function UsersActivityPage() {
  const { db } = useApp();
  const [userId, setUserId] = useState("all");
  const [entity, setEntity] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const logs = useMemo(() => db.audit
    .filter((l) => userId === "all" || l.userId === userId)
    .filter((l) => entity === "all" || l.entity === entity)
    .filter((l) => {
      const d = new Date(l.at).toISOString().slice(0, 10);
      return (!from || d >= from) && (!to || d <= to);
    })
    .slice(0, 120), [db, userId, entity, from, to]);

  const matrix = useMemo(() => {
    const users = userId === "all" ? db.users : db.users.filter((u) => u.id === userId);
    return users.map((u) => {
      const ul = db.audit.filter((l) => l.userId === u.id)
        .filter((l) => {
          const d = new Date(l.at).toISOString().slice(0, 10);
          return (!from || d >= from) && (!to || d <= to);
        });
      const count = (en: string) => ul.filter((l) => l.entity === en).length;
      return {
        u,
        stockIn: count("stockIn"), stockOut: count("stockOut"), expense: count("expense"),
        payment: count("payment"), purchase: count("purchase"), product: count("product"),
        party: count("party"), edits: ul.filter((l) => l.action === "update").length,
        deletes: ul.filter((l) => l.action === "delete").length,
        total: ul.length,
      };
    });
  }, [db, userId, from, to]);

  const cols: Col<AuditLog>[] = [
    { key: "at", label: "زمان", sortable: true, sortVal: (l) => l.at, render: (l) => <span className="text-[12px] num">{faDateTime(l.at)}</span> },
    {
      key: "user", label: "کاربر", sortable: true, sortVal: (l) => l.userName,
      render: (l) => <span className="flex items-center gap-2"><Avatar name={l.userName} className="w-7 h-7 text-[10.5px]" /><b className="text-[12.5px]">{l.userName}</b></span>,
    },
    {
      key: "action", label: "عملیات",
      render: (l) => (
        <Badge tone={l.action === "create" ? "pine" : l.action === "delete" ? "rose" : l.action === "update" ? "saffron" : "gray"}>
          {ACTION_FA[l.action]}
        </Badge>
      ),
    },
    { key: "entity", label: "بخش", render: (l) => <span className="text-[12px]">{ENTITY_FA[l.entity]}</span> },
    { key: "ref", label: "شرح", render: (l) => <span className="text-[12px] text-ink-2 block max-w-[380px] truncate">{l.ref}</span> },
  ];

  return (
    <div>
      <PageHead title="گزارش عملکرد کاربران" desc="هر کاربر چه عملیاتی را در چه زمانی انجام داده است — بر اساس گزارش حسابرسی سیستم."
        actions={
          <Btn variant="outline" icon="download" onClick={() =>
            downloadCSV("users-activity", [["کاربر", "زمان", "عملیات", "بخش", "شرح"],
            ...logs.map((l) => [l.userName, faDateTime(l.at), ACTION_FA[l.action], ENTITY_FA[l.entity], l.ref])])
          }>خروجی Excel</Btn>
        } />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="ctl !w-auto" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="all">همه کاربران</option>
          {db.users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <select className="ctl !w-auto" value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="all">همه بخش‌ها</option>
          {(Object.keys(ENTITY_FA) as (keyof typeof ENTITY_FA)[]).filter((k) => k !== "login").map((k) => <option key={k} value={k}>{ENTITY_FA[k]}</option>)}
        </select>
        <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-[12px] text-ink-3">تا</span>
        <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {/* ماتریس عملکرد */}
      <div className="bg-card border border-line rounded-xl overflow-x-auto mb-4 anim-fade-up">
        <table className="tbl min-w-[760px]">
          <thead>
            <tr>
              <th>کاربر</th><th>ورود کالا</th><th>خروج کالا</th><th>هزینه</th><th>دریافت/پرداخت</th><th>فاکتور</th><th>کالا</th><th>طرف حساب</th><th>ویرایش</th><th>حذف</th><th>جمع</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((m) => (
              <tr key={m.u.id}>
                <td><span className="flex items-center gap-2"><Avatar name={m.u.fullName} className="w-7 h-7 text-[10.5px]" /><b className="text-[12.5px]">{m.u.fullName}</b>{!m.u.active && <Badge tone="rose">غیرفعال</Badge>}</span></td>
                {[m.stockIn, m.stockOut, m.expense, m.payment, m.purchase, m.product, m.party].map((v, i) => (
                  <td key={i}><span className={`num font-bold text-[13px] ${v ? "text-night" : "text-ink-3"}`}>{faNum(v)}</span></td>
                ))}
                <td><span className="num font-bold text-[13px] text-saffron-700">{faNum(m.edits)}</span></td>
                <td><span className="num font-bold text-[13px] text-rose-500">{faNum(m.deletes)}</span></td>
                <td><span className="num font-display text-[16px]">{faNum(m.total)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DataTable columns={cols} rows={logs} keyFor={(l) => l.id}
        empty={<EmptyState icon="users" title="فعالیتی ثبت نشده" desc="با فیلترهای انتخاب‌شده عملیاتی وجود ندارد." />} />
    </div>
  );
}

/* ================= محصولات کم‌موجود (placeholder export) ================= */

export type { Product };
