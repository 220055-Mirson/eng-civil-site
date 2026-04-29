const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Promisify functions
function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Inicializar banco de dados
async function inicializarBanco() {
    console.log('📦 Inicializando banco de dados...');
    
    // Criar tabela usuarios
    await runAsync(`
        CREATE TABLE IF NOT EXISTS usuarios (
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Criar tabela sessoes
    await runAsync(`
        CREATE TABLE IF NOT EXISTS sessoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            usuario_id INTEGER NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);
    
    // Criar tabela projetos
    await runAsync(`
        CREATE TABLE IF NOT EXISTS projetos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            categoria TEXT DEFAULT 'Outros',
            local TEXT,
            tags TEXT,
            fotos TEXT,
            foto_capa TEXT,
            usuario_id INTEGER NOT NULL,
            engenheiro_nome TEXT,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao DATETIME,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);
    
    console.log('✅ Banco de dados inicializado com sucesso!');
}

// ==================== USUÁRIOS ====================

async function cadastrarEmpresa(dados) {
    const { nome_empresa, email, senha, nuit, responsavel, bi, alvara_path, nuit_comprovativo_path } = dados;
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const result = await runAsync(
        `INSERT INTO usuarios (nome, email, senha, role, status, tipo, empresa_nome, nuit, responsavel, bi, alvara_path, nuit_comprovativo_path) 
         VALUES (?, ?, ?, 'empresa', 'pendente', 'empresa', ?, ?, ?, ?, ?, ?)`,
        [nome_empresa, email, senhaHash, nome_empresa, nuit, responsavel, bi, alvara_path, nuit_comprovativo_path]
    );
    return result.lastID;
}

async function cadastrarSenior(dados) {
    const { nome, email, senha, numero_ordem, diploma_path, anos_experiencia, data_validade_ordem } = dados;
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const result = await runAsync(
        `INSERT INTO usuarios (nome, email, senha, role, status, tipo, numero_ordem, diploma_path, anos_experiencia) 
         VALUES (?, ?, ?, 'senior', 'pendente', 'senior', ?, ?, ?)`,
        [nome, email, senhaHash, numero_ordem, diploma_path, anos_experiencia]
    );
    return result.lastID;
}

async function cadastrarJunior(dados) {
    const { nome, email, senha, numero_ordem, diploma_path, especializacao, linkedin } = dados;
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const result = await runAsync(
        `INSERT INTO usuarios (nome, email, senha, role, status, tipo, numero_ordem, diploma_path, especializacao, linkedin) 
         VALUES (?, ?, ?, 'junior', 'pendente', 'junior', ?, ?, ?, ?)`,
        [nome, email, senhaHash, numero_ordem, diploma_path, especializacao, linkedin]
    );
    return result.lastID;
}

async function buscarUsuarioPorEmail(email) {
    return await getAsync('SELECT * FROM usuarios WHERE email = ?', [email]);
}

async function buscarUsuarioPorId(id) {
    return await getAsync('SELECT * FROM usuarios WHERE id = ?', [id]);
}

async function verificarCadastro(email) {
    return await getAsync('SELECT id, nome, email, role, tipo, status FROM usuarios WHERE email = ?', [email]);
}

async function listarUsuarios() {
    try {
        return await allAsync('SELECT id, nome, email, role, tipo, status, created_at FROM usuarios ORDER BY id DESC');
    } catch (error) {
        return await allAsync('SELECT id, nome, email, role, tipo, status FROM usuarios ORDER BY id DESC');
    }
}

async function listarUsuariosPendentes() {
    try {
        return await allAsync("SELECT id, nome, email, tipo, status, created_at FROM usuarios WHERE status = 'pendente' ORDER BY created_at DESC");
    } catch (error) {
        return await allAsync("SELECT id, nome, email, tipo, status FROM usuarios WHERE status = 'pendente' ORDER BY id DESC");
    }
}

async function aprovarUsuario(id) {
    await runAsync("UPDATE usuarios SET status = 'aprovado' WHERE id = ?", [id]);
}

async function rejeitarUsuario(id) {
    await runAsync("DELETE FROM usuarios WHERE id = ?", [id]);
}

// ==================== SESSÕES ====================

async function criarSessao(usuarioId) {
    const token = crypto.randomBytes(64).toString('hex');
    await runAsync('INSERT INTO sessoes (token, usuario_id) VALUES (?, ?)', [token, usuarioId]);
    return token;
}

async function buscarSessao(token) {
    return await getAsync('SELECT * FROM sessoes WHERE token = ?', [token]);
}

async function removerSessao(token) {
    await runAsync('DELETE FROM sessoes WHERE token = ?', [token]);
}

// ==================== PROJETOS ====================

async function criarProjeto(dados) {
    const { titulo, descricao, categoria, local, tags, fotos, foto_capa, usuario_id, engenheiro_nome } = dados;
    
    const fotosJson = JSON.stringify(fotos || []);
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');
    
    const result = await runAsync(
        `INSERT INTO projetos (titulo, descricao, categoria, local, tags, fotos, foto_capa, usuario_id, engenheiro_nome) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descricao, categoria || 'Outros', local || '', tagsStr, fotosJson, foto_capa || '', usuario_id, engenheiro_nome || '']
    );
    return result.lastID;
}

async function listarProjetosPorUsuario(usuario_id) {
    return await allAsync('SELECT * FROM projetos WHERE usuario_id = ? ORDER BY data_criacao DESC', [usuario_id]);
}

async function listarTodosProjetos() {
    return await allAsync('SELECT * FROM projetos ORDER BY data_criacao DESC');
}

async function buscarProjetoPorId(id) {
    return await getAsync('SELECT * FROM projetos WHERE id = ?', [id]);
}

async function atualizarProjeto(id, dados) {
    const { titulo, descricao, categoria, local, tags } = dados;
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');
    
    await runAsync(
        `UPDATE projetos SET titulo = ?, descricao = ?, categoria = ?, local = ?, tags = ?, data_atualizacao = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [titulo, descricao, categoria, local, tagsStr, id]
    );
}

async function excluirProjeto(id) {
    await runAsync('DELETE FROM projetos WHERE id = ?', [id]);
}

// ==================== AUTENTICAÇÃO ====================

async function login(email, senha) {
    const user = await buscarUsuarioPorEmail(email);
    
    if (!user) {
        return { success: false, error: 'Usuário não encontrado' };
    }
    
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
        return { success: false, error: 'Senha incorreta' };
    }
    
    if (user.status !== 'aprovado') {
        return { success: false, error: 'Aguardando aprovação do administrador' };
    }
    
    const token = await criarSessao(user.id);
    
    return {
        success: true,
        token: token,
        user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role,
            tipo: user.tipo,
            status: user.status
        }
    };
}

async function verificarToken(token) {
    const sessao = await getAsync(
        `SELECT s.token, s.usuario_id, u.id, u.nome, u.email, u.role, u.tipo, u.status 
         FROM sessoes s 
         JOIN usuarios u ON s.usuario_id = u.id 
         WHERE s.token = ?`,
        [token]
    );
    
    if (!sessao) return null;
    
    return {
        id: sessao.usuario_id,
        nome: sessao.nome,
        email: sessao.email,
        role: sessao.role,
        tipo: sessao.tipo,
        status: sessao.status
    };
}

// ==================== EXPORTS ====================
module.exports = {
    // Database
    db,
    
    // Usuários
    cadastrarEmpresa,
    cadastrarSenior,
    cadastrarJunior,
    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    verificarCadastro,
    listarUsuarios,
    listarUsuariosPendentes,
    aprovarUsuario,
    rejeitarUsuario,
    
    // Sessões
    criarSessao,
    buscarSessao,
    removerSessao,
    
    // Projetos
    criarProjeto,
    listarProjetosPorUsuario,
    listarTodosProjetos,
    buscarProjetoPorId,
    atualizarProjeto,
    excluirProjeto,
    
    // Autenticação
    login,
    verificarToken,
    
    // Init
    inicializarBanco
};

// Inicializar banco ao carregar
inicializarBanco().catch(console.error);