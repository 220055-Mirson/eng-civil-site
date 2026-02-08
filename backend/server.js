const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const db = require("./db"); // ✅ ÚNICA conexão com SQLite

const app = express();
const helmet = require("helmet");

app.use(helmet());


// ---------------- MIDDLEWARE ---------------- //
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500, // 500 requests por IP
});

app.use(limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Erro interno do servidor"
      : err.message
  });
});


// ---------------- MULTER ---------------- //
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ---------------- ROTAS API ---------------- //



// Listar todos os projetos com imagens
app.get("/api/projetos", (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.title,
      p.description,
      GROUP_CONCAT(pi.imagem) AS imagens
    FROM projetos p
    LEFT JOIN projeto_imagens pi ON pi.project_id = p.id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao listar projetos:", err);
      return res.status(500).json({ error: "Erro no servidor" });
    }

    const projetos = rows.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      images: p.imagens ? p.imagens.split(",") : [],
    }));

    res.json(projetos);
  });
});

// Adicionar projeto com múltiplas imagens
app.post("/api/projetos", upload.array("imagens", 10), (req, res) => {
  const { titulo, descricao } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhuma imagem enviada" });
  }

  db.run(
    "INSERT INTO projetos (title, description) VALUES (?, ?)",
    [titulo, descricao],
    function (err) {
      if (err) {
        console.error("Erro ao inserir projeto:", err);
        return res.status(500).json({ error: "Erro no servidor" });
      }

      const projetoId = this.lastID;

      const stmt = db.prepare(
        "INSERT INTO projeto_imagens (project_id, imagem) VALUES (?, ?)"
      );

      req.files.forEach(file => {
        stmt.run(projetoId, "/uploads/" + file.filename);
      });

      stmt.finalize();

      res.json({
        id: projetoId,
        title: titulo,
        description: descricao,
      });
    }
  );
});

// Listar comentários
app.get("/api/comments/:projectId", (req, res) => {
  const { projectId } = req.params;

  db.all(
    "SELECT * FROM comments WHERE project_id = ? ORDER BY id ASC",
    [projectId],
    (err, rows) => {
      if (err) {
        console.error("Erro ao listar comentários:", err);
        return res.status(500).json({ error: "Erro no servidor" });
      }
      res.json(rows);
    }
  );
});

// Adicionar comentário
app.post("/api/comments/:projectId", (req, res) => {
  const { projectId } = req.params;
  const { user, text } = req.body;

  db.run(
    "INSERT INTO comments (project_id, user_name, text) VALUES (?, ?, ?)",
    [projectId, user, text],
    function (err) {
      if (err) {
        console.error("Erro ao adicionar comentário:", err);
        return res.status(500).json({ error: "Erro no servidor" });
      }

      res.json({
        id: this.lastID,
        project_id: projectId,
        user_name: user,
        text,
      });
    }
  );
});


//API POST para construcoes
app.post("/api/construcoes", upload.array("imagens", 10), (req, res) => {
  const { titulo, descricao } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhuma imagem enviada" });
  }

  db.run(
    "INSERT INTO construcoes (title, description) VALUES (?, ?)",
    [titulo, descricao],
    function (err) {
      if (err) {
        console.error("Erro ao inserir construção:", err);
        return res.status(500).json({ error: "Erro no servidor" });
      }

      const construcaoId = this.lastID;

      const stmt = db.prepare(
        "INSERT INTO construcao_imagens (construcao_id, imagem) VALUES (?, ?)"
      );

      req.files.forEach(file => {
        stmt.run(construcaoId, "/uploads/" + file.filename);
      });

      stmt.finalize();

      res.json({
        id: construcaoId,
        title: titulo,
        description: descricao
      });
    }
  );
});


//API GET para construcoes
// LISTAR CONSTRUÇÕES COM IMAGENS
app.get("/api/construcoes", (req, res) => {
  const sql = `
    SELECT 
      c.id,
      c.title,
      c.description,
      GROUP_CONCAT(ci.imagem) AS imagens
    FROM construcoes c
    LEFT JOIN construcao_imagens ci ON ci.construcao_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao listar construções:", err);
      return res.status(500).json({ error: "Erro no servidor" });
    }

    const construcoes = rows.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      images: c.imagens ? c.imagens.split(",") : []
    }));

    res.json(construcoes);
  });
});



// ---------------- SERVIR FRONTEND ---------------- //
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

app.get("/admin.html", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/admin.html"))
);

app.get("/detalhes.html", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/detalhes.html"))
);



// ---------------- ROTAS DELETE ---------------- //






app.delete("/api/projetos/:id", (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    // Apagar imagens do projeto
    db.run(
      "DELETE FROM projeto_imagens WHERE project_id = ?",
      [id],
      function (err) {
        if (err) {
          console.error("Erro ao apagar imagens:", err);
          return res.status(500).json({ error: "Erro ao apagar imagens" });
        }

        // Apagar projeto
        db.run(
          "DELETE FROM projetos WHERE id = ?",
          [id],
          function (err) {
            if (err) {
              console.error("Erro ao apagar projeto:", err);
              return res.status(500).json({ error: "Erro ao apagar projeto" });
            }

            // 👇 VERIFICA SE REALMENTE APAGOU
            if (this.changes === 0) {
              return res.status(404).json({ error: "Projeto não encontrado" });
            }

            res.json({
              message: "Projeto apagado definitivamente",
              deletedId: id,
            });
          }
        );
      }
    );
  });
});




// ---------------- DELETE CONSTRUÇÕES ---------------- //
app.delete("/api/construcoes/:id", (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run(
      "DELETE FROM construcao_imagens WHERE construcao_id = ?",
      [id],
      function (err) {
        if (err) {
          console.error("Erro ao apagar imagens da construção:", err);
          return res.status(500).json({ error: "Erro ao apagar imagens" });
        }

        db.run(
          "DELETE FROM construcoes WHERE id = ?",
          [id],
          function (err) {
            if (err) {
              console.error("Erro ao apagar construção:", err);
              return res.status(500).json({ error: "Erro ao apagar construção" });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: "Construção não encontrada" });
            }

            res.json({
              message: "Construção apagada com sucesso",
              deletedId: id,
            });
          }
        );
      }
    );
  });
});





// SPA fallback
app.use((req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);


// ---------------- RODAR SERVIDOR ---------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});