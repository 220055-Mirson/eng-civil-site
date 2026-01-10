require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const xss = require("xss");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const app = express();

/* =======================
   SEGURANÇA BÁSICA
======================= */

// Helmet (headers de segurança)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// CORS seguro
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin === allowedOrigin) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

/* =======================
   BANCO DE DADOS
======================= */
const DB_FILE = process.env.DB_FILE || "./data/database.db";
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log("📁 SQLite DB em uso:", DB_FILE);

const db = new sqlite3.Database(DB_FILE, err => {
  if (err) {
    console.error("❌ Erro ao conectar SQLite:", err.message);
    process.exit(1); // falha clara em produção
  }
  console.log("✅ SQLite conectado");
});
/* =======================
   MIDDLEWARE
======================= */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Sanitização simples de inputs
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "../public")));

/* =======================
   MULTER (UPLOADS SEGUROS)
======================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../public/uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) return cb(new Error("Formato de imagem não permitido"), false);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

/* =======================
   ROTAS API
======================= */

// --------- PROJETOS ---------
app.get("/api/projetos", (req, res) => {
  const sql = `
    SELECT p.id, p.title, p.description,
           GROUP_CONCAT(pi.imagem) AS imagens
    FROM projetos p
    LEFT JOIN projeto_imagens pi ON pi.project_id = p.id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro no servidor" });

    res.json(rows.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      images: p.imagens ? p.imagens.split(",") : []
    })));
  });
});

app.post("/api/projetos", upload.array("imagens", 10), (req, res) => {
  const { titulo, descricao } = req.body;
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Nenhuma imagem enviada" });

  db.run("INSERT INTO projetos (title, description) VALUES (?, ?)", [titulo, descricao], function(err) {
    if (err) return res.status(500).json({ error: "Erro no servidor" });

    const stmt = db.prepare("INSERT INTO projeto_imagens (project_id, imagem) VALUES (?, ?)");
    req.files.forEach(file => stmt.run(this.lastID, "/uploads/" + file.filename));
    stmt.finalize();

    res.json({ id: this.lastID });
  });
});

app.delete("/api/projetos/:id", (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run("DELETE FROM projeto_imagens WHERE project_id = ?", [id]);
    db.run("DELETE FROM projetos WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ error: "Erro ao apagar projeto" });
      if (this.changes === 0) return res.status(404).json({ error: "Projeto não encontrado" });
      res.json({ message: "Projeto apagado", id });
    });
  });
});

// --------- CONSTRUÇÕES ---------
app.get("/api/construcoes", (req, res) => {
  const sql = `
    SELECT c.id, c.title, c.description,
           GROUP_CONCAT(ci.imagem) AS imagens
    FROM construcoes c
    LEFT JOIN construcao_imagens ci ON ci.construcao_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro no servidor" });

    res.json(rows.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      images: c.imagens ? c.imagens.split(",") : []
    })));
  });
});

app.post("/api/construcoes", upload.array("imagens", 10), (req, res) => {
  const { titulo, descricao } = req.body;
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Nenhuma imagem enviada" });

  db.run("INSERT INTO construcoes (title, description) VALUES (?, ?)", [titulo, descricao], function(err) {
    if (err) return res.status(500).json({ error: "Erro no servidor" });

    const stmt = db.prepare("INSERT INTO construcao_imagens (construcao_id, imagem) VALUES (?, ?)");
    req.files.forEach(file => stmt.run(this.lastID, "/uploads/" + file.filename));
    stmt.finalize();

    res.json({ id: this.lastID });
  });
});

app.delete("/api/construcoes/:id", (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run("DELETE FROM construcao_imagens WHERE construcao_id = ?", [id]);
    db.run("DELETE FROM construcoes WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ error: "Erro ao apagar construção" });
      if (this.changes === 0) return res.status(404).json({ error: "Construção não encontrada" });
      res.json({ message: "Construção apagada", id });
    });
  });
});

/* =======================
   FRONTEND & FALLBACK
======================= */
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));

app.use((req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "API route not found" });
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Servidor rodando em http://localhost:${PORT}`));
