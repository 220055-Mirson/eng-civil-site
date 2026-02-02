const express = require("express");
const router = express.Router();
const db = require("../db");

// Listar comentários de um projeto
router.get("/:projetoId", async (req, res) => {
  const { projetoId } = req.params;

  const result = await db.query(
    "SELECT * FROM comentarios WHERE projeto_id = $1 ORDER BY criado_em DESC",
    [projetoId]
  );

  res.json(result.rows);
});

// Criar comentário
router.post("/", async (req, res) => {
  const { projeto_id, usuario, texto } = req.body;

  const result = await db.query(
    "INSERT INTO comentarios (projeto_id, usuario, texto) VALUES ($1,$2,$3) RETURNING *",
    [projeto_id, usuario, texto]
  );

  res.json(result.rows[0]);
});

module.exports = router;
