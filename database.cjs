const sqlite3 = require('sqlite3').verbose();
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
    db = new sqlite3.Database(DB_PATH);
  }
  return db;
}

// تبدیل callback به Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
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
      name TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      categoryId TEXT,
      unit TEXT,
      image TEXT,
      minStock INTEGER DEFAULT 0,
      buyPrice REAL DEFAULT 0,
      sellPrice REAL DEFAULT 0,
      note TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS stock_docs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      no INTEGER NOT NULL,
      date TEXT NOT NULL,
      partyId TEXT,
      note TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS stock_doc_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      docId TEXT NOT NULL,
      productId TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (docId) REFERENCES stock_docs(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      misc INTEGER DEFAULT 0,
      no INTEGER NOT NULL,
      date TEXT NOT NULL,
      partyId TEXT,
      amount REAL NOT NULL,
      method TEXT,
      refNo TEXT,
      note TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      no INTEGER NOT NULL,
      date TEXT NOT NULL,
      partyId TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      image TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      no INTEGER NOT NULL,
      date TEXT NOT NULL,
      typeId TEXT NOT NULL,
      partyId TEXT,
      amount REAL NOT NULL,
      method TEXT,
      note TEXT,
      image TEXT,
      createdBy TEXT,
      createdAt INTEGER,
      updatedBy TEXT,
      updatedAt INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS expense_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      ref TEXT,
      at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      allowNegative INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'ریال',
      printShowLogo INTEGER DEFAULT 1,
      printShowSign INTEGER DEFAULT 1,
      printFooter TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS sequences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      inSeq INTEGER DEFAULT 1001,
      outSeq INTEGER DEFAULT 1001,
      paySeq INTEGER DEFAULT 2201,
      purchaseSeq INTEGER DEFAULT 501,
      expenseSeq INTEGER DEFAULT 801
    )
  `);

  // درج داده‌های اولیه اگر خالی هستند
  const userCount = await get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await seedDatabase();
  }

  console.log('Database initialized successfully');
}

// درج داده‌های نمونه
async function seedDatabase() {
  const now = Date.now();
  const daysAgo = (d) => now - d * 24 * 60 * 60 * 1000;

  // کاربران
  await run(
    'INSERT INTO users (id, fullName, username, password, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    ['u-admin', 'علی احمدی', 'admin', '1234', 1, daysAgo(90)]
  );
  await run(
    'INSERT INTO users (id, fullName, username, password, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    ['u-sara', 'سارا محمدی', 'sara', '1234', 1, daysAgo(80)]
  );

  // شرکت
  await run(
    'INSERT INTO company (id, name, phone, mobile, address, economicCode, nationalId, regNo, note) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['بازرگانی آریا گستر', '۰۲۱‑۴۴۵۵۶۶۷۷', '۰۹۱۲‑۱۲۳۴۵۶۷', 'تهران، خیابان آزادی', '۴۱۱۲۳۴۵۶۷۸۹۰', '۱۰۱۰۲۳۴۵۶۷۸', '۴۵۶۷۸', 'پخش عمده مواد غذایی']
  );

  // تنظیمات
  await run(
    'INSERT INTO settings (id, allowNegative, currency, printShowLogo, printShowSign, printFooter) VALUES (1, 0, ?, 1, 1, ?)',
    ['ریال', 'از همکاری شما سپاسگزاریم']
  );

  // دنباله‌ها
  await run(
    'INSERT INTO sequences (id, inSeq, outSeq, paySeq, purchaseSeq, expenseSeq) VALUES (1, 1001, 1001, 2201, 501, 801)'
  );

  console.log('Seed data inserted');
}

// بستن دیتابیس
function closeDb() {
  if (db) {
    db.close();
  }
}

module.exports = {
  initDatabase,
  run,
  get,
  all,
  closeDb,
  getDb
};
