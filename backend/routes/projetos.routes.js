const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");

// Config upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Listar projetos
router.get("/", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM projetos ORDER BY criado_em DESC"
  );
  res.json(result.rows);
});

// Criar projeto (admin)
router.post("/", upload.single("imagem"), async (req, res) => {
  const { titulo, descricao } = req.body;
  const imagem = req.file?.filename;

  const result = await db.query(
    "INSERT INTO projetos (titulo, descricao, imagem_principal) VALUES ($1,$2,$3) RETURNING *",
    [titulo, descricao, imagem]
  );

  res.json(result.rows[0]);
});

module.exports = router;
