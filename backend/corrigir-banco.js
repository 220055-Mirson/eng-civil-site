const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

async function corrigirBanco() {
    // Adicionar colunas que faltam
    const alteracoes = [
        'ALTER TABLE usuarios ADD COLUMN role TEXT DEFAULT "usuario"',
        'ALTER TABLE usuarios ADD COLUMN status TEXT DEFAULT "pendente"',
        'ALTER TABLE usuarios ADD COLUMN telefone TEXT',
        'ALTER TABLE usuarios ADD COLUMN tipo TEXT',
        'ALTER TABLE usuarios ADD COLUMN numero_ordem TEXT',
        'ALTER TABLE usuarios ADD COLUMN diploma_path TEXT',
        'ALTER TABLE usuarios ADD COLUMN anos_experiencia TEXT',
        'ALTER TABLE usuarios ADD COLUMN especializacao TEXT',
        'ALTER TABLE usuarios ADD COLUMN linkedin TEXT',
        'ALTER TABLE usuarios ADD COLUMN data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP'
    ];
    
    console.log('🔧 Corrigindo estrutura do banco de dados...');
    
    for (const sql of alteracoes) {
        db.run(sql, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.log(`⚠️ ${err.message}`);
            } else if (!err) {
                console.log(`✅ Executado: ${sql.substring(0, 50)}...`);
            }
        });
    }
    
    // Verificar se admin existe
    db.get('SELECT * FROM usuarios WHERE email = ?', ['admin@obravia.com'], async (err, user) => {
        if (err) {
            console.error('Erro:', err);
        } else if (!user) {
            console.log('📝 Criando administrador...');
            const senhaHash = await bcrypt.hash('admin123', 10);
            
            db.run(
                `INSERT INTO usuarios (nome, email, senha, role, status, telefone) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Administrador Master', 'admin@obravia.com', senhaHash, 'admin', 'aprovado', '840000000'],
                function(err) {
                    if (err) {
                        console.error('❌ Erro ao criar admin:', err.message);
                    } else {
                        console.log('✅ Administrador criado!');
                        console.log('📧 Email: admin@obravia.com');
                        console.log('🔑 Senha: admin123');
                    }
                }
            );
        } else {
            console.log('✅ Administrador já existe!');
            console.log(`📧 Email: ${user.email}`);
            console.log(`👤 Role: ${user.role}`);
        }
    });
    
    setTimeout(() => {
        db.close();
        console.log('✅ Correção concluída!');
    }, 2000);
}

corrigirBanco();