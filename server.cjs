const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database.cjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== API Routes ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), storage: 'sqlite' });
});

// Full Sync - دریافت کل دیتابیس از سرور
app.get('/api/sync/full', async (req, res) => {
  console.log('[SYNC] GET /api/sync/full called');
  try {
    // جمع‌آوری تمام داده‌ها از SQLite
    const users = await db.all('SELECT * FROM users ORDER BY createdAt');
    const company = await db.get('SELECT * FROM company WHERE id = 1');
    const parties = await db.all('SELECT * FROM parties ORDER BY name');
    const categories = await db.all('SELECT * FROM product_categories ORDER BY name');
    const products = await db.all('SELECT * FROM products ORDER BY name');
    const stockDocs = await db.all('SELECT * FROM stock_docs ORDER BY date');
    const stockDocItems = await db.all('SELECT * FROM stock_doc_items');
    const payments = await db.all('SELECT * FROM payments ORDER BY date');
    const purchases = await db.all('SELECT * FROM purchases ORDER BY date');
    const expenses = await db.all('SELECT * FROM expenses ORDER BY date');
    const expenseTypes = await db.all('SELECT * FROM expense_types ORDER BY name');
    const auditLogs = await db.all('SELECT * FROM audit_logs ORDER BY at DESC LIMIT 800');
    const settings = await db.get('SELECT * FROM settings WHERE id = 1');
    
    // ساختار items برای هر stock doc
    const docsWithItems = stockDocs.map(doc => ({
      ...doc,
      items: stockDocItems.filter(item => item.docId === doc.id).map(item => ({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
      })),
    }));
    
    // محاسبه seq
    const maxIn = await db.get('SELECT MAX(no) as maxNo FROM stock_docs WHERE kind = "in"');
    const maxOut = await db.get('SELECT MAX(no) as maxNo FROM stock_docs WHERE kind = "out"');
    const maxPay = await db.get('SELECT MAX(no) as maxNo FROM payments');
    const maxPurchase = await db.get('SELECT MAX(no) as maxNo FROM purchases');
    const maxExpense = await db.get('SELECT MAX(no) as maxNo FROM expenses');
    
    const fullDb = {
      version: 1,
      seq: {
        in: (maxIn?.maxNo || 0) + 1,
        out: (maxOut?.maxNo || 0) + 1,
        pay: (maxPay?.maxNo || 0) + 1,
        purchase: (maxPurchase?.maxNo || 0) + 1,
        expense: (maxExpense?.maxNo || 0) + 1,
      },
      users: users.map(u => ({ ...u, active: !!u.active })),
      company: company || { name: '', logo: null, phone: '', mobile: '', address: '', economicCode: '', nationalId: '', regNo: '', note: '' },
      parties: parties.map(p => ({ ...p, type: p.type || 'other' })),
      categories,
      products: products.map(p => ({ ...p, image: p.image || null })),
      stockDocs: docsWithItems.map(d => ({ ...d, kind: d.kind, partyId: d.partyId || null })),
      payments: payments.map(p => ({ ...p, kind: p.kind, misc: !!p.misc, partyId: p.partyId || null, image: p.image || null })),
      purchases: purchases.map(p => ({ ...p, partyId: p.partyId || null, image: p.image || null })),
      expenses: expenses.map(e => ({ ...e, partyId: e.partyId || null, image: e.image || null })),
      expenseTypes,
      audit: auditLogs.map(a => ({ id: a.id, userId: a.userId, userName: a.userName, action: a.action, entity: a.entity, ref: a.ref, at: a.at })),
      settings: settings ? {
        allowNegative: !!settings.allowNegative,
        currency: settings.currency || 'ریال',
        print: {
          showLogo: !!settings.showLogo,
          showSign: !!settings.showSign,
          footer: settings.footer || '',
        },
      } : { allowNegative: false, currency: 'ریال', print: { showLogo: true, showSign: true, footer: '' } },
    };
    
    res.json(fullDb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full Sync - دریافت دیتابیس از کلاینت و ذخیره در SQLite
app.post('/api/sync/full', async (req, res) => {
  console.log('[SYNC] POST /api/sync/full called');
  try {
    const data = req.body;
    if (!data || data.version !== 1) {
      console.log('[SYNC] Invalid data format');
      return res.status(400).json({ error: 'Invalid data format' });
    }
    console.log('[SYNC] Data received, syncing to SQLite...');
    
    // ذخیره کاربران
    for (const u of (data.users || [])) {
      const existing = await db.get('SELECT id FROM users WHERE id = ?', [u.id]);
      if (existing) {
        await db.run('UPDATE users SET fullName=?, username=?, password=?, active=?, createdAt=? WHERE id=?',
          [u.fullName, u.username, u.password, u.active ? 1 : 0, u.createdAt, u.id]);
      } else {
        await db.run('INSERT INTO users (id, fullName, username, password, active, createdAt) VALUES (?,?,?,?,?,?)',
          [u.id, u.fullName, u.username, u.password, u.active ? 1 : 0, u.createdAt]);
      }
    }
    
    // ذخیره شرکت
    const company = data.company || {};
    const existingCompany = await db.get('SELECT id FROM company WHERE id = 1');
    if (existingCompany) {
      await db.run('UPDATE company SET name=?, logo=?, phone=?, mobile=?, address=?, economicCode=?, nationalId=?, regNo=?, note=? WHERE id=1',
        [company.name||'', company.logo||null, company.phone||'', company.mobile||'', company.address||'', company.economicCode||'', company.nationalId||'', company.regNo||'', company.note||'']);
    } else {
      await db.run('INSERT INTO company (id, name, logo, phone, mobile, address, economicCode, nationalId, regNo, note) VALUES (1,?,?,?,?,?,?,?,?,?)',
        [company.name||'', company.logo||null, company.phone||'', company.mobile||'', company.address||'', company.economicCode||'', company.nationalId||'', company.regNo||'', company.note||'']);
    }
    
    // ذخیره طرف حساب‌ها
    for (const p of (data.parties || [])) {
      const existing = await db.get('SELECT id FROM parties WHERE id = ?', [p.id]);
      if (existing) {
        await db.run('UPDATE parties SET name=?, type=?, phone=?, mobile=?, address=?, nationalId=?, note=?, createdBy=?, createdAt=?, updatedBy=?, updatedAt=? WHERE id=?',
          [p.name, p.type, p.phone||'', p.mobile||'', p.address||'', p.nationalId||'', p.note||'', p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0, p.id]);
      } else {
        await db.run('INSERT INTO parties (id, name, type, phone, mobile, address, nationalId, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          [p.id, p.name, p.type, p.phone||'', p.mobile||'', p.address||'', p.nationalId||'', p.note||'', p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0]);
      }
    }
    
    // ذخیره دسته‌بندی‌ها
    for (const c of (data.categories || [])) {
      const existing = await db.get('SELECT id FROM product_categories WHERE id = ?', [c.id]);
      if (existing) {
        await db.run('UPDATE product_categories SET name=? WHERE id=?', [c.name, c.id]);
      } else {
        await db.run('INSERT INTO product_categories (id, name) VALUES (?,?)', [c.id, c.name]);
      }
    }
    
    // ذخیره محصولات
    for (const p of (data.products || [])) {
      const existing = await db.get('SELECT id FROM products WHERE id = ?', [p.id]);
      if (existing) {
        await db.run('UPDATE products SET code=?, name=?, categoryId=?, unit=?, image=?, minStock=?, buyPrice=?, sellPrice=?, note=?, createdBy=?, createdAt=?, updatedBy=?, updatedAt=? WHERE id=?',
          [p.code, p.name, p.categoryId, p.unit, p.image||null, p.minStock||0, p.buyPrice||0, p.sellPrice||0, p.note||'', p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0, p.id]);
      } else {
        await db.run('INSERT INTO products (id, code, name, categoryId, unit, image, minStock, buyPrice, sellPrice, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [p.id, p.code, p.name, p.categoryId, p.unit, p.image||null, p.minStock||0, p.buyPrice||0, p.sellPrice||0, p.note||'', p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0]);
      }
    }
    
    // ذخیره اسناد انبار
    for (const d of (data.stockDocs || [])) {
      const existing = await db.get('SELECT id FROM stock_docs WHERE id = ?', [d.id]);
      if (existing) {
        await db.run('UPDATE stock_docs SET kind=?, no=?, date=?, partyId=?, note=?, createdBy=?, createdAt=?, updatedBy=?, updatedAt=? WHERE id=?',
          [d.kind, d.no, d.date, d.partyId||null, d.note||'', d.createdBy||'', d.createdAt||0, d.updatedBy||'', d.updatedAt||0, d.id]);
      } else {
        await db.run('INSERT INTO stock_docs (id, kind, no, date, partyId, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [d.id, d.kind, d.no, d.date, d.partyId||null, d.note||'', d.createdBy||'', d.createdAt||0, d.updatedBy||'', d.updatedAt||0]);
      }
      
      // حذف items قدیمی و درج جدید
      await db.run('DELETE FROM stock_doc_items WHERE docId = ?', [d.id]);
      for (const item of (d.items || [])) {
        const itemId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        await db.run('INSERT INTO stock_doc_items (id, docId, productId, qty, price) VALUES (?,?,?,?,?)',
          [itemId, d.id, item.productId, item.qty, item.price]);
      }
    }
    
    // ذخیره پرداخت‌ها
    for (const p of (data.payments || [])) {
      const existing = await db.get('SELECT id FROM payments WHERE id = ?', [p.id]);
      if (existing) {
        await db.run('UPDATE payments SET kind=?, misc=?, no=?, date=?, partyId=?, amount=?, method=?, refNo=?, note=?, createdBy=?, createdAt=?, updatedBy=?, updatedAt=? WHERE id=?',
          [p.kind, p.misc?1:0, p.no, p.date, p.partyId||null, p.amount||0, p.method||'', p.refNo||'', p.note||'', p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0, p.id]);
      } else {
        await db.run('INSERT INTO payments (id, kind, misc, no, date, partyId, amount, method, refNo, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [p.id, p.kind, p.misc?1:0, p.no, p.date, p.partyId||null, p.amount||0, p.method||'', p.refNo||'', p.note||'', p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0]);
      }
    }
    
    // ذخیره خریدها
    for (const p of (data.purchases || [])) {
      const existing = await db.get('SELECT id FROM purchases WHERE id = ?', [p.id]);
      if (existing) {
        await db.run('UPDATE purchases SET type=?, no=?, date=?, partyId=?, title=?, amount=?, note=?, image=?, createdBy=?, createdAt=?, updatedBy=?, updatedAt=? WHERE id=?',
          [p.type, p.no, p.date, p.partyId||null, p.title||'', p.amount||0, p.note||'', p.image||null, p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0, p.id]);
      } else {
        await db.run('INSERT INTO purchases (id, type, no, date, partyId, title, amount, note, image, createdBy, createdAt, updatedBy, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [p.id, p.type, p.no, p.date, p.partyId||null, p.title||'', p.amount||0, p.note||'', p.image||null, p.createdBy||'', p.createdAt||0, p.updatedBy||'', p.updatedAt||0]);
      }
    }
    
    // ذخیره هزینه‌ها
    for (const e of (data.expenses || [])) {
      const existing = await db.get('SELECT id FROM expenses WHERE id = ?', [e.id]);
      if (existing) {
        await db.run('UPDATE expenses SET no=?, date=?, typeId=?, partyId=?, amount=?, method=?, note=?, image=?, createdBy=?, createdAt=?, updatedBy=?, updatedAt=? WHERE id=?',
          [e.no, e.date, e.typeId, e.partyId||null, e.amount||0, e.method||'', e.note||'', e.image||null, e.createdBy||'', e.createdAt||0, e.updatedBy||'', e.updatedAt||0, e.id]);
      } else {
        await db.run('INSERT INTO expenses (id, no, date, typeId, partyId, amount, method, note, image, createdBy, createdAt, updatedBy, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [e.id, e.no, e.date, e.typeId, e.partyId||null, e.amount||0, e.method||'', e.note||'', e.image||null, e.createdBy||'', e.createdAt||0, e.updatedBy||'', e.updatedAt||0]);
      }
    }
    
    // ذخیره انواع هزینه
    for (const et of (data.expenseTypes || [])) {
      const existing = await db.get('SELECT id FROM expense_types WHERE id = ?', [et.id]);
      if (!existing) {
        await db.run('INSERT INTO expense_types (id, name) VALUES (?,?)', [et.id, et.name]);
      }
    }
    
    // ذخیره تنظیمات
    const settings = data.settings || {};
    const existingSettings = await db.get('SELECT id FROM settings WHERE id = 1');
    if (existingSettings) {
      await db.run('UPDATE settings SET allowNegative=?, currency=?, showLogo=?, showSign=?, footer=? WHERE id=1',
        [settings.allowNegative?1:0, settings.currency||'ریال', settings.print?.showLogo?1:0, settings.print?.showSign?1:0, settings.print?.footer||'']);
    } else {
      await db.run('INSERT INTO settings (id, allowNegative, currency, showLogo, showSign, footer) VALUES (1,?,?,?,?,?)',
        [settings.allowNegative?1:0, settings.currency||'ریال', settings.print?.showLogo?1:0, settings.print?.showSign?1:0, settings.print?.footer||'']);
    }
    
    // ذخیره لاگ‌های حسابرسی
    for (const a of (data.audit || []).slice(0, 100)) {
      const existing = await db.get('SELECT id FROM audit_logs WHERE id = ?', [a.id]);
      if (!existing) {
        await db.run('INSERT INTO audit_logs (id, userId, userName, action, entity, ref, at) VALUES (?,?,?,?,?,?,?)',
          [a.id, a.userId||'', a.userName||'', a.action||'', a.entity||'', a.ref||'', a.at||0]);
      }
    }
    
    console.log('[SYNC] ✓ Data synced to SQLite successfully');
    res.json({ success: true, message: 'Data synced to SQLite successfully' });
  } catch (err) {
    console.error('[SYNC] ✗ Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT * FROM users ORDER BY createdAt DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, fullName, username, password, active, createdAt } = req.body;
    await db.run(
      'INSERT INTO users (id, fullName, username, password, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, fullName, username, password, active ? 1 : 0, createdAt]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { fullName, username, password, active } = req.body;
    const updates = [];
    const values = [];
    
    if (fullName !== undefined) { updates.push('fullName = ?'); values.push(fullName); }
    if (username !== undefined) { updates.push('username = ?'); values.push(username); }
    if (password !== undefined) { updates.push('password = ?'); values.push(password); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }
    
    values.push(req.params.id);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Company
app.get('/api/company', async (req, res) => {
  try {
    const company = await db.get('SELECT * FROM company WHERE id = 1');
    res.json(company || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/company', async (req, res) => {
  try {
    const data = req.body;
    await db.run(
      'UPDATE company SET name=?, logo=?, phone=?, mobile=?, address=?, economicCode=?, nationalId=?, regNo=?, note=? WHERE id=1',
      [data.name, data.logo, data.phone, data.mobile, data.address, data.economicCode, data.nationalId, data.regNo, data.note]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parties
app.get('/api/parties', async (req, res) => {
  try {
    const parties = await db.all('SELECT * FROM parties ORDER BY name');
    res.json(parties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/parties', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'INSERT INTO parties (id, name, type, phone, mobile, address, nationalId, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.name, p.type, p.phone, p.mobile, p.address, p.nationalId, p.note, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/parties/:id', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'UPDATE parties SET name=?, type=?, phone=?, mobile=?, address=?, nationalId=?, note=?, updatedBy=?, updatedAt=? WHERE id=?',
      [p.name, p.type, p.phone, p.mobile, p.address, p.nationalId, p.note, p.updatedBy, p.updatedAt, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/parties/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM parties WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { id, name } = req.body;
    await db.run('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    await db.run('UPDATE categories SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.all('SELECT * FROM products ORDER BY code');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'INSERT INTO products (id, code, name, categoryId, unit, image, minStock, buyPrice, sellPrice, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.code, p.name, p.categoryId, p.unit, p.image, p.minStock, p.buyPrice, p.sellPrice, p.note, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'UPDATE products SET code=?, name=?, categoryId=?, unit=?, image=?, minStock=?, buyPrice=?, sellPrice=?, note=?, updatedBy=?, updatedAt=? WHERE id=?',
      [p.code, p.name, p.categoryId, p.unit, p.image, p.minStock, p.buyPrice, p.sellPrice, p.note, p.updatedBy, p.updatedAt, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Docs
app.get('/api/stock-docs', async (req, res) => {
  try {
    const docs = await db.all('SELECT * FROM stock_docs ORDER BY date DESC, createdAt DESC');
    const items = await db.all('SELECT * FROM stock_doc_items');
    
    // Group items by docId
    const itemsByDoc = {};
    items.forEach(item => {
      if (!itemsByDoc[item.docId]) itemsByDoc[item.docId] = [];
      itemsByDoc[item.docId].push({ productId: item.productId, qty: item.qty, price: item.price });
    });
    
    docs.forEach(doc => {
      doc.items = itemsByDoc[doc.id] || [];
    });
    
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-docs', async (req, res) => {
  try {
    const doc = req.body;
    await db.run(
      'INSERT INTO stock_docs (id, kind, no, date, partyId, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [doc.id, doc.kind, doc.no, doc.date, doc.partyId, doc.note, doc.createdBy, doc.createdAt, doc.updatedBy, doc.updatedAt]
    );
    
    // Insert items
    for (const item of doc.items) {
      await db.run(
        'INSERT INTO stock_doc_items (docId, productId, qty, price) VALUES (?, ?, ?, ?)',
        [doc.id, item.productId, item.qty, item.price]
      );
    }
    
    // Update sequence
    const seqField = doc.kind === 'in' ? 'inSeq' : 'outSeq';
    await db.run(`UPDATE sequences SET ${seqField} = ${seqField} + 1 WHERE id = 1`);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/stock-docs/:id', async (req, res) => {
  try {
    const doc = req.body;
    await db.run(
      'UPDATE stock_docs SET kind=?, no=?, date=?, partyId=?, note=?, updatedBy=?, updatedAt=? WHERE id=?',
      [doc.kind, doc.no, doc.date, doc.partyId, doc.note, doc.updatedBy, doc.updatedAt, req.params.id]
    );
    
    // Delete old items
    await db.run('DELETE FROM stock_doc_items WHERE docId = ?', [req.params.id]);
    
    // Insert new items
    for (const item of doc.items) {
      await db.run(
        'INSERT INTO stock_doc_items (docId, productId, qty, price) VALUES (?, ?, ?, ?)',
        [req.params.id, item.productId, item.qty, item.price]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stock-docs/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM stock_docs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payments
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await db.all('SELECT * FROM payments ORDER BY date DESC, createdAt DESC');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'INSERT INTO payments (id, kind, misc, no, date, partyId, amount, method, refNo, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.kind, p.misc ? 1 : 0, p.no, p.date, p.partyId, p.amount, p.method, p.refNo, p.note, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]
    );
    await db.run('UPDATE sequences SET paySeq = paySeq + 1 WHERE id = 1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'UPDATE payments SET kind=?, misc=?, no=?, date=?, partyId=?, amount=?, method=?, refNo=?, note=?, updatedBy=?, updatedAt=? WHERE id=?',
      [p.kind, p.misc ? 1 : 0, p.no, p.date, p.partyId, p.amount, p.method, p.refNo, p.note, p.updatedBy, p.updatedAt, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Purchases
app.get('/api/purchases', async (req, res) => {
  try {
    const purchases = await db.all('SELECT * FROM purchases ORDER BY date DESC, createdAt DESC');
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'INSERT INTO purchases (id, type, no, date, partyId, title, amount, note, image, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.type, p.no, p.date, p.partyId, p.title, p.amount, p.note, p.image, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]
    );
    await db.run('UPDATE sequences SET purchaseSeq = purchaseSeq + 1 WHERE id = 1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/purchases/:id', async (req, res) => {
  try {
    const p = req.body;
    await db.run(
      'UPDATE purchases SET type=?, no=?, date=?, partyId=?, title=?, amount=?, note=?, image=?, updatedBy=?, updatedAt=? WHERE id=?',
      [p.type, p.no, p.date, p.partyId, p.title, p.amount, p.note, p.image, p.updatedBy, p.updatedAt, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM purchases WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.all('SELECT * FROM expenses ORDER BY date DESC, createdAt DESC');
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const e = req.body;
    await db.run(
      'INSERT INTO expenses (id, no, date, typeId, partyId, amount, method, note, image, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [e.id, e.no, e.date, e.typeId, e.partyId, e.amount, e.method, e.note, e.image, e.createdBy, e.createdAt, e.updatedBy, e.updatedAt]
    );
    await db.run('UPDATE sequences SET expenseSeq = expenseSeq + 1 WHERE id = 1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const e = req.body;
    await db.run(
      'UPDATE expenses SET no=?, date=?, typeId=?, partyId=?, amount=?, method=?, note=?, image=?, updatedBy=?, updatedAt=? WHERE id=?',
      [e.no, e.date, e.typeId, e.partyId, e.amount, e.method, e.note, e.image, e.updatedBy, e.updatedAt, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expense Types
app.get('/api/expense-types', async (req, res) => {
  try {
    const types = await db.all('SELECT * FROM expense_types ORDER BY name');
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expense-types', async (req, res) => {
  try {
    const { id, name } = req.body;
    await db.run('INSERT INTO expense_types (id, name) VALUES (?, ?)', [id, name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY at DESC LIMIT 500');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const log = req.body;
    await db.run(
      'INSERT INTO audit_logs (id, userId, userName, action, entity, ref, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [log.id, log.userId, log.userName, log.action, log.entity, log.ref, log.at]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full Database Export/Import
app.get('/api/db/export', async (req, res) => {
  try {
    const data = {
      users: await db.all('SELECT * FROM users'),
      company: await db.get('SELECT * FROM company WHERE id = 1'),
      parties: await db.all('SELECT * FROM parties'),
      categories: await db.all('SELECT * FROM categories'),
      products: await db.all('SELECT * FROM products'),
      stockDocs: await db.all('SELECT * FROM stock_docs'),
      stockDocItems: await db.all('SELECT * FROM stock_doc_items'),
      payments: await db.all('SELECT * FROM payments'),
      purchases: await db.all('SELECT * FROM purchases'),
      expenses: await db.all('SELECT * FROM expenses'),
      expenseTypes: await db.all('SELECT * FROM expense_types'),
      auditLogs: await db.all('SELECT * FROM audit_logs'),
      settings: await db.get('SELECT * FROM settings WHERE id = 1'),
      sequences: await db.get('SELECT * FROM sequences WHERE id = 1'),
    };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/import', async (req, res) => {
  try {
    const data = req.body;
    
    // Clear existing data
    await db.run('DELETE FROM stock_doc_items');
    await db.run('DELETE FROM stock_docs');
    await db.run('DELETE FROM payments');
    await db.run('DELETE FROM purchases');
    await db.run('DELETE FROM expenses');
    await db.run('DELETE FROM products');
    await db.run('DELETE FROM categories');
    await db.run('DELETE FROM parties');
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM expense_types');
    await db.run('DELETE FROM audit_logs');
    
    // Import users
    for (const u of data.users || []) {
      await db.run('INSERT INTO users (id, fullName, username, password, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [u.id, u.fullName, u.username, u.password, u.active, u.createdAt]);
    }
    
    // Import company
    if (data.company) {
      await db.run('UPDATE company SET name=?, logo=?, phone=?, mobile=?, address=?, economicCode=?, nationalId=?, regNo=?, note=? WHERE id=1',
        [data.company.name, data.company.logo, data.company.phone, data.company.mobile, data.company.address, data.company.economicCode, data.company.nationalId, data.company.regNo, data.company.note]);
    }
    
    // Import parties
    for (const p of data.parties || []) {
      await db.run('INSERT INTO parties (id, name, type, phone, mobile, address, nationalId, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.name, p.type, p.phone, p.mobile, p.address, p.nationalId, p.note, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]);
    }
    
    // Import categories
    for (const c of data.categories || []) {
      await db.run('INSERT INTO categories (id, name) VALUES (?, ?)', [c.id, c.name]);
    }
    
    // Import products
    for (const p of data.products || []) {
      await db.run('INSERT INTO products (id, code, name, categoryId, unit, image, minStock, buyPrice, sellPrice, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.code, p.name, p.categoryId, p.unit, p.image, p.minStock, p.buyPrice, p.sellPrice, p.note, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]);
    }
    
    // Import stock docs
    for (const d of data.stockDocs || []) {
      await db.run('INSERT INTO stock_docs (id, kind, no, date, partyId, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.kind, d.no, d.date, d.partyId, d.note, d.createdBy, d.createdAt, d.updatedBy, d.updatedAt]);
    }
    
    // Import stock doc items
    for (const i of data.stockDocItems || []) {
      await db.run('INSERT INTO stock_doc_items (docId, productId, qty, price) VALUES (?, ?, ?, ?)',
        [i.docId, i.productId, i.qty, i.price]);
    }
    
    // Import payments
    for (const p of data.payments || []) {
      await db.run('INSERT INTO payments (id, kind, misc, no, date, partyId, amount, method, refNo, note, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.kind, p.misc, p.no, p.date, p.partyId, p.amount, p.method, p.refNo, p.note, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]);
    }
    
    // Import purchases
    for (const p of data.purchases || []) {
      await db.run('INSERT INTO purchases (id, type, no, date, partyId, title, amount, note, image, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.type, p.no, p.date, p.partyId, p.title, p.amount, p.note, p.image, p.createdBy, p.createdAt, p.updatedBy, p.updatedAt]);
    }
    
    // Import expenses
    for (const e of data.expenses || []) {
      await db.run('INSERT INTO expenses (id, no, date, typeId, partyId, amount, method, note, image, createdBy, createdAt, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [e.id, e.no, e.date, e.typeId, e.partyId, e.amount, e.method, e.note, e.image, e.createdBy, e.createdAt, e.updatedBy, e.updatedAt]);
    }
    
    // Import expense types
    for (const t of data.expenseTypes || []) {
      await db.run('INSERT INTO expense_types (id, name) VALUES (?, ?)', [t.id, t.name]);
    }
    
    // Import audit logs
    for (const l of data.auditLogs || []) {
      await db.run('INSERT INTO audit_logs (id, userId, userName, action, entity, ref, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [l.id, l.userId, l.userName, l.action, l.entity, l.ref, l.at]);
    }
    
    // Import settings
    if (data.settings) {
      await db.run('UPDATE settings SET allowNegative=?, currency=?, printShowLogo=?, printShowSign=?, printFooter=? WHERE id=1',
        [data.settings.allowNegative, data.settings.currency, data.settings.printShowLogo, data.settings.printShowSign, data.settings.printFooter]);
    }
    
    // Import sequences
    if (data.sequences) {
      await db.run('UPDATE sequences SET inSeq=?, outSeq=?, paySeq=?, purchaseSeq=?, expenseSeq=? WHERE id=1',
        [data.sequences.inSeq, data.sequences.outSeq, data.sequences.paySeq, data.sequences.purchaseSeq, data.sequences.expenseSeq]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.get('SELECT * FROM settings WHERE id = 1');
    const seq = await db.get('SELECT * FROM sequences WHERE id = 1');
    res.json({ settings: settings || {}, sequences: seq || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    await db.run(
      'UPDATE settings SET allowNegative=?, currency=?, printShowLogo=?, printShowSign=?, printFooter=? WHERE id=1',
      [s.allowNegative ? 1 : 0, s.currency, s.printShowLogo ? 1 : 0, s.printShowSign ? 1 : 0, s.printFooter]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Static Files ====================

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  let filePath = path.join(DIST_DIR, req.path === '/' ? 'index.html' : req.path);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.status(404).send('Not Found');
      } else {
        res.status(500).send('Server Error');
      }
      return;
    }

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content, 'utf-8');
  });
});

// ==================== Start Server ====================

async function start() {
  try {
    await db.initDatabase();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================================');
      console.log('       Anbarino - Warehouse Management System');
      console.log('========================================================');
      console.log('');
      console.log('  [OK] Server started successfully');
      console.log('  [OK] Port: ' + PORT);
      console.log('  [OK] Database: SQLite');
      console.log('  [OK] Storage: /app/db (Liara Disk)');
      console.log('');
      console.log('  Access URL:');
      console.log('     http://localhost:' + PORT);
      console.log('');
      console.log('  Test Users:');
      console.log('     admin / 1234');
      console.log('     sara / 1234');
      console.log('');
      console.log('========================================================');
      console.log('  Press Ctrl+C to stop the server');
      console.log('========================================================');
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.closeDb();
  process.exit(0);
});
