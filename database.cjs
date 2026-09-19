const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// مسیر دیتابیس - در Liara از دیسک استفاده می‌شود
// در Liara مسیر نسبی نسبت به ریشه پروژه (/app) است
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db', 'anbarino.db');

// اطمینان از وجود پوشه db
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    // تنظیمات بهینه‌سازی
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// توابع سازگار با API قبلی (Promise-based)
function run(sql, params = []) {
  return Promise.resolve().then(() => {
    const result = getDb().prepare(sql).run(...params);
    return { lastID: result.lastInsertRowid, changes: result.changes };
  });
}

function get(sql, params = []) {
  return Promise.resolve().then(() => {
    return getDb().prepare(sql).get(...params);
  });
}

function all(sql, params = []) {
  return Promise.resolve().then(() => {
    return getDb().prepare(sql).all(...params);
  });
}

// ساخت جداول
async function initDatabase() {
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
