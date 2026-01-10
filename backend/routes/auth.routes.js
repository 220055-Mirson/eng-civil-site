const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/login", async (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM usuarios WHERE nome = $1",
      [nome]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = result.rows[0];

    res.json({
      nome: user.nome,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

module.exports = router;
