import { useMemo, useState } from "react";
import { useApp } from "../state";
import type { Params } from "../state";
import type { Party, Product } from "../lib/db";
import { faDate, faDateTime, faNum, money, partySum, stockOf, uid, downloadCSV, PARTY_TYPE_FA } from "../lib/db";
import { Btn, IconBtn, Badge, Field, Modal, PageHead, SearchBox, DataTable, EmptyState, ImageInput, Avatar, Toggle } from "../components/ui";
import type { Col } from "../components/ui";

/* ================= اطلاعات شرکت ================= */

export function CompanyPage() {
  const { db, saveCompany, toast } = useApp();
  const [f, setF] = useState({ ...db.company });
  const set = (k: keyof typeof f, v: string | null) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHead title="اطلاعات شرکت" desc="این اطلاعات در سربرگ چاپ اسناد و فاکتورها استفاده می‌شود."
        actions={<Btn icon="check" onClick={() => { saveCompany(f); toast("اطلاعات شرکت ذخیره شد."); }}>ذخیره اطلاعات</Btn>} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card border border-line rounded-xl p-6 anim-fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="نام شرکت" required className="sm:col-span-2">
              <input className="ctl" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="مثلاً بازرگانی آریا گستر" />
            </Field>
            <Field label="شماره تلفن"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="موبایل"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={f.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
            <Field label="کد اقتصادی"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={f.economicCode} onChange={(e) => set("economicCode", e.target.value)} /></Field>
            <Field label="شناسه ملی"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={f.nationalId} onChange={(e) => set("nationalId", e.target.value)} /></Field>
            <Field label="شماره ثبت"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={f.regNo} onChange={(e) => set("regNo", e.target.value)} /></Field>
            <Field label="آدرس" className="sm:col-span-2"><input className="ctl" value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="توضیحات" className="sm:col-span-2">
              <textarea className="ctl min-h-[70px]" value={f.note} onChange={(e) => set("note", e.target.value)} />
            </Field>
            <div className="sm:col-span-2"><ImageInput label="لوگوی شرکت (چاپ در سربرگ)" value={f.logo} onChange={(v) => set("logo", v)} /></div>
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-6 anim-fade-up h-fit" style={{ animationDelay: "80ms" }}>
          <h3 className="font-bold text-[13.5px] mb-3">پیش‌نمایش سربرگ چاپ</h3>
          <div className="border-2 border-pine-700 rounded-lg p-4 relative">
            <div className="border-b-2 border-pine-700 pb-3 mb-3 relative">
              <div className="border-b border-pine-700 absolute inset-x-0 bottom-[3px]" />
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-lg border border-line flex items-center justify-center overflow-hidden bg-paper shrink-0">
                  {f.logo ? <img src={f.logo} className="w-full h-full object-contain" alt="" /> : <span className="font-display text-pine-700 text-lg">{f.name.slice(0, 1) || "ش"}</span>}
                </span>
                <span>
                  <span className="block font-display text-[18px] text-pine-700 leading-6">{f.name || "نام شرکت"}</span>
                  <span className="block text-[10.5px] text-ink-3 leading-4">{f.address || "آدرس شرکت"}</span>
                </span>
              </div>
            </div>
            <p className="text-[10.5px] text-ink-2 leading-5">
              تلفن: {f.phone || "—"} {f.mobile ? `· همراه: ${f.mobile}` : ""}<br />
              کد اقتصادی: {f.economicCode || "—"} · شناسه ملی: {f.nationalId || "—"} · شماره ثبت: {f.regNo || "—"}
            </p>
          </div>
          <p className="text-[11px] text-ink-3 mt-3 leading-5">تمام اسناد ورود، خروج و گزارش‌ها با این سربرگ روی کاغذ A4 چاپ می‌شوند.</p>
        </div>
      </div>
    </div>
  );
}

/* ================= کاربران ================= */

export function UsersPage() {
  const { db, saveUser, toast, user: me, confirm } = useApp();
  const [form, setForm] = useState<null | { id?: string; fullName: string; username: string; password: string; active: boolean }>(null);
  const [q, setQ] = useState("");

  const rows = db.users.filter((u) => (u.fullName + u.username).includes(q));

  const cols: Col<typeof db.users[number]>[] = [
    {
      key: "name", label: "کاربر", sortable: true, sortVal: (u) => u.fullName,
      render: (u) => (
        <span className="flex items-center gap-3">
          <Avatar name={u.fullName} />
          <span>
            <span className="block font-bold text-[13px]">{u.fullName} {u.id === me?.id && <Badge tone="pine">شما</Badge>}</span>
            <span className="text-[11px] text-ink-3" dir="ltr">@{u.username}</span>
          </span>
        </span>
      ),
    },
    { key: "created", label: "تاریخ ایجاد", sortable: true, sortVal: (u) => u.createdAt, render: (u) => <span className="text-[12px] text-ink-2">{faDateTime(u.createdAt)}</span> },
    {
      key: "active", label: "وضعیت", sortable: true, sortVal: (u) => (u.active ? 1 : 0),
      render: (u) => u.active ? <Badge tone="moss">فعال</Badge> : <Badge tone="rose">غیرفعال</Badge>,
    },
    {
      key: "act", label: "عملیات", cls: "w-[110px]",
      render: (u) => (
        <span className="flex items-center gap-0.5">
          <IconBtn icon="pencil" title="ویرایش / تغییر رمز" onClick={() => setForm({ id: u.id, fullName: u.fullName, username: u.username, password: "", active: u.active })} />
          <IconBtn icon={u.active ? "x" : "check"} title={u.active ? "غیرفعال کردن" : "فعال کردن"} tone={u.active ? "rose" : "pine"}
            onClick={async () => {
              if (u.id === me?.id) { toast("کاربر جاری را نمی‌توان غیرفعال کرد.", "err"); return; }
              if (u.active) { const ok = await confirm(`کاربر «${u.fullName}» غیرفعال شود؟ دیگر نمی‌تواند وارد سیستم شود.`); if (!ok) return; }
              const err = saveUser({ id: u.id, fullName: u.fullName, username: u.username, active: !u.active });
              if (err) toast(err, "err"); else toast(u.active ? "کاربر غیرفعال شد." : "کاربر فعال شد.");
            }} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title="کاربران سیستم" desc="همه کاربران امکانات یکسانی دارند؛ نام ثبت‌کننده در تمام عملیات ذخیره می‌شود."
        actions={<Btn icon="plus" onClick={() => setForm({ fullName: "", username: "", password: "", active: true })}>افزودن کاربر</Btn>} />
      <div className="flex items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی نام یا نام کاربری..." />
      </div>
      <DataTable columns={cols} rows={rows} keyFor={(u) => u.id} empty={<EmptyState icon="users" title="کاربری یافت نشد" />} />

      {form && (
        <Modal title={form.id ? "ویرایش کاربر" : "افزودن کاربر"} icon="user" onClose={() => setForm(null)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setForm(null)}>انصراف</Btn>
              <Btn icon="check" onClick={() => {
                const err = saveUser({ id: form.id, fullName: form.fullName, username: form.username, password: form.password || undefined, active: form.active });
                if (err) { toast(err, "err"); return; }
                toast(form.id ? "کاربر ویرایش شد." : "کاربر جدید اضافه شد.");
                setForm(null);
              }}>{form.id ? "ذخیره تغییرات" : "ثبت کاربر"}</Btn>
            </>
          }>
          <div className="space-y-4">
            <Field label="نام و نام خانوادگی" required>
              <input className="ctl" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="نام کاربری" required hint="برای ورود به سیستم استفاده می‌شود.">
              <input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label={form.id ? "رمز عبور جدید (اختیاری)" : "رمز عبور"} required={!form.id}
              hint={form.id ? "برای تغییر رمز، مقدار جدید را وارد کنید؛ خالی یعنی بدون تغییر." : "حداقل ۴ کاراکتر"}>
              <input className="ctl" dir="ltr" style={{ textAlign: "left" }} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="حساب فعال است" desc="کاربر غیرفعال نمی‌تواند وارد سیستم شود." />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= طرف حساب‌ها ================= */

const emptyParty = (): Party => ({
  id: uid(), name: "", type: "customer", phone: "", mobile: "", address: "", nationalId: "", note: "",
  createdBy: "", createdAt: 0, updatedBy: "", updatedAt: 0,
});

export function PartiesPage({ params }: { params: Params }) {
  const { db, saveParty, deleteParty, toast, confirm, nav } = useApp();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>(params.type ?? "all");
  const [form, setForm] = useState<Party | null>(null);

  const rows = useMemo(() => db.parties
    .filter((p) => (type === "all" || p.type === type))
    .filter((p) => (p.name + p.phone + p.mobile + p.nationalId).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "fa")), [db, q, type]);

  const cols: Col<Party>[] = [
    {
      key: "name", label: "طرف حساب", sortable: true, sortVal: (p) => p.name,
      render: (p) => (
        <span className="flex items-center gap-3">
          <Avatar name={p.name} />
          <span className="min-w-0">
            <span className="block font-bold text-[13px] truncate">{p.name}</span>
            <span className="text-[11px] text-ink-3" dir="ltr">{p.mobile || p.phone || "—"}</span>
          </span>
        </span>
      ),
    },
    {
      key: "type", label: "نوع", sortable: true, sortVal: (p) => p.type,
      render: (p) => <Badge tone={p.type === "customer" ? "pine" : p.type === "supplier" ? "saffron" : "gray"}>{PARTY_TYPE_FA[p.type]}</Badge>,
    },
    {
      key: "bal", label: "مانده حساب", sortable: true, sortVal: (p) => partySum(db, p.id).balance,
      render: (p) => {
        const b = partySum(db, p.id).balance;
        return b > 0 ? <Badge tone="rose">بدهکار: {money(b)}</Badge>
          : b < 0 ? <Badge tone="moss">بستانکار: {money(-b)}</Badge>
          : <Badge tone="gray">تسویه</Badge>;
      },
    },
    { key: "addr", label: "آدرس", render: (p) => <span className="text-[11.5px] text-ink-2 block max-w-[220px] truncate">{p.address || "—"}</span> },
    {
      key: "act", label: "عملیات", cls: "w-[150px]",
      render: (p) => (
        <span className="flex items-center gap-0.5">
          <IconBtn icon="loop" title="گردش مالی حساب" tone="saffron" onClick={() => nav("ledger", { party: p.id })} />
          <IconBtn icon="pencil" title="ویرایش" onClick={() => setForm({ ...p })} />
          <IconBtn icon="trash" title="حذف" tone="rose" onClick={async () => {
            const ok = await confirm(`طرف حساب «${p.name}» حذف شود؟`);
            if (!ok) return;
            const err = deleteParty(p.id);
            if (err) toast(err, "err"); else toast("طرف حساب حذف شد.");
          }} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title="طرف حساب‌ها" desc="مشتریان، فروشندگان و سایر اشخاصی که با آنها حساب دارید."
        actions={
          <>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("parties", [["نام", "نوع", "تلفن", "موبایل", "شناسه/کدملی", "آدرس", "مانده"],
              ...rows.map((p) => [p.name, PARTY_TYPE_FA[p.type], p.phone, p.mobile, p.nationalId, p.address, partySum(db, p.id).balance])])
            }>خروجی Excel</Btn>
            <Btn icon="plus" onClick={() => setForm(emptyParty())}>ثبت طرف حساب</Btn>
          </>
        } />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی نام، تلفن، شناسه ملی..." />
        <div className="flex bg-card border border-line rounded-lg p-0.5">
          {([["all", "همه"], ["customer", "مشتری"], ["supplier", "فروشنده"], ["other", "سایر"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setType(k)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${type === k ? "bg-pine-600 text-white shadow-sm" : "text-ink-2 hover:text-pine-700"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <DataTable columns={cols} rows={rows} keyFor={(p) => p.id} empty={<EmptyState icon="card" title="طرف حسابی یافت نشد" desc="اولین طرف حساب را ثبت کنید." />} />

      {form && (
        <Modal title={db.parties.some((x) => x.id === form.id) ? "ویرایش طرف حساب" : "ثبت طرف حساب"} icon="card" onClose={() => setForm(null)} wide
          footer={
            <>
              <Btn variant="outline" onClick={() => setForm(null)}>انصراف</Btn>
              <Btn icon="check" onClick={() => {
                if (!form.name.trim()) { toast("نام طرف حساب الزامی است.", "err"); return; }
                saveParty(form); toast("طرف حساب ذخیره شد."); setForm(null);
              }}>ذخیره</Btn>
            </>
          }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="نام / نام شرکت" required className="sm:col-span-2">
              <input className="ctl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="نوع طرف حساب" required>
              <select className="ctl" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Party["type"] })}>
                <option value="customer">مشتری</option>
                <option value="supplier">فروشنده</option>
                <option value="other">سایر</option>
              </select>
            </Field>
            <Field label="شناسه ملی / کد ملی"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} /></Field>
            <Field label="شماره تماس"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="موبایل"><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
            <Field label="آدرس" className="sm:col-span-2"><input className="ctl" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="توضیحات" className="sm:col-span-2"><textarea className="ctl min-h-[64px]" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= کالاها ================= */

const emptyProduct = (catId: string): Product => ({
  id: uid(), code: "", name: "", categoryId: catId, unit: "عدد", image: null,
  minStock: 0, buyPrice: 0, sellPrice: 0, note: "",
  createdBy: "", createdAt: 0, updatedBy: "", updatedAt: 0,
});

export function ProductsPage() {
  const { db, saveProduct, deleteProduct, saveCategory, deleteCategory, toast, confirm, nav } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [form, setForm] = useState<Product | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [view, setView] = useState<Product | null>(null);

  const rows = useMemo(() => db.products
    .filter((p) => cat === "all" || p.categoryId === cat)
    .filter((p) => (p.name + p.code).includes(q))
    .map((p) => ({ p, stock: stockOf(db, p.id) }))
    .sort((a, b) => a.p.code.localeCompare(b.p.code)), [db, q, cat]);

  const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "—";

  const cols: Col<{ p: Product; stock: number }>[] = [
    {
      key: "p", label: "کالا", sortable: true, sortVal: (r) => r.p.name,
      render: ({ p }) => (
        <span className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg border border-line bg-paper overflow-hidden flex items-center justify-center shrink-0">
            {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="font-display text-pine-600">{p.name.slice(0, 1)}</span>}
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-[13px] truncate max-w-[230px]">{p.name}</span>
            <span className="text-[11px] text-ink-3" dir="ltr">{p.code}</span>
          </span>
        </span>
      ),
    },
    { key: "cat", label: "دسته‌بندی", sortable: true, sortVal: (r) => catName(r.p.categoryId), render: ({ p }) => <Badge tone="gray">{catName(p.categoryId)}</Badge> },
    { key: "unit", label: "واحد", render: ({ p }) => <span className="text-[12px]">{p.unit}</span> },
    {
      key: "stock", label: "موجودی فعلی", sortable: true, sortVal: (r) => r.stock,
      render: ({ p, stock }) => (
        <span className="flex items-center gap-2">
          <span className={`font-display text-[17px] num ${stock <= p.minStock ? "text-rose-500" : "text-night"}`}>{faNum(stock)}</span>
          <span className="text-[10.5px] text-ink-3">{p.unit}</span>
          {stock <= p.minStock && <Badge tone="rose">کمبود</Badge>}
        </span>
      ),
    },
    { key: "buy", label: "قیمت خرید", sortable: true, sortVal: (r) => r.p.buyPrice, render: ({ p }) => <span className="num text-[12px]">{money(p.buyPrice)}</span> },
    { key: "sell", label: "قیمت فروش", sortable: true, sortVal: (r) => r.p.sellPrice, render: ({ p }) => <span className="num text-[12px] font-bold">{money(p.sellPrice)}</span> },
    {
      key: "act", label: "عملیات", cls: "w-[150px]",
      render: ({ p }) => (
        <span className="flex items-center gap-0.5">
          <IconBtn icon="loop" title="گردش کالا" tone="saffron" onClick={() => nav("stock-turn", { product: p.id })} />
          <IconBtn icon="eye" title="جزئیات" onClick={() => setView(p)} />
          <IconBtn icon="pencil" title="ویرایش" onClick={() => setForm({ ...p })} />
          <IconBtn icon="trash" title="حذف" tone="rose" onClick={async () => {
            const ok = await confirm(`کالای «${p.name}» حذف شود؟`);
            if (!ok) return;
            const err = deleteProduct(p.id);
            if (err) toast(err, "err"); else toast("کالا حذف شد.");
          }} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHead title="کالاها" desc="معرفی کالاها، قیمت‌ها و حداقل موجودی برای هشدار کمبود."
        actions={
          <>
            <Btn variant="outline" icon="filter" onClick={() => setCatModal(true)}>دسته‌بندی‌ها</Btn>
            <Btn variant="outline" icon="download" onClick={() =>
              downloadCSV("products", [["کد", "نام", "دسته‌بندی", "واحد", "حداقل موجودی", "موجودی فعلی", "قیمت خرید", "قیمت فروش"],
              ...rows.map(({ p, stock }) => [p.code, p.name, catName(p.categoryId), p.unit, p.minStock, stock, p.buyPrice, p.sellPrice])])
            }>خروجی Excel</Btn>
            <Btn icon="plus" onClick={() => setForm(emptyProduct(db.categories[0]?.id ?? ""))}>ثبت کالا</Btn>
          </>
        } />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی نام یا کد کالا..." />
        <select className="ctl !w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">همه دسته‌ها</option>
          {db.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-[12px] text-ink-3 mr-auto">{faNum(rows.length)} کالا</span>
      </div>
      <DataTable columns={cols} rows={rows} keyFor={(r) => r.p.id} empty={<EmptyState title="کالایی یافت نشد" desc="اولین کالا را ثبت کنید تا انبار شکل بگیرد." />} />

      {/* فرم کالا */}
      {form && (
        <Modal title={db.products.some((x) => x.id === form.id) ? "ویرایش کالا" : "ثبت کالا"} icon="box" onClose={() => setForm(null)} wide
          footer={
            <>
              <Btn variant="outline" onClick={() => setForm(null)}>انصراف</Btn>
              <Btn icon="check" onClick={() => {
                const err = saveProduct({ ...form, minStock: +form.minStock || 0, buyPrice: +form.buyPrice || 0, sellPrice: +form.sellPrice || 0 });
                if (err) { toast(err, "err"); return; }
                toast("کالا ذخیره شد."); setForm(null);
              }}>ذخیره کالا</Btn>
            </>
          }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="کد کالا" required><input className="ctl" dir="ltr" style={{ textAlign: "left" }} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="K-1010" /></Field>
            <Field label="نام کالا" required><input className="ctl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="دسته‌بندی">
              <select className="ctl" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {db.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="واحد کالا"><input className="ctl" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="عدد، کیسه، کارتن..." /></Field>
            <Field label="حداقل موجودی" hint="کمتر از این مقدار، هشدار کمبود نمایش داده می‌شود.">
              <input className="ctl num" type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} />
            </Field>
            <Field label="قیمت خرید (ریال)"><input className="ctl num" type="number" min={0} value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: +e.target.value })} /></Field>
            <Field label="قیمت فروش (ریال)"><input className="ctl num" type="number" min={0} value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: +e.target.value })} /></Field>
            <Field label="توضیحات"><input className="ctl" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="sm:col-span-2"><ImageInput label="تصویر کالا" value={form.image} onChange={(v) => setForm({ ...form, image: v })} /></div>
          </div>
        </Modal>
      )}

      {/* مدیریت دسته‌ها */}
      {catModal && (
        <Modal title="دسته‌بندی کالاها" icon="filter" onClose={() => setCatModal(false)}>
          <div className="flex gap-2 mb-4">
            <input className="ctl" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="نام دسته‌بندی جدید..."
              onKeyDown={(e) => { if (e.key === "Enter" && newCat.trim()) { const err = saveCategory(newCat); if (err) toast(err, "err"); else { toast("دسته‌بندی اضافه شد."); setNewCat(""); } } }} />
            <Btn icon="plus" onClick={() => { if (!newCat.trim()) return; const err = saveCategory(newCat); if (err) toast(err, "err"); else { toast("دسته‌بندی اضافه شد."); setNewCat(""); } }}>افزودن</Btn>
          </div>
          <ul className="space-y-2">
            {db.categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between border border-line rounded-lg px-3 py-2.5">
                <span className="text-[13px] font-bold">{c.name} <span className="text-[11px] text-ink-3 font-normal">({faNum(db.products.filter((p) => p.categoryId === c.id).length)} کالا)</span></span>
                <span className="flex gap-0.5">
                  <IconBtn icon="pencil" title="تغییر نام" onClick={async () => {
                    const name = window.prompt("نام جدید دسته‌بندی:", c.name);
                    if (name && name.trim()) { const err = saveCategory(name, c.id); if (err) toast(err, "err"); else toast("نام دسته‌بندی تغییر کرد."); }
                  }} />
                  <IconBtn icon="trash" title="حذف" tone="rose" onClick={async () => {
                    const ok = await confirm(`دسته‌بندی «${c.name}» حذف شود؟`);
                    if (!ok) return;
                    const err = deleteCategory(c.id);
                    if (err) toast(err, "err"); else toast("حذف شد.");
                  }} />
                </span>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* جزئیات کالا */}
      {view && (
        <Modal title="جزئیات کالا" icon="box" onClose={() => setView(null)}
          footer={
            <>
              <Btn variant="outline" onClick={() => { nav("stock-turn", { product: view.id }); }}>گردش کالا</Btn>
              <Btn icon="pencil" onClick={() => { setForm({ ...view }); setView(null); }}>ویرایش</Btn>
            </>
          }>
          <div className="flex items-center gap-4 mb-4">
            <span className="w-16 h-16 rounded-xl border border-line bg-paper overflow-hidden flex items-center justify-center shrink-0">
              {view.image ? <img src={view.image} alt="" className="w-full h-full object-cover" /> : <span className="font-display text-2xl text-pine-600">{view.name.slice(0, 1)}</span>}
            </span>
            <span>
              <span className="block font-bold text-[15px]">{view.name}</span>
              <span className="text-[12px] text-ink-3" dir="ltr">{view.code}</span>
              <span className="block mt-1"><Badge tone="gray">{catName(view.categoryId)}</Badge></span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[11px] mb-1">موجودی فعلی</span><b className="font-display text-[20px] text-night num">{faNum(stockOf(db, view.id))} <span className="text-[11px] font-body">{view.unit}</span></b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[11px] mb-1">حداقل موجودی</span><b className="font-display text-[20px] text-night num">{faNum(view.minStock)}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[11px] mb-1">قیمت خرید</span><b className="num">{money(view.buyPrice)}</b></div>
            <div className="bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[11px] mb-1">قیمت فروش</span><b className="num">{money(view.sellPrice)}</b></div>
            <div className="col-span-2 bg-paper rounded-lg p-3"><span className="block text-ink-3 text-[11px] mb-1">ثبت‌کننده</span>{view.createdBy} — {faDateTime(view.createdAt)}<br />آخرین ویرایش: {view.updatedBy} — {faDateTime(view.updatedAt)}</div>
            {view.note && <div className="col-span-2 text-ink-2">{view.note}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
