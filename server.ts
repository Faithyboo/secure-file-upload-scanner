import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import Database from "better-sqlite3";
import session from "express-session";
import bcrypt from "bcryptjs";
import sanitize from "sanitize-filename";

// Session augmentation
declare module 'express-session' {
  interface SessionData {
    adminId: number;
  }
}

// SQLite Database Setup
const db = new Database("database.db");

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS scan_history (
    id TEXT PRIMARY KEY,
    original_filename TEXT,
    saved_filename TEXT,
    extension TEXT,
    file_size INTEGER,
    file_hash TEXT,
    status TEXT,
    reason TEXT,
    scan_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  );
`);

// Seed Admin (if not exists) - Default: admin / admin123
const adminExists = db.prepare("SELECT * FROM admin WHERE username = ?").get("admin");
if (!adminExists) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("admin123", salt);
  db.prepare("INSERT INTO admin (username, password_hash) VALUES (?, ?)").run("admin", hash);
}

// Storage setup
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/');
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Security Constants
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
const BLOCKED_EXTENSIONS = ['exe', 'bat', 'cmd', 'js', 'vbs', 'msi', 'sh', 'ps1'];
const SUSPICIOUS_KEYWORDS = ['virus', 'hack', 'crack', 'malware', 'exploit'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function calculateSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function scanFile(filename: string, fileSize: number): { status: 'SAFE' | 'WARNING' | 'BLOCKED', reason: string } {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { status: 'BLOCKED', reason: `Restricted extension detected: .${ext}` };
  }
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { status: 'WARNING', reason: `Unrecognized extension: .${ext}. Proceed with caution.` };
  }
  
  if ((filename.match(/\./g) || []).length > 1) {
    return { status: 'BLOCKED', reason: `Possible double extension detected: ${filename}` };
  }
  
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (filename.toLowerCase().includes(keyword)) {
      return { status: 'WARNING', reason: `Suspicious keyword detected in filename: '${keyword}'` };
    }
  }
  
  if (fileSize > MAX_FILE_SIZE) {
    return { status: 'WARNING', reason: `File size exceeds 10MB security limit.` };
  }

  return { status: 'SAFE', reason: "No immediate threats detected by static analysis." };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: 'security-scanner-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Unauthorized. Admin session required." });
    }
    next();
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM admin WHERE username = ?").get(username) as any;
    if (user && bcrypt.compareSync(password, user.password_hash)) {
      req.session.adminId = user.id;
      res.json({ success: true, message: "Logged in successfully" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ isAuthenticated: !!req.session.adminId });
  });

  app.get("/api/history", (req, res) => {
    const records = db.prepare("SELECT * FROM scan_history ORDER BY scan_date DESC").all();
    res.json(records);
  });

  app.get("/api/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SAFE' THEN 1 ELSE 0 END) as safe,
        SUM(CASE WHEN status = 'WARNING' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked
      FROM scan_history
    `).get() as any;

    const mostCommonExt = db.prepare(`
      SELECT extension, COUNT(*) as count 
      FROM scan_history 
      GROUP BY extension 
      ORDER BY count DESC 
      LIMIT 1
    `).get() as any;

    res.json({ ...stats, mostCommon: mostCommonExt?.extension || 'NONE' });
  });

  app.post("/api/scan", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, size, filename: savedName, path: filePath } = req.file;
    const sanitizedOriginal = sanitize(originalname);
    const hash = calculateSha256(filePath);
    const { status, reason } = scanFile(sanitizedOriginal, size);
    const ext = path.extname(sanitizedOriginal).toLowerCase().replace('.', '');

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO scan_history (id, original_filename, saved_filename, extension, file_size, file_hash, status, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, sanitizedOriginal, savedName, ext, size, hash, status, reason);

    const record = db.prepare("SELECT * FROM scan_history WHERE id = ?").get(id);
    res.json(record);
  });

  app.delete("/api/history/:id", requireAuth, (req, res) => {
    db.prepare("DELETE FROM scan_history WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/history", requireAuth, (req, res) => {
    db.prepare("DELETE FROM scan_history").run();
    res.json({ success: true });
  });

  app.get("/api/export", requireAuth, (req, res) => {
    const records = db.prepare("SELECT * FROM scan_history ORDER BY scan_date DESC").all() as any[];
    const csvRows = [
      ['ID', 'Original Name', 'Status', 'Hash', 'Size', 'Date'].join(','),
      ...records.map(r => [
        r.id,
        r.original_filename,
        r.status,
        r.file_hash,
        r.file_size,
        r.scan_date
      ].join(','))
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=scan_history.csv');
    res.send(csvRows.join('\n'));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
