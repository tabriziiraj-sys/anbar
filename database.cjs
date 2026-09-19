const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// مسیر دیتابیس - در Liara از دیسک استفاده می‌شود
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db', 'anbarino.db');

// اطمینان از وجود پوشه db
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;
let SQL = null;
let initPromise = null;

// مقداردهی اولیه sql.js
async function initEngine() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    SQL = await initSqlJs();
    
    // اگر فایل دیتابیس وجود دارد، آن را بارگذاری کن
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('Database loaded from disk');
    } else {
      db = new SQL.Database();
      console.log('New database created');
    }
    
    // تنظیمات بهینه‌سازی
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');
  })();
  
  return initPromise;
}

// ذخیره دیتابیس روی دیسک
function saveToDisk() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// تبدیل پارامترها به فرمت sql.js
function normalizeParams(params) {
  if (!params || params.length === 0) return [];
  return params.map(p => {
    if (p === null || p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

// اجرای SQL (INSERT, UPDATE, DELETE)
async function run(sql, params = []) {
  await initEngine();
  const normalizedParams = normalizeParams(params);
  
  if (normalizedParams.length > 0) {
    db.run(sql, normalizedParams);
  } else {
    db.run(sql);
  }
  
  // گرفتن lastID و changes
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const changesResult = db.exec('SELECT changes() as c');
  const lastID = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 0;
  const changes = changesResult.length > 0 ? changesResult[0].values[0][0] : 0;
  
  saveToDisk();
  return { lastID, changes };
}

// گرفتن یک ردیف
async function get(sql, params = []) {
  await initEngine();
  const normalizedParams = normalizeParams(params);
  
  let stmt;
  if (normalizedParams.length > 0) {
    stmt = db.prepare(sql);
    stmt.bind(normalizedParams);
  } else {
    stmt = db.prepare(sql);
  }
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  
  stmt.free();
  return undefined;
}

// گرفتن همه ردیف‌ها
async function all(sql, params = []) {
  await initEngine();
  const normalizedParams = normalizeParams(params);
  
  const results = [];
  let stmt;
  
  if (normalizedParams.length > 0) {
    stmt = db.prepare(sql);
    stmt.bind(normalizedParams);
  } else {
    stmt = db.prepare(sql);
  }
  
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  
  stmt.free();
  return results;
}

// ساخت جداول
async function initDatabase() {
  await initEngine();
  console.log('Initializing database...');

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      logo TEXT,
      phone TEXT,
      mobile TEXT,
      address TEXT,
      economicCode TEXT,
      nationalId TEXT,
      regNo TEXT,
      note TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      phone TEXT,
      mobile TEXT,
      address TEXT,
      nationalId TEXT,
      note TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parentId TEXT,
      sortOrder INTEGER DEFAULT 0,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      categoryId TEXT,
      unit TEXT,
      buyPrice REAL DEFAULT 0,
      sellPrice REAL DEFAULT 0,
      stock REAL DEFAULT 0,
      minStock REAL DEFAULT 0,
      image TEXT,
      note TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      number TEXT UNIQUE,
      date INTEGER NOT NULL,
      partyId TEXT,
      partyName TEXT,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      note TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoiceId TEXT NOT NULL,
      productId TEXT,
      productName TEXT,
      productCode TEXT,
      quantity REAL NOT NULL,
      unitPrice REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      sortOrder INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoiceId TEXT,
      partyId TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT,
      referenceNo TEXT,
      date INTEGER NOT NULL,
      note TEXT,
      createdBy TEXT,
      createdAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT,
      amount REAL NOT NULL,
      date INTEGER NOT NULL,
      description TEXT,
      referenceNo TEXT,
      partyId TEXT,
      invoiceId TEXT,
      createdBy TEXT,
      createdAt INTEGER
    )
  `);

  // ایجاد کاربر پیش‌فرض ادمین
  const adminExists = await get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    await run(
      'INSERT INTO users (id, fullName, username, password, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin-001', 'مدیر سیستم', 'admin', 'admin123', 1, Date.now()]
    );
    console.log('Default admin user created (username: admin, password: admin123)');
  }

  console.log('Database initialized successfully');
}

module.exports = { run, get, all, initDatabase };
