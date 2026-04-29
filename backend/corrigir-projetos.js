const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

function corrigir() {
    console.log('🔧 Corrigindo tabela projetos...');
    
    // Adicionar colunas que faltam
    const colunas = [
        "ALTER TABLE projetos ADD COLUMN data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE projetos ADD COLUMN data_atualizacao DATETIME",
        "ALTER TABLE projetos ADD COLUMN local TEXT",
        "ALTER TABLE projetos ADD COLUMN tags TEXT",
        "ALTER TABLE projetos ADD COLUMN fotos TEXT",
        "ALTER TABLE projetos ADD COLUMN foto_capa TEXT",
        "ALTER TABLE projetos ADD COLUMN engenheiro_nome TEXT"
    ];
    
    let index = 0;
    
    function adicionarProxima() {
        if (index >= colunas.length) {
            console.log('✅ Todas as colunas foram adicionadas!');
            verificar();
            return;
        }
        
        db.run(colunas[index], (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.log(`⚠️ ${err.message}`);
            } else if (!err) {
                console.log(`✅ Coluna adicionada: ${colunas[index].split('ADD COLUMN')[1].trim()}`);
            }
            index++;
            adicionarProxima();
        });
    }
    
    function verificar() {
        db.all("PRAGMA table_info(projetos)", [], (err, cols) => {
            if (cols) {
                console.log('\n📋 Colunas da tabela projetos:');
                cols.forEach(col => {
                    console.log(`   - ${col.name} (${col.type})`);
                });
            }
            db.close();
            console.log('\n✅ Correção concluída! Reinicie o servidor.');
        });
    }
    
    adicionarProxima();
}

corrigir();