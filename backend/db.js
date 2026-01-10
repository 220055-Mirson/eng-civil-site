const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.db");

console.log("📁 SQLite DB em uso:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao abrir BD:", err.message);
  } else {
    console.log("✅ SQLite conectado");
  }
});

module.exports = db;
