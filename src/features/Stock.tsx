import { useEffect, useMemo, useState } from "react";
import { useApp } from "../state";
import type { Params } from "../state";
import type { DocKind, StockDoc, StockItem } from "../lib/db";
import { docTotal, faDate, faDateTime, faNum, money, noLabel, stockOf, todayISO, uid, downloadCSV } from "../lib/db";
import { Btn, IconBtn, Badge, Field, Modal, PageHead, SearchBox, DataTable, EmptyState } from "../components/ui";
import type { Col } from "../components/ui";

interface Draft {
  id: string;
  kind: DocKind;
  no: number;
  date: string;
  partyId: string;
  note: string;
  items: StockItem[];
}

export default function StockDocsPage({ kind, params }: { kind: DocKind; params: Params }) {
  const { db, saveStockDoc, deleteStockDoc, toast, confirm, print } = useApp();
  const isIn = kind === "in";
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState<Draft | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const newDraft = (): Draft => ({
    id: uid(), kind, no: db.seq[kind], date: todayISO(), partyId: "", note: "",
    items: [{ productId: "", qty: 1, price: 0 }],
  });

  useEffect(() => {
    if (params.new) setForm(newDraft());
    if (params.view) setViewId(params.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const rows = useMemo(() => db.stockDocs
    .filter((d) => d.kind === kind)
    .filter((d) => !from || d.date >= from)
    .filter((d) => !to || d.date <= to)
    .filter((d) => {
      if (!q) return true;
      const party = db.parties.find((p) => p.id === d.partyId)?.name ?? "";
      return (party + d.note + d.createdBy).includes(q) || String(d.no).includes(q.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))));
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [db, kind, q, from, to]);

  const totalFiltered = rows.reduce((s, d) => s + docTotal(d), 0);
  const view = viewId ? db.stockDocs.find((d) => d.id === viewId) : null;

  const cols: Col<StockDoc>[] = [
    {
      key: "no", label: "شماره سند", sortable: true, sortVal: (d) => d.no,
      render: (d) => (
        <span className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIn ? "bg-pine-50 text-pine-600" : "bg-saffron-100 text-saffron-700"}`}>
            <span className="font-display text-[13px]">{isIn ? "و" : "خ"}</span>
          </span>
          <b className="num text-[13px]">{noLabel(isIn ? "و" : "خ", d.no)}</b>
        </span>
      ),
    },
    { key: "date", label: "تاریخ", sortable: true, sortVal: (d) => d.date, render: (d) => <span className="text-[12.5px]">{faDate(d.date)}</span> },
    {
      key: "party", label: "طرف حساب", sortable: true, sortVal: (d) => db.parties.find((p) => p.id === d.partyId)?.name ?? "",
      render: (d) => <span className="font-bold text-[12.5px]">{db.parties.find((p) => p.id === d.partyId)?.name ?? <span className="text-ink-3 font-normal">بدون طرف حساب</span>}</span>,
    },
    { key: "cnt", label: "اقلام", render: (d) => <span className="text-[12px] text-ink-2">{faNum(d.items.length)} قلم</span> },
    {
      key: "total", label: "مبلغ کل", sortable: true, sortVal: (d) => docTotal(d),
      render: (d) => <b className={`num text-[13px] ${isIn ? "text-pine-600" : "text-saffron-700"}`}>{money(docTotal(d))} <span className="text-[10px] font-normal text-ink-3">{db.settings.currency}</span></b>,
    },
    {
      key: "by", label: "ثبت‌کننده / ویرایش", render: (d) => (
        <span className="text-[11.5px] text-ink-2 leading-5">
          <span className="block font-semibold">{d.createdBy} — {faDateTime(d.createdAt)}</span>
          {d.updatedAt !== d.createdAt && <span className="text-ink-3">ویرایش: {d.updatedBy} — {faDateTime(d.updatedAt)}</span>}
        </span>
      ),
    },
    {
      key: "act", label: "عملیات", cls: "w-[150px]",
      render: (d) => (
        <span className="flex items-center gap-0.5">
          <IconBtn icon="printer" title="چاپ سند" tone="saffron" onClick={() => print({ kind: "doc", docId: d.id })} />
          <IconBtn icon="eye" title="مشاهده" onClick={() => setViewId(d.id)} />
          <IconBtn icon="pencil" title="ویرایش" onClick={() => { setErr(null); setForm({ ...d, partyId: d.partyId ?? "", items: d.items.map((i) => ({ ...i })) }); }} />
          <IconBtn icon="trash" title="حذف" tone="rose" onClick={async () => {
            const ok = await confirm(`سند ${isIn ? "ورود" : "خروج"} ${noLabel(isIn ? "و" : "خ", d.no)} حذف شود؟ موجودی انبار به‌روزرسانی می‌شود.`);
            if (!ok) return;
            deleteStockDoc(d.id);
            toast("سند حذف شد.");
          }} />
        </span>
      ),
    },
  ];

  const setItem = (idx: number, patch: Partial<StockItem>) => {
    setForm((f) => f && ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));
  };

  const formTotal = form?.items.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0) ?? 0;

  const submit = () => {
    if (!form) return;
    const items = form.items.filter((i) => i.productId && i.qty > 0);
    if (!form.date) { setErr("تاریخ سند الزامی است."); return; }
    if (items.length === 0) { setErr("حداقل یک قلم کالا با تعداد بیشتر از صفر وارد کنید."); return; }
    const existing = db.stockDocs.find((d) => d.id === form.id);
    const payload: StockDoc = {
      id: form.id, kind, no: existing?.no ?? 0, date: form.date,
      partyId: form.partyId || null, note: form.note.trim(), items,
      createdBy: existing?.createdBy ?? "", createdAt: existing?.createdAt ?? 0,
      updatedBy: "", updatedAt: 0,
    };
    const e = saveStockDoc(payload);
    if (e) { setErr(e); toast(e, "err"); return; }
    toast(existing ? "سند ویرایش شد." : `سند ${isIn ? "ورود" : "خروج"} ${noLabel(isIn ? "و" : "خ", payload.no)} ثبت شد و موجودی به‌روزرسانی شد.`);
    setForm(null);
    setErr(null);
  };

  return (
    <div>
      <PageHead
        title={isIn ? "ورود کالا به انبار" : "خروج کالا از انبار"}
        desc={isIn ? "با ثبت سند ورود، موجودی انبار افزایش می‌یابد." : "با ثبت سند خروج، موجودی انبار کاهش می‌یابد و کمبود موجودی کنترل می‌شود."}
        actions={
          <>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV(isIn ? "stock-in" : "stock-out", [
                ["شماره", "تاریخ", "طرف حساب", "اقلام", "مبلغ کل", "ثبت‌کننده", "تاریخ ثبت"],
                ...rows.map((d) => [noLabel(isIn ? "و" : "خ", d.no), faDate(d.date), db.parties.find((p) => p.id === d.partyId)?.name ?? "", d.items.length, docTotal(d), d.createdBy, faDateTime(d.createdAt)]),
              ])}>خروجی Excel</Btn>
            <Btn icon="plus" onClick={() => { setErr(null); setForm(newDraft()); }}>
              ثبت سند {isIn ? "ورود" : "خروج"}
            </Btn>
          </>
        } />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی طرف حساب، توضیح، ثبت‌کننده..." />
        <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
          از <input type="date" className="ctl !w-auto !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
          تا <input type="date" className="ctl !w-auto !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        </span>
        {(from || to) && <Btn variant="ghost" size="sm" icon="x" onClick={() => { setFrom(""); setTo(""); }}>حذف فیلتر تاریخ</Btn>}
        <span className="mr-auto text-[12px] text-ink-3">
          {faNum(rows.length)} سند · جمع: <b className="num text-ink">{money(totalFiltered)}</b> {db.settings.currency}
        </span>
      </div>

      <DataTable columns={cols} rows={rows} keyFor={(d) => d.id}
        empty={<EmptyState icon={isIn ? "trayIn" : "trayOut"} title={`سند ${isIn ? "ورود" : "خروج"} ثبت نشده`} desc="اولین سند را ثبت کنید تا موجودی انبار شکل بگیرد." />} />

      {/* ---------- فرم سند ---------- */}
      {form && (
        <Modal title={db.stockDocs.some((d) => d.id === form.id) ? `ویرایش سند ${noLabel(isIn ? "و" : "خ", form.no)}` : `ثبت سند ${isIn ? "ورود" : "خروج"} — شماره ${noLabel(isIn ? "و" : "خ", form.no)}`}
          icon={isIn ? "trayIn" : "trayOut"} onClose={() => setForm(null)} wide
          footer={
            <>
              <Btn variant="outline" onClick={() => setForm(null)}>انصراف</Btn>
              <Btn icon="check" onClick={submit}>ثبت سند و به‌روزرسانی موجودی</Btn>
            </>
          }>
          {err && (
            <div className="flex items-start gap-2 bg-rose-100 text-rose-700 border border-rose-500/25 rounded-lg px-3.5 py-2.5 text-[12.5px] font-semibold mb-4 anim-pop">
              <span className="shrink-0 mt-0.5"><svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4m0 4h.01" /></svg></span>
              {err}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <Field label="تاریخ سند" required><input type="date" className="ctl" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="طرف حساب" hint="اختیاری — برای ردیابی حساب توصیه می‌شود.">
              <select className="ctl" value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
                <option value="">— بدون طرف حساب —</option>
                {db.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="توضیحات"><input className="ctl" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>

          <div className="border border-line rounded-xl overflow-hidden mb-3">
            <table className="tbl !min-w-0">
              <thead>
                <tr>
                  <th>کالا</th>
                  <th className="!w-[90px]">تعداد</th>
                  <th className="!w-[150px]">قیمت واحد ({db.settings.currency})</th>
                  <th className="!w-[130px]">مبلغ کل</th>
                  {!isIn && <th className="!w-[90px]">موجودی</th>}
                  <th className="!w-[46px]"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((it, idx) => {
                  const p = db.products.find((x) => x.id === it.productId);
                  const avail = it.productId ? stockOf(db, it.productId) : 0;
                  return (
                    <tr key={idx}>
                      <td>
                        <select className="ctl !py-1.5 !text-[12.5px]" value={it.productId}
                          onChange={(e) => {
                            const pid = e.target.value;
                            const prod = db.products.find((x) => x.id === pid);
                            setItem(idx, { productId: pid, price: prod ? (isIn ? prod.buyPrice : prod.sellPrice) : 0 });
                          }}>
                          <option value="">انتخاب کالا...</option>
                          {db.products.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" min={1} className="ctl !py-1.5 num" value={it.qty} onChange={(e) => setItem(idx, { qty: +e.target.value })} /></td>
                      <td><input type="number" min={0} className="ctl !py-1.5 num" value={it.price} onChange={(e) => setItem(idx, { price: +e.target.value })} /></td>
                      <td className="num font-bold text-[12.5px]">{money((it.qty || 0) * (it.price || 0))}</td>
                      {!isIn && (
                        <td>
                          {it.productId ? (
                            <span className={`num text-[12px] font-bold ${it.qty > avail ? "text-rose-500" : "text-ink-2"}`}>{faNum(avail)} {p?.unit}</span>
                          ) : <span className="text-ink-3">—</span>}
                        </td>
                      )}
                      <td>
                        <IconBtn icon="x" title="حذف ردیف" tone="rose" onClick={() => setForm((f) => f && { ...f, items: f.items.filter((_, i) => i !== idx) })} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Btn variant="soft" size="sm" icon="plus" onClick={() => setForm((f) => f && ({ ...f, items: [...f.items, { productId: "", qty: 1, price: 0 }] }))}>افزودن ردیف کالا</Btn>
            <span className="text-[13px] text-ink-2">
              جمع سند: <b className="font-display text-[20px] text-night num mx-1">{money(formTotal)}</b> {db.settings.currency}
            </span>
          </div>
        </Modal>
      )}

      {/* ---------- مشاهده سند ---------- */}
      {view && (
        <Modal title={`سند ${view.kind === "in" ? "ورود" : "خروج"} ${noLabel(view.kind === "in" ? "و" : "خ", view.no)}`} icon={view.kind === "in" ? "trayIn" : "trayOut"}
          onClose={() => setViewId(null)} wide
          footer={
            <>
              <Btn variant="outline" icon="printer" onClick={() => print({ kind: "doc", docId: view.id })}>چاپ سند</Btn>
              <Btn icon="pencil" onClick={() => { setErr(null); setForm({ ...view, partyId: view.partyId ?? "", items: view.items.map((i) => ({ ...i })) }); setViewId(null); }}>ویرایش</Btn>
            </>
          }>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-[12px]">
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">تاریخ سند</span><b>{faDate(view.date)}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">طرف حساب</span><b>{db.parties.find((p) => p.id === view.partyId)?.name ?? "—"}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">ثبت‌کننده</span><b>{view.createdBy}</b><span className="block text-[10.5px] text-ink-3">{faDateTime(view.createdAt)}</span></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[10.5px] mb-0.5">آخرین ویرایش</span><b>{view.updatedBy}</b><span className="block text-[10.5px] text-ink-3">{faDateTime(view.updatedAt)}</span></div>
          </div>
          <div className="border border-line rounded-xl overflow-hidden mb-4">
            <table className="tbl !min-w-0">
              <thead><tr><th>ردیف</th><th>کد</th><th>کالا</th><th>واحد</th><th>تعداد</th><th>قیمت واحد</th><th>مبلغ</th></tr></thead>
              <tbody>
                {view.items.map((it, i) => {
                  const p = db.products.find((x) => x.id === it.productId);
                  return (
                    <tr key={i}>
                      <td className="text-ink-3">{faNum(i + 1)}</td>
                      <td dir="ltr" className="text-[11.5px] text-ink-2">{p?.code}</td>
                      <td className="font-bold">{p?.name ?? "کالای حذف‌شده"}</td>
                      <td>{p?.unit}</td>
                      <td className="num font-bold">{faNum(it.qty)}</td>
                      <td className="num">{money(it.price)}</td>
                      <td className="num font-bold">{money(it.qty * it.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-ink-2">{view.note && <>یادداشت: {view.note}</>}</span>
            <span className="text-[13px]">جمع: <b className="font-display text-[22px] text-night num mx-1">{money(docTotal(view))}</b> {db.settings.currency}</span>
          </div>
          <div className="mt-3"><Badge tone={view.kind === "in" ? "pine" : "saffron"}>{view.kind === "in" ? "افزایش موجودی" : "کاهش موجودی"}</Badge></div>
        </Modal>
      )}
    </div>
  );
}
