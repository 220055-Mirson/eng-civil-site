require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const cors    = require('cors');
const fs      = require('fs');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
    origin:         '*',
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ── MIDDLEWARES ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ── MULTER ────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename:    (_req, file,  cb) => {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, suffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── HELPER: resposta de erro padronizada ──────────────────────
function erro(res, code, msg) {
    return res.status(code).json({ error: msg });
}

// ── MIDDLEWARE DE AUTENTICAÇÃO ────────────────────────────────
async function autenticar(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return erro(res, 401, 'Token não fornecido');
    const usuario = await db.verificarToken(token);
    if (!usuario) return erro(res, 401, 'Token inválido ou expirado');
    req.usuario = usuario;
    next();
}

// ── MIDDLEWARE ADMIN ──────────────────────────────────────────
function apenasAdmin(req, res, next) {
    if (req.usuario?.email !== 'admin@obravia.com' && req.usuario?.role !== 'admin') {
        return erro(res, 403, 'Acesso restrito ao administrador');
    }
    next();
}

// ── MIDDLEWARE ENGENHEIRO ─────────────────────────────────────
function apenasEngenheiro(req, res, next) {
    const rolesEng = ['senior', 'junior', 'empresa'];
    if (!rolesEng.includes(req.usuario?.tipo) && !rolesEng.includes(req.usuario?.role)) {
        return erro(res, 403, 'Acesso restrito a engenheiros');
    }
    next();
}

// ════════════════════════════════════════════
//  ROTAS GERAIS
// ════════════════════════════════════════════

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.get('/health', (_req, res) =>
    res.json({ status: 'ok', db: 'postgresql', timestamp: new Date().toISOString() })
);

// ════════════════════════════════════════════
//  CADASTRO
// ════════════════════════════════════════════

// Empresa
app.post('/api/cadastro/empresa',
    upload.fields([{ name: 'alvara', maxCount: 1 }, { name: 'nuit_comprovativo', maxCount: 1 }]),
    async (req, res) => {
        try {
            const { nome_empresa, email, senha, nuit, responsavel, bi } = req.body;
            if (!nome_empresa || !email || !senha || !nuit || !responsavel || !bi)
                return erro(res, 400, 'Todos os campos são obrigatórios');

            const alvara_path              = req.files?.alvara?.[0]?.path || '';
            const nuit_comprovativo_path   = req.files?.nuit_comprovativo?.[0]?.path || '';

            const id = await db.cadastrarEmpresa({
                nome_empresa, email, senha, nuit, responsavel, bi,
                alvara_path, nuit_comprovativo_path
            });
            res.json({ success: true, message: 'Empresa cadastrada! Aguarde verificação.', id });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }
);

// Engenheiro Sénior
app.post('/api/cadastro/senior',
    upload.fields([{ name: 'diploma', maxCount: 1 }]),
    async (req, res) => {
        try {
            const { nome, email, senha, numero_ordem, anos_experiencia, data_validade_ordem } = req.body;
            if (!nome || !email || !senha || !numero_ordem)
                return erro(res, 400, 'Nome, email, senha e número da ordem são obrigatórios');

            const diploma_path = req.files?.diploma?.[0]?.path || '';
            const id = await db.cadastrarSenior({ nome, email, senha, numero_ordem, diploma_path, anos_experiencia, data_validade_ordem });
            res.json({ success: true, message: 'Engenheiro Sénior cadastrado! Aguarde verificação.', id });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }
);

// Engenheiro Júnior
app.post('/api/cadastro/junior',
    upload.fields([{ name: 'diploma', maxCount: 1 }]),
    async (req, res) => {
        try {
            const { nome, email, senha, numero_ordem, especializacao, linkedin } = req.body;
            if (!nome || !email || !senha || !numero_ordem)
                return erro(res, 400, 'Nome, email, senha e número da ordem são obrigatórios');

            const diploma_path = req.files?.diploma?.[0]?.path || '';
            const id = await db.cadastrarJunior({ nome, email, senha, numero_ordem, diploma_path, especializacao, linkedin });
            res.json({ success: true, message: 'Engenheiro Júnior cadastrado!', id });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }
);

// ════════════════════════════════════════════
//  AUTENTICAÇÃO
// ════════════════════════════════════════════

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return erro(res, 400, 'Email e senha são obrigatórios');
    const result = await db.login(email, senha);
    if (!result.success) return erro(res, 401, result.error);
    res.json({ success: true, token: result.token, user: result.user });
});

app.post('/api/verificar-cadastro', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.json({ cadastrado: false });
    const user = await db.verificarCadastro(username);
    if (!user)    return res.json({ cadastrado: false });
    res.json({ cadastrado: true, tipo: user.tipo, status: user.status, id: user.id });
});

app.post('/api/verificar-token', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.json({ valido: false });
    const usuario = await db.verificarToken(token);
    if (!usuario) return res.json({ valido: false });
    res.json({ valido: true, usuario });
});

app.post('/api/logout', async (req, res) => {
    const { token } = req.body;
    if (token) await db.removerSessao(token);
    res.json({ success: true });
});

// ════════════════════════════════════════════
//  PROJECTOS  (legado — mantido intacto)
// ════════════════════════════════════════════

app.get('/api/projetos', async (_req, res) => {
    try { res.json(await db.listarTodosProjetos()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/projetos/:id', async (req, res) => {
    try {
        const p = await db.buscarProjetoPorId(req.params.id);
        if (!p) return erro(res, 404, 'Projeto não encontrado');
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/meus-projetos', autenticar, async (req, res) => {
    try { res.json(await db.listarProjetosPorUsuario(req.usuario.id)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projetos', autenticar, upload.array('fotos', 10), async (req, res) => {
    try {
        const { titulo, descricao, categoria, local, tags } = req.body;
        if (!titulo || !descricao) return erro(res, 400, 'Título e descrição são obrigatórios');

        const fotosPaths = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);
        const id = await db.criarProjeto({
            titulo, descricao,
            categoria: categoria || 'Outros',
            local: local || '', tags: tags || '',
            fotos: fotosPaths,
            foto_capa: fotosPaths[0] || '',
            usuario_id: req.usuario.id,
            engenheiro_nome: req.usuario.nome
        });
        res.json({ success: true, id });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.put('/api/projetos/:id', autenticar, async (req, res) => {
    try {
        const p = await db.buscarProjetoPorId(req.params.id);
        if (!p || p.usuario_id !== req.usuario.id)
            return erro(res, 403, 'Sem permissão para editar este projecto');
        await db.atualizarProjeto(req.params.id, req.body);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projetos/:id', autenticar, async (req, res) => {
    try {
        const p = await db.buscarProjetoPorId(req.params.id);
        if (!p || p.usuario_id !== req.usuario.id)
            return erro(res, 403, 'Sem permissão para eliminar este projecto');
        await db.excluirProjeto(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
//  PEDIDOS  (novo fluxo)
// ════════════════════════════════════════════

// Listar pedidos — público (engenheiros vêem sem login)
app.get('/api/pedidos', async (req, res) => {
    try {
        const { status, tipo, busca } = req.query;
        const pedidos = await db.listarPedidos({ status, tipo, busca });
        res.json(pedidos);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Ver pedido por ID
app.get('/api/pedidos/:id', async (req, res) => {
    try {
        const p = await db.buscarPedidoPorId(req.params.id);
        if (!p) return erro(res, 404, 'Pedido não encontrado');
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Meus pedidos (cliente autenticado)
app.get('/api/meus-pedidos', autenticar, async (req, res) => {
    try {
        const pedidos = await db.pedidosPorUsuario(req.usuario.id);
        res.json(pedidos);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Criar pedido — autenticado OU anónimo (campo nome_cliente obrigatório)
app.post('/api/pedidos', async (req, res) => {
    try {
        const {
            tipo, descricao, local,
            talhao, orcamento_min, orcamento_max,
            urgencia, nome_cliente, telefone,
            email_cliente, contacto_preferencia
        } = req.body;

        if (!tipo || !descricao || !local || !nome_cliente)
            return erro(res, 400, 'tipo, descricao, local e nome_cliente são obrigatórios');

        // Opcional: associar ao utilizador autenticado
        const token    = req.headers.authorization?.split(' ')[1];
        const usuario  = token ? await db.verificarToken(token) : null;

        const result = await db.criarPedido({
            tipo, descricao, local, talhao,
            orcamento_min, orcamento_max, urgencia,
            nome_cliente, telefone, email_cliente,
            contacto_preferencia,
            usuario_id: usuario?.id || null
        });

        res.status(201).json({ success: true, id: result.id, codigo: result.codigo });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Actualizar status do pedido (autenticado — admin ou dono)
app.patch('/api/pedidos/:id/status', autenticar, async (req, res) => {
    try {
        const { status } = req.body;
        const estadosValidos = ['aberto','propostas','negociacao','fechado','cancelado'];
        if (!estadosValidos.includes(status))
            return erro(res, 400, `Status inválido. Use: ${estadosValidos.join(', ')}`);

        const pedido = await db.buscarPedidoPorId(req.params.id);
        if (!pedido) return erro(res, 404, 'Pedido não encontrado');

        const isAdmin = req.usuario.email === 'admin@obravia.com' || req.usuario.role === 'admin';
        const isDono  = pedido.usuario_id === req.usuario.id;
        if (!isAdmin && !isDono) return erro(res, 403, 'Sem permissão');

        await db.atualizarStatusPedido(req.params.id, status);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Eliminar pedido (admin ou dono)
app.delete('/api/pedidos/:id', autenticar, async (req, res) => {
    try {
        const pedido  = await db.buscarPedidoPorId(req.params.id);
        if (!pedido)  return erro(res, 404, 'Pedido não encontrado');

        const isAdmin = req.usuario.email === 'admin@obravia.com' || req.usuario.role === 'admin';
        const isDono  = pedido.usuario_id === req.usuario.id;
        if (!isAdmin && !isDono) return erro(res, 403, 'Sem permissão');

        await db.eliminarPedido(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
//  PROPOSTAS  (novo fluxo)
// ════════════════════════════════════════════

// Listar propostas de um pedido (público — cliente compara)
app.get('/api/pedidos/:id/propostas', async (req, res) => {
    try {
        const propostas = await db.listarPropostasPorPedido(req.params.id);
        res.json(propostas);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Listar todas as propostas do engenheiro autenticado
app.get('/api/minhas-propostas', autenticar, async (req, res) => {
    try {
        const propostas = await db.listarPropostasPorEngenheiro(req.usuario.id);
        res.json(propostas);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Enviar proposta — engenheiro autenticado OU anónimo (com nome)
app.post('/api/propostas', async (req, res) => {
    try {
        const {
            pedido_id, engenheiro_nome,
            valor, prazo, descricao, disponibilidade
        } = req.body;

        if (!pedido_id || !descricao || !valor || !prazo)
            return erro(res, 400, 'pedido_id, valor, prazo e descricao são obrigatórios');

        // Engenheiro autenticado (opcional)
        const token       = req.headers.authorization?.split(' ')[1];
        const engenheiro  = token ? await db.verificarToken(token) : null;

        const id = await db.criarProposta({
            pedido_id,
            engenheiro_id:   engenheiro?.id   || null,
            engenheiro_nome: engenheiro?.nome || engenheiro_nome || 'Anónimo',
            valor, prazo, descricao, disponibilidade
        });

        res.status(201).json({ success: true, id });
    } catch (e) {
        console.error(e);
        // Proposta duplicada = 409 Conflict
        const code = e.message.includes('Já enviou') ? 409 : 500;
        res.status(code).json({ error: e.message });
    }
});

// Aceitar proposta (dono do pedido ou admin)
app.patch('/api/propostas/:id/aceitar', autenticar, async (req, res) => {
    try {
        await db.aceitarProposta(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Rejeitar proposta (dono do pedido ou admin)
app.patch('/api/propostas/:id/rejeitar', autenticar, async (req, res) => {
    try {
        await db.rejeitarProposta(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════

// Estatísticas
app.get('/api/admin/stats', autenticar, apenasAdmin, async (_req, res) => {
    try { res.json(await db.estatisticasAdmin()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Todos os utilizadores
app.get('/api/admin/usuarios', autenticar, apenasAdmin, async (_req, res) => {
    try { res.json(await db.listarUsuarios()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Utilizadores pendentes
app.get('/api/admin/usuarios/pendentes', autenticar, apenasAdmin, async (_req, res) => {
    try { res.json(await db.listarUsuariosPendentes()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Aprovar utilizador
app.put('/api/admin/usuarios/:id/aprovar', autenticar, apenasAdmin, async (req, res) => {
    try {
        await db.aprovarUsuario(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Rejeitar/eliminar utilizador
app.delete('/api/admin/usuarios/:id', autenticar, apenasAdmin, async (req, res) => {
    try {
        await db.rejeitarUsuario(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Todos os pedidos (admin)
app.get('/api/admin/pedidos', autenticar, apenasAdmin, async (req, res) => {
    try {
        const pedidos = await db.listarPedidos(req.query);
        res.json(pedidos);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Todas as propostas (admin)
app.get('/api/admin/propostas', autenticar, apenasAdmin, async (_req, res) => {
    try { res.json(await db.listarTodasPropostas()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Avançar status de pedido (admin)
app.patch('/api/admin/pedidos/:id/status', autenticar, apenasAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await db.atualizarStatusPedido(req.params.id, status);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Eliminar pedido (admin)
app.delete('/api/admin/pedidos/:id', autenticar, apenasAdmin, async (req, res) => {
    try {
        await db.eliminarPedido(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Fallback SPA ──────────────────────────────────────────────
app.use('*', (_req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Iniciar servidor ──────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OBRAVIA servidor em http://localhost:${PORT}`);
    console.log(`🗄️  Base de dados: PostgreSQL`);
    console.log(`📁  Uploads: ${uploadDir}`);
    console.log(`🌍  Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
});