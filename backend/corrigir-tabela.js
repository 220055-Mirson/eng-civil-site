const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

async function corrigirTabela() {
    console.log('🔧 Corrigindo estrutura da tabela usuarios...');
    
    // Buscar dados existentes
    const usuarios = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM usuarios', [], (err, rows) => {
            if (err) {
                if (err.message.includes('no such table')) {
                    resolve([]);
                } else {
                    reject(err);
                }
            } else {
                resolve(rows);
            }
        });
    });
    
    console.log(`📦 Salvos ${usuarios.length} usuários existentes`);
    
    // Dropar tabela se existir
    await new Promise((resolve) => {
        db.run('DROP TABLE IF EXISTS usuarios', (err) => {
            if (err) console.log('⚠️ Erro ao dropar:', err.message);
            resolve();
        });
    });
    
    // Recriar tabela sem restrição CHECK
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                role TEXT DEFAULT 'usuario',
                status TEXT DEFAULT 'pendente',
                telefone TEXT,
                tipo TEXT,
                numero_ordem TEXT,
                diploma_path TEXT,
                anos_experiencia TEXT,
                especializacao TEXT,
                linkedin TEXT,
                empresa_nome TEXT,
                nuit TEXT,
                responsavel TEXT,
                bi TEXT,
                alvara_path TEXT,
                nuit_comprovativo_path TEXT,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) reject(err);
            else {
                console.log('✅ Tabela recriada sem restrição');
                resolve();
            }
        });
    });
    
    // Recuperar dados antigos
    if (usuarios.length > 0) {
        for (const user of usuarios) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO usuarios (
                        id, nome, email, senha, role, status, telefone, tipo,
                        numero_ordem, diploma_path, anos_experiencia, especializacao,
                        linkedin, empresa_nome, nuit, responsavel, bi,
                        alvara_path, nuit_comprovativo_path, data_criacao
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user.id, user.nome, user.email, user.senha, user.role, user.status,
                        user.telefone, user.tipo, user.numero_ordem, user.diploma_path,
                        user.anos_experiencia, user.especializacao, user.linkedin,
                        user.empresa_nome, user.nuit, user.responsavel, user.bi,
                        user.alvara_path, user.nuit_comprovativo_path, user.data_criacao
                    ],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        console.log(`✅ Recuperados ${usuarios.length} usuários`);
    }
    
    // Verificar se admin existe
    const adminExistente = usuarios.find(u => u.email === 'admin@obravia.com');
    
    if (!adminExistente) {
        console.log('📝 Criando administrador...');
        const senhaHash = await bcrypt.hash('admin123', 10);
        
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO usuarios (nome, email, senha, role, status, tipo) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Administrador Master', 'admin@obravia.com', senhaHash, 'admin', 'aprovado', 'admin'],
                function(err) {
                    if (err) reject(err);
                    else {
                        console.log('✅ Administrador criado!');
                        console.log('📧 Email: admin@obravia.com');
                        console.log('🔑 Senha: admin123');
                        resolve();
                    }
                }
            );
        });
    } else {
        console.log('✅ Admin já existe');
        
        // Garantir que o admin está com role correta
        await new Promise((resolve) => {
            db.run(
                `UPDATE usuarios SET role = 'admin', status = 'aprovado', tipo = 'admin' WHERE email = 'admin@obravia.com'`,
                (err) => {
                    if (err) console.log('⚠️ Erro ao atualizar admin:', err.message);
                    else console.log('✅ Admin atualizado');
                    resolve();
                }
            );
        });
    }
    
    // Listar usuários finais
    db.all('SELECT id, nome, email, role, status, tipo FROM usuarios', [], (err, rows) => {
        if (rows) {
            console.log('\n📋 Usuários no banco:');
            rows.forEach(row => {
                console.log(`   - ${row.nome} | ${row.email} | Role: ${row.role} | Status: ${row.status} | Tipo: ${row.tipo || '-'}`);
            });
        }
        db.close();
        console.log('\n✅ Correção concluída!');
    });
}

corrigirTabela().catch(err => {
    console.error('❌ Erro:', err);
    db.close();
});