const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.db");

console.log("📁 SQLite DB em uso:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao abrir BD:", err.message);
  } else {
    console.log("✅ SQLite conectado");

    // 🔥 CRIAR TABELAS AUTOMATICAMENTE
    db.serialize(() => {

      db.run(`
        CREATE TABLE IF NOT EXISTS projetos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS projeto_imagens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          imagem TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          user_name TEXT,
          text TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS construcoes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS construcao_imagens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          construcao_id INTEGER,
          imagem TEXT
        )
      `);

      console.log("✅ Tabelas garantidas");
    });
  }
});

module.exports = db;
