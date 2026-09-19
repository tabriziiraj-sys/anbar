# Anbarino - Warehouse Management System

A simple warehouse and financial management system for small companies. Built with React, Node.js, and SQLite.

## Features

- 📦 Inventory management (stock in/out)
- 👥 Customer and supplier management
- 💰 Payment tracking
- 📊 Financial reports
- 🖨️ Professional invoice printing
- 📁 Excel export
- 🔒 User authentication with audit logs

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Build Tool**: Vite

## Deployment on Liara.ir

### Step 1: Download from GitHub

1. Click the green **Code** button
2. Select **Download ZIP**
3. Extract the ZIP file

### Step 2: Create ZIP for Liara

Select **only** these files and folders:

```
✅ package.json
✅ server.cjs
✅ database.cjs
✅ liara.json
✅ Procfile
✅ index.html
✅ vite.config.js
✅ tsconfig.json
✅ src/ (folder)
✅ db/ (folder)
```

**Do NOT include:**
- ❌ node_modules/
- ❌ dist/
- ❌ package-lock.json
- ❌ .git/

### Step 3: Upload to Liara

1. Go to [console.liara.ir](https://console.liara.ir)
2. Select your app (or create a new one)
3. Go to **Deployment** → **Upload ZIP**
4. Upload your ZIP file

### Step 4: Create Disk (Important!)

1. Go to **Disks** in the left menu
2. Click **Create Disk**
3. Settings:
   - **Name:** `database`
   - **Size:** `1 GB`
   - **Mount path:** `db`
4. Click **Create**

### Step 5: Verify

1. Go to **Logs**
2. You should see:
   ```
   Database initialized successfully
   Server started successfully
   ```
3. Access your app at: `https://your-app.liara.run`

## Default Users

- **Username:** `admin` | **Password:** `1234`
- **Username:** `sara` | **Password:** `1234`

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
