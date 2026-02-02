const db = require("../db");

exports.listar = async (req, res) => {
  const result = await db.query("SELECT * FROM projects ORDER BY id DESC");
  res.json(result.rows);
};

exports.criar = async (req, res) => {
  const { titulo, descricao } = req.body;
  await db.query(
    "INSERT INTO projects (titulo, descricao) VALUES ($1, $2)",
    [titulo, descricao]
  );
  res.json({ message: "Projeto criado com sucesso" });
};
