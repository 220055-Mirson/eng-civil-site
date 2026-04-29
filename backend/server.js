const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const db = require('./db');

const app = express();
const PORT = 3000;

// Rota raiz - redireciona para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Criar diretório de uploads se não existir
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware de autenticação
async function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const usuario = await db.verificarToken(token);
  if (!usuario) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  req.usuario = usuario;
  next();
}

// ────────────────────────────────────────────
// ROTAS DE CADASTRO
// ────────────────────────────────────────────

// Cadastro de Empresa
app.post('/api/cadastro/empresa', upload.fields([
  { name: 'alvara', maxCount: 1 },
  { name: 'nuit_comprovativo', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nome_empresa, email, senha, nuit, responsavel, bi } = req.body;
    
    if (!nome_empresa || !email || !senha || !nuit || !responsavel || !bi) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const alvara_path = req.files?.alvara?.[0]?.path || '';
    const nuit_comprovativo_path = req.files?.nuit_comprovativo?.[0]?.path || '';
    
    const usuarioId = await db.cadastrarEmpresa({
      nome_empresa, email, senha, nuit, responsavel, bi,
      alvara_path, nuit_comprovativo_path
    });
    
    res.json({ success: true, message: 'Empresa cadastrada com sucesso! Aguarde verificação.', id: usuarioId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Cadastro de Engenheiro Sénior
app.post('/api/cadastro/senior', upload.fields([
  { name: 'diploma', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nome, email, senha, numero_ordem, anos_experiencia, data_validade_ordem } = req.body;
    
    if (!nome || !email || !senha || !numero_ordem) {
      return res.status(400).json({ error: 'Nome, email, senha e número da ordem são obrigatórios' });
    }
    
    const diploma_path = req.files?.diploma?.[0]?.path || '';
    
    const usuarioId = await db.cadastrarSenior({
      nome, email, senha, numero_ordem, diploma_path, anos_experiencia, data_validade_ordem
    });
    
    res.json({ success: true, message: 'Engenheiro Sénior cadastrado! Aguarde verificação.', id: usuarioId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Cadastro de Engenheiro Júnior
app.post('/api/cadastro/junior', upload.fields([
  { name: 'diploma', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nome, email, senha, numero_ordem, especializacao, linkedin } = req.body;
    
    if (!nome || !email || !senha || !numero_ordem) {
      return res.status(400).json({ error: 'Nome, email, senha e número da ordem são obrigatórios' });
    }
    
    const diploma_path = req.files?.diploma?.[0]?.path || '';
    
    const usuarioId = await db.cadastrarJunior({
      nome, email, senha, numero_ordem, diploma_path, especializacao, linkedin
    });
    
    res.json({ success: true, message: 'Engenheiro Júnior cadastrado! Perfil será visível na secção Talentos em Crescimento.', id: usuarioId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ────────────────────────────────────────────
// ROTAS DE AUTENTICAÇÃO
// ────────────────────────────────────────────

// Login
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  const result = await db.login(email, senha);
  
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }
  
  res.json({
    success: true,
    token: result.token,
    user: result.user
  });
});

// Verificar se usuário está cadastrado (para mostrar botão Admin)
app.post('/api/verificar-cadastro', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.json({ cadastrado: false });
  }
  
  const user = await db.verificarCadastro(email);
  
  if (!user) {
    return res.json({ cadastrado: false });
  }
  
  res.json({
    cadastrado: true,
    tipo: user.tipo,
    status: user.status,
    id: user.id
  });
});

// Verificar token
app.post('/api/verificar-token', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.json({ valido: false });
  }
  
  const usuario = await db.verificarToken(token);
  
  if (!usuario) {
    return res.json({ valido: false });
  }
  
  res.json({
    valido: true,
    usuario
  });
});

// Logout
app.post('/api/logout', async (req, res) => {
  const { token } = req.body;
  
  if (token) {
    await db.removerSessao(token);
  }
  
  res.json({ success: true });
});

// ────────────────────────────────────────────
// ROTAS DE PROJETOS (requer autenticação)
// ────────────────────────────────────────────

// Listar meus projetos
app.get('/api/meus-projetos', autenticar, async (req, res) => {
  try {
    const projetos = await db.listarProjetosPorUsuario(req.usuario.id);
    res.json(projetos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar projeto
app.post('/api/projetos', autenticar, upload.array('fotos', 10), async (req, res) => {
  try {
    const { titulo, descricao, categoria, local, tags } = req.body;
    
    if (!titulo || !descricao) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }
    
    const fotosPaths = req.files ? req.files.map(f => f.path) : [];
    const fotoCapa = fotosPaths[0] || '';
    
    const projetoId = await db.criarProjeto({
      titulo,
      descricao,
      categoria: categoria || 'Outros',
      local: local || '',
      tags: tags || '',
      fotos: fotosPaths,
      foto_capa: fotoCapa,
      usuario_id: req.usuario.id,
      engenheiro_nome: req.usuario.nome
    });
    
    res.json({ success: true, id: projetoId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar projeto
app.put('/api/projetos/:id', autenticar, async (req, res) => {
  try {
    const { titulo, descricao, categoria, local, tags } = req.body;
    const projetoId = req.params.id;
    
    const projeto = await db.buscarProjetoPorId(projetoId);
    
    if (!projeto || projeto.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este projeto' });
    }
    
    await db.atualizarProjeto(projetoId, { titulo, descricao, categoria, local, tags });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir projeto
app.delete('/api/projetos/:id', autenticar, async (req, res) => {
  try {
    const projetoId = req.params.id;
    
    const projeto = await db.buscarProjetoPorId(projetoId);
    
    if (!projeto || projeto.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este projeto' });
    }
    
    await db.excluirProjeto(projetoId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Rota para verificar se é engenheiro/sênior
app.post('/api/verificar-engenheiro', async (req, res) => {
    const { email, password } = req.body;
    
    console.log(`Verificando engenheiro: ${email}`);
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email e senha são obrigatórios' 
        });
    }
    
    try {
        // Usar o método do db que você já tem (buscarUsuarioPorEmail ou similar)
        // Como seu db usa async/await, vamos tentar:
        const user = await db.buscarUsuarioPorEmail?.(email);
        
        // Se não tiver esse método, use o db.get de forma async
        // Ou use a query diretamente
        
        if (!user) {
            console.log(`Usuário não encontrado: ${email}`);
            return res.status(401).json({ 
                success: false, 
                error: '❌ Não estás cadastrado como engenheiro! Faça o registro primeiro.' 
            });
        }
        
        // Verificar se é sênior/engenheiro
        if (user.role !== 'senior') {
            console.log(`Usuário não é engenheiro: ${email} - Role: ${user.role}`);
            return res.status(403).json({ 
                success: false, 
                error: '❌ Não estás cadastrado como engenheiro! Apenas engenheiros podem publicar projetos.' 
            });
        }
        
        // Verificar senha
        if (user.password !== password) {
            console.log(`Senha incorreta para: ${email}`);
            return res.status(401).json({ 
                success: false, 
                error: '❌ Senha incorreta! Tente novamente.' 
            });
        }
        
        // Login bem-sucedido
        console.log(`Engenheiro verificado: ${email}`);
        
        // Criar token JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            'SECRET_KEY',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token: token,
            role: user.role,
            name: user.name,
            email: user.email
        });
        
    } catch (error) {
        console.error('Erro ao verificar engenheiro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor: ' + error.message 
        });
    }
});



// Listar todos os projetos (público)
app.get('/api/projetos', async (req, res) => {
  try {
    const projetos = await db.listarTodosProjetos();
    res.json(projetos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar projeto por ID (público)
app.get('/api/projetos/:id', async (req, res) => {
  try {
    const projeto = await db.buscarProjetoPorId(req.params.id);
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    res.json(projeto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ────────────────────────────────────────────
// ROTAS ADMIN (para verificar cadastros)
// ────────────────────────────────────────────

// Listar usuários pendentes
app.get('/api/admin/usuarios/pendentes', autenticar, async (req, res) => {
  if (req.usuario.email !== 'admin@obravia.com') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  
  const usuarios = await db.listarUsuariosPendentes();
  res.json(usuarios);
});

// Aprovar usuário
app.put('/api/admin/usuarios/:id/aprovar', autenticar, async (req, res) => {
  if (req.usuario.email !== 'admin@obravia.com') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  
  await db.aprovarUsuario(req.params.id);
  res.json({ success: true });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Banco de dados: database.db`);
});