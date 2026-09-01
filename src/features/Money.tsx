import { useEffect, useMemo, useState } from "react";
import { useApp } from "../state";
import type { Params } from "../state";
import type { Expense, Party, Payment, Purchase, PurchaseType } from "../lib/db";
import {
  faDate, faDateTime, faNum, money, noLabel, partySum, todayISO, uid, downloadCSV,
  PAY_METHODS, PURCHASE_TYPE_FA,
} from "../lib/db";
import { Btn, IconBtn, Badge, Field, Modal, PageHead, SearchBox, DataTable, EmptyState, ImageInput, Avatar } from "../components/ui";
import type { Col } from "../components/ui";

/* ================= واریزی / پرداختی / سایر پرداخت‌ها ================= */

export type PayView = "deposits" | "payouts" | "misc";

interface PayDraft {
  id: string; kind: "in" | "out"; misc: boolean; no: number; date: string;
  partyId: string; amount: number; method: string; refNo: string; note: string;
}

const VIEW_META: Record<PayView, { title: string; desc: string; icon: string; kind: "in" | "out"; misc: boolean; verb: string }> = {
  deposits: { title: "واریزی‌های طرف حساب‌ها", desc: "مبالغ دریافتی از طرف حساب‌ها — مانده بدهی آنها را کاهش می‌دهد.", icon: "wallet", kind: "in", misc: false, verb: "واریزی" },
  payouts: { title: "پرداختی‌ها به طرف حساب‌ها", desc: "مبالغ پرداختی به فروشندگان و طرف حساب‌ها — مانده بستانکاری را تسویه می‌کند.", icon: "banknote", kind: "out", misc: false, verb: "پرداختی" },
  misc: { title: "سایر پرداخت‌ها", desc: "پرداخت‌های متفرقه که به تسویه حساب طرف حساب خاصی مربوط نیست.", icon: "hand", kind: "out", misc: true, verb: "پرداخت" },
};

export function PaymentsPage({ view, params }: { view: PayView; params: Params }) {
  const { db, savePayment, deletePayment, toast, confirm, nav } = useApp();
  const meta = VIEW_META[view];
  const [q, setQ] = useState("");
  const [party, setParty] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState<PayDraft | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const newDraft = (): PayDraft => ({
    id: uid(), kind: meta.kind, misc: meta.misc, no: db.seq.pay, date: todayISO(),
    partyId: "", amount: 0, method: PAY_METHODS[0], refNo: "", note: "",
  });

  useEffect(() => {
    if (params.new) setForm(newDraft());
    if (params.view) setViewId(params.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const rows = useMemo(() => db.payments
    .filter((p) => p.kind === meta.kind && p.misc === meta.misc)
    .filter((p) => !party || p.partyId === party)
    .filter((p) => !from || p.date >= from)
    .filter((p) => !to || p.date <= to)
    .filter((p) => {
      if (!q) return true;
      const pn = db.parties.find((x) => x.id === p.partyId)?.name ?? "";
      return (pn + p.note + p.refNo + p.createdBy).includes(q);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [db, meta, q, party, from, to]);

  const total = rows.reduce((s, p) => s + p.amount, 0);
  const viewDoc = viewId ? db.payments.find((p) => p.id === viewId) : null;

  const cols: Col<Payment>[] = [
    {
      key: "no", label: "شماره", sortable: true, sortVal: (p) => p.no,
      render: (p) => (
        <span className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.kind === "in" ? "bg-pine-50 text-pine-600" : "bg-rose-100 text-rose-500"}`}>
            <span className="font-display text-[14px]">{p.kind === "in" ? "+" : "−"}</span>
          </span>
          <b className="num text-[13px]">{noLabel("ر", p.no)}</b>
        </span>
      ),
    },
    { key: "date", label: "تاریخ", sortable: true, sortVal: (p) => p.date, render: (p) => <span className="text-[12.5px]">{faDate(p.date)}</span> },
    {
      key: "party", label: "طرف حساب", sortable: true, sortVal: (p) => db.parties.find((x) => x.id === p.partyId)?.name ?? "",
      render: (p) => (
        <span className="flex items-center gap-2">
          <Avatar name={db.parties.find((x) => x.id === p.partyId)?.name ?? "م"} className="w-7 h-7 text-[10.5px]" />
          <span className="font-bold text-[12.5px]">{db.parties.find((x) => x.id === p.partyId)?.name ?? "متفرقه"}</span>
        </span>
      ),
    },
    {
      key: "amount", label: `مبلغ (${db.settings.currency})`, sortable: true, sortVal: (p) => p.amount,
      render: (p) => <b className={`num text-[13px] ${p.kind === "in" ? "text-pine-600" : "text-rose-500"}`}>{p.kind === "in" ? "+" : "−"}{money(p.amount)}</b>,
    },
    { key: "method", label: "روش پرداخت", render: (p) => <Badge tone="gray">{p.method}</Badge> },
    { key: "ref", label: "شماره پیگیری", render: (p) => <span className="text-[11.5px] text-ink-2" dir="ltr">{p.refNo || "—"}</span> },
    { key: "by", label: "ثبت‌کننده", render: (p) => <span className="text-[11.5px] text-ink-2">{p.createdBy}<span className="block text-ink-3 text-[10.5px]">{faDateTime(p.createdAt)}</span></span> },
    {
      key: "act", label: "عملیات", cls: "w-[120px]",
      render: (p) => (
        <span className="flex items-center gap-0.5">
          <IconBtn icon="eye" title="جزئیات" onClick={() => setViewId(p.id)} />
          <IconBtn icon="pencil" title="ویرایش" onClick={() => setForm({ ...p, partyId: p.partyId ?? "" })} />
          <IconBtn icon="loop" title="گردش حساب طرف" tone="saffron" onClick={() => p.partyId && nav("ledger", { party: p.partyId })} />
          <IconBtn icon="trash" title="حذف" tone="rose" onClick={async () => {
            const ok = await confirm(`${meta.verb} ${noLabel("ر", p.no)} حذف شود؟`);
            if (!ok) return;
            deletePayment(p.id);
            toast("حذف شد.");
          }} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title={meta.title} desc={meta.desc}
        actions={
          <>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV(view, [["شماره", "تاریخ", "طرف حساب", "مبلغ", "روش پرداخت", "پیگیری", "توضیح", "ثبت‌کننده"],
              ...rows.map((p) => [noLabel("ر", p.no), faDate(p.date), db.parties.find((x) => x.id === p.partyId)?.name ?? "متفرقه", p.amount, p.method, p.refNo, p.note, p.createdBy])])
            }>خروجی Excel</Btn>
            <Btn icon="plus" onClick={() => setForm(newDraft())}>ثبت {meta.verb}</Btn>
          </>
        } />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجو..." />
        {!meta.misc && (
          <select className="ctl !w-auto" value={party} onChange={(e) => setParty(e.target.value)}>
            <option value="">همه طرف حساب‌ها</option>
            {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-[12px] text-ink-3">تا</span>
        <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        <span className="mr-auto text-[12px] text-ink-3">
          {faNum(rows.length)} مورد · جمع: <b className={`num text-[13px] ${meta.kind === "in" ? "text-pine-600" : "text-rose-500"}`}>{money(total)}</b> {db.settings.currency}
        </span>
      </div>

      <DataTable columns={cols} rows={rows} keyFor={(p) => p.id}
        empty={<EmptyState icon={meta.icon} title={`${meta.verb} ثبت نشده`} desc="اولین مورد را ثبت کنید." />} />

      {form && (
        <Modal title={db.payments.some((x) => x.id === form.id) ? `ویرایش ${meta.verb} ${noLabel("ر", form.no)}` : `ثبت ${meta.verb} — شماره ${noLabel("ر", form.no)}`}
          icon={meta.icon} onClose={() => setForm(null)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setForm(null)}>انصراف</Btn>
              <Btn icon="check" onClick={() => {
                if (!form.amount || form.amount <= 0) { toast("مبلغ باید بیشتر از صفر باشد.", "err"); return; }
                if (!meta.misc && !form.partyId) { toast("طرف حساب را انتخاب کنید.", "err"); return; }
                const ex = db.payments.find((x) => x.id === form.id);
                savePayment({ ...form, partyId: form.partyId || null, note: form.note.trim(), refNo: form.refNo.trim(), createdBy: ex?.createdBy ?? "", createdAt: ex?.createdAt ?? 0, updatedBy: "", updatedAt: 0 });
                toast(meta.verb + " ذخیره شد.");
                setForm(null);
              }}>ذخیره</Btn>
            </>
          }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="تاریخ" required><input type="date" className="ctl" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label={meta.misc ? "طرف حساب (اختیاری)" : "طرف حساب"} required={!meta.misc}>
              <select className="ctl" value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
                <option value="">— انتخاب —</option>
                {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={`مبلغ (${db.settings.currency})`} required>
              <input type="number" min={0} className="ctl num" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
            </Field>
            <Field label="روش پرداخت">
              <select className="ctl" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="شماره پیگیری"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={form.refNo} onChange={(e) => setForm({ ...form, refNo: e.target.value })} /></Field>
            <Field label="توضیحات"><input className="ctl" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>
        </Modal>
      )}

      {viewDoc && (
        <Modal title={`${meta.verb} ${noLabel("ر", viewDoc.no)}`} icon={meta.icon} onClose={() => setViewId(null)}>
          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">تاریخ</span><b>{faDate(viewDoc.date)}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">طرف حساب</span><b>{db.parties.find((x) => x.id === viewDoc.partyId)?.name ?? "متفرقه"}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">مبلغ</span><b className="font-display text-[19px] num">{money(viewDoc.amount)} <span className="text-[10px]">{db.settings.currency}</span></b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">روش پرداخت</span><b>{viewDoc.method}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">شماره پیگیری</span><b dir="ltr">{viewDoc.refNo || "—"}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">ثبت‌کننده</span><b>{viewDoc.createdBy}</b><span className="block text-[10.5px] text-ink-3">{faDateTime(viewDoc.createdAt)}</span></div>
            {viewDoc.note && <div className="col-span-2 bg-paper rounded-lg p-3">{viewDoc.note}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= گردش حساب طرف حساب ================= */

interface LedgerRow {
  id: string; date: string; desc: string; kind: string;
  debit: number; credit: number; by: string; at: number;
}

export function LedgerPage({ params }: { params: Params }) {
  const { db, nav, print, toast } = useApp();
  const [partyId, setPartyId] = useState(params.party ?? db.parties[0]?.id ?? "");

  const rows = useMemo(() => {
    if (!partyId) return [];
    const list: LedgerRow[] = [];
    for (const d of db.stockDocs) {
      if (d.partyId !== partyId) continue;
      const t = d.items.reduce((s, i) => s + i.qty * i.price, 0);
      list.push({
        id: d.id, date: d.date, at: d.createdAt,
        desc: d.kind === "out" ? `فاکتور فروش ${noLabel("خ", d.no)}` : `خرید از فروشنده ${noLabel("و", d.no)}`,
        kind: d.kind === "out" ? "خروج کالا" : "ورود کالا",
        debit: d.kind === "out" ? t : 0, credit: d.kind === "in" ? t : 0, by: d.createdBy,
      });
    }
    for (const p of db.payments) {
      if (p.partyId !== partyId || p.misc) continue;
      list.push({
        id: p.id, date: p.date, at: p.createdAt,
        desc: p.kind === "in" ? `واریزی ${noLabel("ر", p.no)} — ${p.method}` : `پرداختی ${noLabel("ر", p.no)} — ${p.method}`,
        kind: p.kind === "in" ? "دریافت" : "پرداخت",
        debit: p.kind === "out" ? p.amount : 0, credit: p.kind === "in" ? p.amount : 0, by: p.createdBy,
      });
    }
    list.sort((a, b) => a.date.localeCompare(b.date) || a.at - b.at);
    let run = 0;
    return list.map((r) => ({ ...r, balance: (run = run + r.debit - r.credit) }));
  }, [db, partyId]);

  const sum = partyId ? partySum(db, partyId) : null;
  const party = db.parties.find((p) => p.id === partyId);

  const cols: Col<LedgerRow & { balance: number }>[] = [
    { key: "date", label: "تاریخ", sortable: true, sortVal: (r) => r.date, render: (r) => <span className="text-[12.5px]">{faDate(r.date)}</span> },
    { key: "desc", label: "شرح عملیات", render: (r) => <span className="font-bold text-[12.5px]">{r.desc}<span className="block text-[10.5px] text-ink-3 font-normal">{r.kind}</span></span> },
    { key: "debit", label: "بدهکار", render: (r) => r.debit ? <b className="num text-rose-500">{money(r.debit)}</b> : <span className="text-ink-3">—</span> },
    { key: "credit", label: "بستانکار", render: (r) => r.credit ? <b className="num text-pine-600">{money(r.credit)}</b> : <span className="text-ink-3">—</span> },
    {
      key: "balance", label: "مانده", sortable: true, sortVal: (r) => r.balance,
      render: (r) => (
        <span className={`num font-bold text-[12.5px] ${r.balance > 0 ? "text-rose-500" : r.balance < 0 ? "text-pine-600" : "text-ink-3"}`}>
          {money(Math.abs(r.balance))} {r.balance > 0 ? "بدهکار" : r.balance < 0 ? "بستانکار" : "تسویه"}
        </span>
      ),
    },
    { key: "by", label: "ثبت‌کننده", render: (r) => <span className="text-[11.5px] text-ink-2">{r.by}</span> },
  ];

  return (
    <div>
      <PageHead title="گردش حساب طرف حساب" desc="ریز همه عملیات مالی یک طرف حساب با مانده لحظه‌ای."
        actions={
          <>
            <Btn variant="outline" icon="download" disabled={!party} onClick={() =>
              downloadCSV("ledger-" + (party?.name ?? ""), [["تاریخ", "شرح", "بدهکار", "بستانکار", "مانده", "ثبت‌کننده"],
              ...rows.map((r) => [faDate(r.date), r.desc, r.debit, r.credit, r.balance, r.by])])
            }>خروجی Excel</Btn>
            <Btn variant="outline" icon="printer" disabled={!party} onClick={() => {
              if (!party) return;
              print({
                kind: "sheet", title: "گردش حساب", subtitle: party.name,
                meta: [["طرف حساب", party.name], ["مانده نهایی", `${money(Math.abs(sum?.balance ?? 0))} ${sum && sum.balance > 0 ? "بدهکار" : "بستانکار"} `]],
                head: ["تاریخ", "شرح", "بدهکار", "بستانکار", "مانده", "ثبت‌کننده"],
                rows: rows.map((r) => [faDate(r.date), r.desc, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : "", money(r.balance), r.by]),
                foot: [`جمع بدهکار: ${money(rows.reduce((s, r) => s + r.debit, 0))}`, `جمع بستانکار: ${money(rows.reduce((s, r) => s + r.credit, 0))}`],
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ گردش</Btn>
          </>
        } />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="ctl !w-auto min-w-[220px]" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
          {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {party && (
          <>
            <Badge tone="gray">{party.type === "customer" ? "مشتری" : party.type === "supplier" ? "فروشنده" : "سایر"}</Badge>
            <Btn variant="ghost" size="sm" icon="card" onClick={() => nav("parties")}>مدیریت طرف حساب‌ها</Btn>
          </>
        )}
      </div>

      {sum && party && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { l: "جمع خرید از ما (خروج)", v: sum.docOutSum, c: "text-saffron-700" },
            { l: "جمع خرید ما (ورود)", v: sum.docInSum, c: "text-pine-600" },
            { l: "واریزی‌های دریافتی", v: sum.depSum, c: "text-pine-600" },
            { l: "پرداختی‌های ما", v: sum.paySum, c: "text-rose-500" },
          ].map((x, i) => (
            <div key={i} className="bg-card border border-line rounded-xl p-3.5 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="block text-[10.5px] text-ink-3 mb-1">{x.l}</span>
              <b className={`num text-[15px] ${x.c}`}>{money(x.v)}</b>
            </div>
          ))}
          <div className={`rounded-xl p-3.5 text-white anim-fade-up ${sum.balance > 0 ? "bg-rose-500" : sum.balance < 0 ? "bg-pine-600" : "bg-night-2"}`} style={{ animationDelay: "200ms" }}>
            <span className="block text-[10.5px] opacity-75 mb-1">مانده نهایی</span>
            <b className="num text-[15px]">{sum.balance === 0 ? "تسویه" : `${money(Math.abs(sum.balance))} ${sum.balance > 0 ? "بدهکار" : "بستانکار"}`}</b>
          </div>
        </div>
      )}

      <DataTable columns={cols} rows={rows} keyFor={(r) => r.id}
        empty={<EmptyState icon="scale" title="عملیاتی ثبت نشده" desc="برای این طرف حساب هنوز سند مالی وجود ندارد." />} />
    </div>
  );
}

/* ================= خرید کالا / فاکتور خدمات ================= */

interface PurchaseDraft {
  id: string; type: PurchaseType; no: number; date: string; partyId: string;
  title: string; amount: number; note: string; image: string | null;
}

export function PurchasesPage({ preset, params }: { preset: "goods" | "service"; params: Params }) {
  const { db, savePurchase, deletePurchase, toast, confirm } = useApp();
  const [type, setType] = useState<string>(preset === "service" ? "service" : "all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState<PurchaseDraft | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const newDraft = (): PurchaseDraft => ({
    id: uid(), type: preset === "service" ? "service" : "goods", no: db.seq.purchase,
    date: todayISO(), partyId: "", title: "", amount: 0, note: "", image: null,
  });

  useEffect(() => {
    if (params.new) setForm(newDraft());
    if (params.view) setViewId(params.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, preset]);

  const rows = useMemo(() => db.purchases
    .filter((p) => type === "all" || p.type === type)
    .filter((p) => !from || p.date >= from).filter((p) => !to || p.date <= to)
    .filter((p) => (p.title + (db.parties.find((x) => x.id === p.partyId)?.name ?? "") + p.note).includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [db, type, q, from, to]);

  const total = rows.reduce((s, p) => s + p.amount, 0);
  const viewDoc = viewId ? db.purchases.find((p) => p.id === viewId) : null;

  const cols: Col<Purchase>[] = [
    {
      key: "no", label: "شماره", sortable: true, sortVal: (p) => p.no,
      render: (p) => (
        <span className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg border border-line bg-paper overflow-hidden flex items-center justify-center shrink-0">
            {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <span className="font-display text-pine-600 text-[13px]">فا</span>}
          </span>
          <b className="num text-[13px]">{noLabel("فا", p.no)}</b>
        </span>
      ),
    },
    { key: "date", label: "تاریخ", sortable: true, sortVal: (p) => p.date, render: (p) => <span className="text-[12.5px]">{faDate(p.date)}</span> },
    { key: "title", label: "عنوان خرید", render: (p) => <span className="font-bold text-[12.5px] block max-w-[220px] truncate">{p.title}</span> },
    {
      key: "type", label: "نوع", sortable: true, sortVal: (p) => p.type,
      render: (p) => <Badge tone={p.type === "service" ? "saffron" : "pine"}>{PURCHASE_TYPE_FA[p.type]}</Badge>,
    },
    { key: "party", label: "طرف حساب", render: (p) => <span className="text-[12px]">{db.parties.find((x) => x.id === p.partyId)?.name ?? "—"}</span> },
    { key: "amount", label: "مبلغ", sortable: true, sortVal: (p) => p.amount, render: (p) => <b className="num text-[13px]">{money(p.amount)}</b> },
    { key: "by", label: "ثبت‌کننده", render: (p) => <span className="text-[11.5px] text-ink-2">{p.createdBy}<span className="block text-ink-3 text-[10.5px]">{faDateTime(p.createdAt)}</span></span> },
    {
      key: "act", label: "عملیات", cls: "w-[110px]",
      render: (p) => (
        <span className="flex items-center gap-0.5">
          <IconBtn icon="eye" title="جزئیات و تصویر" onClick={() => setViewId(p.id)} />
          <IconBtn icon="pencil" title="ویرایش" onClick={() => setForm({ ...p, partyId: p.partyId ?? "" })} />
          <IconBtn icon="trash" title="حذف" tone="rose" onClick={async () => {
            const ok = await confirm(`فاکتور ${noLabel("فا", p.no)} حذف شود؟`);
            if (!ok) return;
            deletePurchase(p.id);
            toast("فاکتور حذف شد.");
          }} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title={preset === "service" ? "فاکتورهای خدمات" : "فاکتورها و خریدهای شرکت"}
        desc={preset === "service" ? "خرید خدمات، تعمیرات و سرویس‌های دریافتی شرکت." : "خرید کالا، تجهیزات و لوازم اداری شرکت — با تصویر فاکتور یا رسید."}
        actions={
          <>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("purchases", [["شماره", "تاریخ", "عنوان", "نوع", "طرف حساب", "مبلغ", "ثبت‌کننده"],
              ...rows.map((p) => [noLabel("فا", p.no), faDate(p.date), p.title, PURCHASE_TYPE_FA[p.type], db.parties.find((x) => x.id === p.partyId)?.name ?? "", p.amount, p.createdBy])])
            }>خروجی Excel</Btn>
            <Btn icon="plus" onClick={() => setForm(newDraft())}>ثبت فاکتور</Btn>
          </>
        } />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی عنوان، طرف حساب..." />
        <div className="flex bg-card border border-line rounded-lg p-0.5 flex-wrap">
          {([["all", "همه"], ["goods", "خرید کالا"], ["service", "خدمات"], ["equipment", "تجهیزات"], ["office", "لوازم اداری"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setType(k)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${type === k ? "bg-pine-600 text-white shadow-sm" : "text-ink-2 hover:text-pine-700"}`}>{l}</button>
          ))}
        </div>
        <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-[12px] text-ink-3">تا</span>
        <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        <span className="mr-auto text-[12px] text-ink-3">{faNum(rows.length)} فاکتور · جمع: <b className="num text-ink">{money(total)}</b> {db.settings.currency}</span>
      </div>

      <DataTable columns={cols} rows={rows} keyFor={(p) => p.id}
        empty={<EmptyState icon="cart" title="فاکتوری ثبت نشده" desc="خریدهای شرکت را اینجا ثبت و بایگانی کنید." />} />

      {form && (
        <Modal title={db.purchases.some((x) => x.id === form.id) ? `ویرایش فاکتور ${noLabel("فا", form.no)}` : `ثبت فاکتور — شماره ${noLabel("فا", form.no)}`}
          icon="cart" onClose={() => setForm(null)} wide
          footer={
            <>
              <Btn variant="outline" onClick={() => setForm(null)}>انصراف</Btn>
              <Btn icon="check" onClick={() => {
                if (!form.title.trim()) { toast("عنوان خرید الزامی است.", "err"); return; }
                if (!form.amount || form.amount <= 0) { toast("مبلغ را وارد کنید.", "err"); return; }
                const ex = db.purchases.find((x) => x.id === form.id);
                savePurchase({ ...form, partyId: form.partyId || null, note: form.note.trim(), title: form.title.trim(), createdBy: ex?.createdBy ?? "", createdAt: ex?.createdAt ?? 0, updatedBy: "", updatedAt: 0 });
                toast("فاکتور ذخیره شد.");
                setForm(null);
              }}>ذخیره فاکتور</Btn>
            </>
          }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="عنوان خرید" required className="sm:col-span-2"><input className="ctl" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً خرید کارتن بسته‌بندی" /></Field>
            <Field label="تاریخ" required><input type="date" className="ctl" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="نوع خرید">
              <select className="ctl" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PurchaseType })}>
                {(Object.keys(PURCHASE_TYPE_FA) as PurchaseType[]).map((k) => <option key={k} value={k}>{PURCHASE_TYPE_FA[k]}</option>)}
              </select>
            </Field>
            <Field label="طرف حساب (فروشنده)">
              <select className="ctl" value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
                <option value="">— بدون طرف حساب —</option>
                {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={`مبلغ (${db.settings.currency})`} required><input type="number" min={0} className="ctl num" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></Field>
            <Field label="توضیحات" className="sm:col-span-2"><input className="ctl" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="sm:col-span-2"><ImageInput label="تصویر فاکتور یا رسید" value={form.image} onChange={(v) => setForm({ ...form, image: v })} /></div>
          </div>
        </Modal>
      )}

      {viewDoc && (
        <Modal title={`فاکتور ${noLabel("فا", viewDoc.no)}`} icon="cart" onClose={() => setViewId(null)}>
          <div className="grid grid-cols-2 gap-3 text-[12.5px] mb-4">
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">تاریخ</span><b>{faDate(viewDoc.date)}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">نوع</span><Badge tone="pine">{PURCHASE_TYPE_FA[viewDoc.type]}</Badge></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">طرف حساب</span><b>{db.parties.find((x) => x.id === viewDoc.partyId)?.name ?? "—"}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">مبلغ</span><b className="font-display text-[19px] num">{money(viewDoc.amount)}</b></div>
            <div className="col-span-2 bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">ثبت‌کننده</span>{viewDoc.createdBy} — {faDateTime(viewDoc.createdAt)}</div>
            {viewDoc.note && <div className="col-span-2 bg-paper rounded-lg p-3">{viewDoc.note}</div>}
          </div>
          {viewDoc.image
            ? <img src={viewDoc.image} alt="تصویر فاکتور" className="w-full rounded-lg border border-line" />
            : <p className="text-center text-[12px] text-ink-3 py-4 border border-dashed border-line-2 rounded-lg">تصویری پیوست نشده است.</p>}
        </Modal>
      )}
    </div>
  );
}

/* ================= هزینه‌های شرکت ================= */

interface ExpDraft {
  id: string; no: number; date: string; typeId: string; partyId: string;
  amount: number; method: string; note: string; image: string | null;
}

export function ExpensesPage({ params }: { params: Params }) {
  const { db, saveExpense, deleteExpense, toast, confirm, print } = useApp();
  const [q, setQ] = useState("");
  const [typeId, setTypeId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState<ExpDraft | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const newDraft = (): ExpDraft => ({
    id: uid(), no: db.seq.expense, date: todayISO(), typeId: db.expenseTypes[0]?.id ?? "",
    partyId: "", amount: 0, method: PAY_METHODS[0], note: "", image: null,
  });

  useEffect(() => {
    if (params.new) setForm(newDraft());
    if (params.view) setViewId(params.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const rows = useMemo(() => db.expenses
    .filter((e) => !typeId || e.typeId === typeId)
    .filter((e) => !partyId || e.partyId === partyId)
    .filter((e) => !from || e.date >= from).filter((e) => !to || e.date <= to)
    .filter((e) => (e.note + (db.parties.find((x) => x.id === e.partyId)?.name ?? "")).includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [db, typeId, partyId, from, to, q]);

  const total = rows.reduce((s, e) => s + e.amount, 0);
  const viewDoc = viewId ? db.expenses.find((e) => e.id === viewId) : null;

  const cols: Col<Expense>[] = [
    {
      key: "no", label: "سند", sortable: true, sortVal: (e) => e.no,
      render: (e) => (
        <span className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-night-2 text-saffron-300 flex items-center justify-center font-display text-[12px]">ه</span>
          <b className="num text-[13px]">{noLabel("ه", e.no)}</b>
        </span>
      ),
    },
    { key: "date", label: "تاریخ", sortable: true, sortVal: (e) => e.date, render: (e) => <span className="text-[12.5px]">{faDate(e.date)}</span> },
    { key: "type", label: "نوع هزینه", sortable: true, sortVal: (e) => db.expenseTypes.find((t) => t.id === e.typeId)?.name ?? "", render: (e) => <Badge tone="saffron">{db.expenseTypes.find((t) => t.id === e.typeId)?.name}</Badge> },
    { key: "party", label: "طرف حساب", render: (e) => <span className="text-[12px]">{db.parties.find((x) => x.id === e.partyId)?.name ?? "—"}</span> },
    { key: "amount", label: "مبلغ", sortable: true, sortVal: (e) => e.amount, render: (e) => <b className="num text-[13px] text-rose-500">−{money(e.amount)}</b> },
    { key: "method", label: "روش پرداخت", render: (e) => <span className="text-[11.5px] text-ink-2">{e.method}</span> },
    { key: "by", label: "ثبت‌کننده", render: (e) => <span className="text-[11.5px] text-ink-2">{e.createdBy}<span className="block text-ink-3 text-[10.5px]">{faDateTime(e.createdAt)}</span></span> },
    {
      key: "act", label: "عملیات", cls: "w-[110px]",
      render: (e) => (
        <span className="flex items-center gap-0.5">
          <IconBtn icon="eye" title="جزئیات و رسید" onClick={() => setViewId(e.id)} />
          <IconBtn icon="pencil" title="ویرایش" onClick={() => setForm({ ...e, partyId: e.partyId ?? "" })} />
          <IconBtn icon="trash" title="حذف" tone="rose" onClick={async () => {
            const ok = await confirm(`سند هزینه ${noLabel("ه", e.no)} حذف شود؟`);
            if (!ok) return;
            deleteExpense(e.id);
            toast("هزینه حذف شد.");
          }} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title="هزینه‌های شرکت" desc="ثبت هزینه‌های جاری — برق، آب، اجاره، حمل‌ونقل، تعمیرات و سایر."
        actions={
          <>
            <Btn variant="outline" icon="printer" onClick={() => {
              print({
                kind: "sheet", title: "گزارش هزینه‌ها", subtitle: `${faNum(rows.length)} سند`,
                meta: [["جمع هزینه‌ها", `${money(total)} ${db.settings.currency}`]],
                head: ["سند", "تاریخ", "نوع", "طرف حساب", "مبلغ", "روش", "ثبت‌کننده"],
                rows: rows.map((e) => [noLabel("ه", e.no), faDate(e.date), db.expenseTypes.find((t) => t.id === e.typeId)?.name ?? "", db.parties.find((x) => x.id === e.partyId)?.name ?? "—", money(e.amount), e.method, e.createdBy]),
                foot: [`جمع کل: ${money(total)} ${db.settings.currency}`],
              });
              toast("در حال آماده‌سازی چاپ...");
            }}>چاپ</Btn>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("expenses", [["سند", "تاریخ", "نوع", "طرف حساب", "مبلغ", "روش پرداخت", "توضیح", "ثبت‌کننده"],
              ...rows.map((e) => [noLabel("ه", e.no), faDate(e.date), db.expenseTypes.find((t) => t.id === e.typeId)?.name ?? "", db.parties.find((x) => x.id === e.partyId)?.name ?? "", e.amount, e.method, e.note, e.createdBy])])
            }>خروجی Excel</Btn>
            <Btn icon="plus" onClick={() => setForm(newDraft())}>ثبت هزینه</Btn>
          </>
        } />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجو..." />
        <select className="ctl !w-auto" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">همه انواع</option>
          {db.expenseTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="ctl !w-auto" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
          <option value="">همه طرف حساب‌ها</option>
          {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-[12px] text-ink-3">تا</span>
        <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        <span className="mr-auto text-[12px] text-ink-3">{faNum(rows.length)} سند · جمع: <b className="num text-rose-500">{money(total)}</b> {db.settings.currency}</span>
      </div>

      <DataTable columns={cols} rows={rows} keyFor={(e) => e.id}
        empty={<EmptyState icon="receipt" title="هزینه‌ای ثبت نشده" desc="هزینه‌های جاری شرکت را ثبت کنید تا گزارش کامل باشد." />} />

      {form && (
        <Modal title={db.expenses.some((x) => x.id === form.id) ? `ویرایش سند ${noLabel("ه", form.no)}` : `ثبت هزینه — سند ${noLabel("ه", form.no)}`}
          icon="receipt" onClose={() => setForm(null)} wide
          footer={
            <>
              <Btn variant="outline" onClick={() => setForm(null)}>انصراف</Btn>
              <Btn icon="check" onClick={() => {
                if (!form.amount || form.amount <= 0) { toast("مبلغ را وارد کنید.", "err"); return; }
                const ex = db.expenses.find((x) => x.id === form.id);
                saveExpense({ ...form, partyId: form.partyId || null, note: form.note.trim(), createdBy: ex?.createdBy ?? "", createdAt: ex?.createdAt ?? 0, updatedBy: "", updatedAt: 0 });
                toast("هزینه ثبت شد.");
                setForm(null);
              }}>ذخیره هزینه</Btn>
            </>
          }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="تاریخ" required><input type="date" className="ctl" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="نوع هزینه" required>
              <select className="ctl" value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
                {db.expenseTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="طرف حساب (اختیاری)">
              <select className="ctl" value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
                <option value="">— بدون طرف حساب —</option>
                {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={`مبلغ (${db.settings.currency})`} required><input type="number" min={0} className="ctl num" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></Field>
            <Field label="روش پرداخت">
              <select className="ctl" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="توضیحات"><input className="ctl" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="sm:col-span-2"><ImageInput label="تصویر رسید" value={form.image} onChange={(v) => setForm({ ...form, image: v })} /></div>
          </div>
        </Modal>
      )}

      {viewDoc && (
        <Modal title={`سند هزینه ${noLabel("ه", viewDoc.no)}`} icon="receipt" onClose={() => setViewId(null)}>
          <div className="grid grid-cols-2 gap-3 text-[12.5px] mb-4">
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">تاریخ</span><b>{faDate(viewDoc.date)}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">نوع</span><Badge tone="saffron">{db.expenseTypes.find((t) => t.id === viewDoc.typeId)?.name}</Badge></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">مبلغ</span><b className="font-display text-[19px] num text-rose-500">{money(viewDoc.amount)}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">روش پرداخت</span><b>{viewDoc.method}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">طرف حساب</span><b>{db.parties.find((x) => x.id === viewDoc.partyId)?.name ?? "—"}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">ثبت‌کننده</span><b>{viewDoc.createdBy}</b><span className="block text-[10.5px] text-ink-3">{faDateTime(viewDoc.createdAt)}</span></div>
            {viewDoc.note && <div className="col-span-2 bg-paper rounded-lg p-3">{viewDoc.note}</div>}
          </div>
          {viewDoc.image
            ? <img src={viewDoc.image} alt="رسید" className="w-full rounded-lg border border-line" />
            : <p className="text-center text-[12px] text-ink-3 py-4 border border-dashed border-line-2 rounded-lg">تصویری پیوست نشده است.</p>}
        </Modal>
      )}
    </div>
  );
}
