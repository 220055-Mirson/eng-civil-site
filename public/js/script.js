// ── CONFIGURAÇÃO DA API ──
// REMOVA esta linha fixa:
// const API_URL = 'http://localhost:3000/api';
// Agora usa a variável global API_URL do config.js

// ── VARIÁVEIS GLOBAIS ──
let todosProjetos = [];
let projetosFiltrados = [];
let categoriaAtual = 'todos';

// ── CARREGAR PROJETOS DO BACKEND ──
async function carregarProjetos() {
  const grid = document.getElementById('projetosGrid');
  
  try {
    const response = await fetch(`${API_URL}/projetos`);
    
    if (response.ok) {
      todosProjetos = await response.json();
      aplicarFiltro();
    } else {
      throw new Error('Erro ao carregar projetos');
    }
  } catch (error) {
    console.error('Erro:', error);
    if (grid) {
      grid.innerHTML = `
        <div class="empty-projetos">
          <h3>⚠️ Erro ao carregar projetos</h3>
          <p>Não foi possível conectar ao servidor. Verifique se o backend está rodando.</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 8px 16px; background: var(--laranja); color: white; border: none; border-radius: 8px; cursor: pointer;">Tentar novamente</button>
        </div>
      `;
    }
  }
}

// ── APLICAR FILTRO ──
function filtrarProjetos(categoria) {
  categoriaAtual = categoria;
  
  // Atualizar botões ativos
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.remove('ativo');
    if (btn.getAttribute('data-categoria') === categoria) {
      btn.classList.add('ativo');
    }
  });
  
  aplicarFiltro();
}

function aplicarFiltro() {
  if (categoriaAtual === 'todos') {
    projetosFiltrados = [...todosProjetos];
  } else {
    projetosFiltrados = todosProjetos.filter(p => p.categoria === categoriaAtual);
  }
  
  exibirProjetos();
}

// ── EXIBIR PROJETOS NA GRID ──
function exibirProjetos() {
  const grid = document.getElementById('projetosGrid');
  
  if (!grid) return;
  
  if (projetosFiltrados.length === 0) {
    grid.innerHTML = `
      <div class="empty-projetos">
        <h3>📭 Nenhum projeto encontrado</h3>
        <p>${categoriaAtual !== 'todos' ? `Nenhum projeto na categoria "${categoriaAtual}" ainda.` : 'Seja o primeiro a publicar um projeto!'}</p>
        ${categoriaAtual !== 'todos' ? '<button class="btn-outline" onclick="filtrarProjetos(\'todos\')" style="margin-top: 1rem;">Ver todos</button>' : '<a href="cadastro-engenheiro.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">Criar perfil</a>'}
      </div>
    `;
    return;
  }
  
  grid.innerHTML = projetosFiltrados.map(projeto => {
    const iniciais = (projeto.engenheiro_nome || projeto.engenheiro || 'Eng').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const local = projeto.local || 'Moçambique';
    
    // CORREÇÃO: Verificar se tags é array, se não for, converter ou usar array vazio
    let tags = [];
    if (projeto.tags) {
      if (Array.isArray(projeto.tags)) {
        tags = projeto.tags;
      } else if (typeof projeto.tags === 'string') {
        tags = projeto.tags.split(',').map(t => t.trim());
      }
    }
    
    return `
      <div class="card">
        <img class="card-img" src="${projeto.foto_capa || (projeto.fotos && projeto.fotos[0]) || 'https://placehold.co/600x400/D4B896/FFFFFF?text=Sem+Imagem'}" alt="${escapeHtml(projeto.titulo)}">
        <div class="card-body">
          <div class="card-engenheiro">
            <div class="avatar">${iniciais}</div>
            <div>
              <div class="card-nome">${escapeHtml(projeto.engenheiro_nome || projeto.engenheiro || 'Engenheiro')}</div>
              <div class="card-local"><span class="dot-local"></span>${escapeHtml(local)}</div>
            </div>
          </div>
          <h3 onclick="verDetalhes(${projeto.id})">${escapeHtml(projeto.titulo)}</h3>
          <p>${escapeHtml(projeto.descricao.substring(0, 100))}${projeto.descricao.length > 100 ? '...' : ''}</p>
          <div class="card-tags">
            ${tags.slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <div class="card-acoes">
            <button class="btn-contacto" onclick="abrirModalContacto('${escapeHtml(projeto.engenheiro_nome || projeto.engenheiro || 'Engenheiro')}')">Pedir contacto</button>
            <button class="btn-ver" onclick="verDetalhes(${projeto.id})">Ver</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── VER DETALHES DO PROJETO ──
function verDetalhes(projetoId) {
  window.location.href = `detalhes.html?id=${projetoId}`;
}

// ── CARREGAR PEDIDOS (dados estáticos para demonstração) ──
function carregarPedidos() {
  const pedidosGrid = document.getElementById('pedidosGrid');
  if (!pedidosGrid) return;
  
  const pedidos = [
    {
      tipo: "Projecto novo",
      titulo: "Moradia T3 em Maputo",
      cliente: "Carlos Nhantumbo",
      data: "hoje",
      descricao: "Preciso de engenheiro para projecto de moradia T3, terreno 400m² em Zimpeto.",
      sugestao: "Eng. Nédio Ugembe — Maputo, 3 projectos residenciais concluídos."
    },
    {
      tipo: "Fiscalização",
      titulo: "Fiscalização de obra em Matola",
      cliente: "Empresa BuildMoz",
      data: "ontem",
      descricao: "Obra comercial em curso, precisamos de fiscal residente para 6 meses.",
      sugestao: "Eng. Ana Machava — Matola, disponível para fiscalização."
    },
    {
      tipo: "Consulta técnica",
      titulo: "Avaliação estrutural — Beira",
      cliente: "Fátima Salomão",
      data: "há 2 dias",
      descricao: "Edifício antigo precisa de avaliação estrutural urgente após fissuras detectadas.",
      sugestao: "Eng. João Pereira — Beira, especialista em estruturas."
    }
  ];
  
  pedidosGrid.innerHTML = pedidos.map(pedido => `
    <div class="pedido-card">
      <span class="pedido-tipo">${pedido.tipo}</span>
      <h4>${pedido.titulo}</h4>
      <p class="pedido-meta">Cliente: ${pedido.cliente} · Publicado ${pedido.data}</p>
      <p style="font-size:13px; color:#5F5E5A;">${pedido.descricao}</p>
      <div class="pedido-sugestao">
        <strong>Sugestão OBRAVIA:</strong> ${pedido.sugestao}
      </div>
    </div>
  `).join('');
}

// ── AUTH E WELCOME ──
function atualizarWelcome() {
  const nome = localStorage.getItem("usuarioLogado");
  const bemVindo = document.getElementById("bemVindo");
  const menuAdmin = document.getElementById("menuAdmin");
  
  if (nome) {
    bemVindo.innerText = `Bem-vindo, ${nome}`;
    // Verificar se o usuário é cadastrado para mostrar o botão Admin
    verificarCadastroAdmin(nome, menuAdmin);
  } else {
    bemVindo.innerText = `Bem-vindo, Visitante`;
    if (menuAdmin) menuAdmin.style.display = "none";
  }
}

async function verificarCadastroAdmin(username, menuAdmin) {
  if (!menuAdmin) return;
  
  try {
    const response = await fetch(`${API_URL}/verificar-cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    const data = await response.json();
    
    if (data.cadastrado && data.status === 'aprovado') {
      menuAdmin.style.display = "list-item";
    } else {
      menuAdmin.style.display = "none";
    }
  } catch (error) {
    console.error('Erro ao verificar cadastro:', error);
    menuAdmin.style.display = "none";
  }
}

function logout() {
  const token = localStorage.getItem("authToken");
  
  if (token) {
    fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    }).catch(console.error);
  }
  
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("authToken");
  localStorage.removeItem("role");
  window.location.href = "login.html";
}

// ── MODAIS EXISTENTES ──
let engenheiroAtual = '';

function abrirModalContacto(engenheiro) {
  engenheiroAtual = engenheiro;
  document.getElementById("modalTitulo").innerText = `Contactar: ${engenheiro}`;
  document.getElementById("modalContacto").classList.add("aberto");
}

function abrirModalPedido() {
  document.getElementById("modalPedido").classList.add("aberto");
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("aberto");
  }
}

function enviarPedido() {
  const nome = document.getElementById("clienteNome")?.value.trim();
  const tel = document.getElementById("clienteTel")?.value.trim();
  if (!nome || !tel) {
    mostrarToast("Por favor preencha nome e telefone.");
    return;
  }
  fecharModal("modalContacto");
  mostrarToast(`Pedido de contacto enviado para ${engenheiroAtual}!`);
  document.getElementById("clienteNome").value = '';
  document.getElementById("clienteTel").value = '';
}

function enviarPedidoServico() {
  const nome = document.getElementById("pedidoNome")?.value.trim();
  if (!nome) {
    mostrarToast("Por favor informe o seu nome.");
    return;
  }
  fecharModal("modalPedido");
  mostrarToast("Pedido publicado! A OBRAVIA vai sugerir engenheiros próximos.");
  document.getElementById("pedidoNome").value = '';
  document.getElementById("pedidoLocal").value = '';
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMensagem").innerText = msg;
  toast.classList.add("visivel");
  setTimeout(() => toast.classList.remove("visivel"), 4000);
}

// ── NOVO MODAL PARA ADICIONAR PROJETOS (LOGIN ENGENHEIRO) ──
function abrirModalLoginProjetos() {
  console.log("Abrindo modal de login...");
  const modal = document.getElementById('modalLoginProjetos');
  if (modal) {
    modal.classList.add('aberto');
    // Limpar campos
    const emailInput = document.getElementById('loginEmail');
    const senhaInput = document.getElementById('loginSenha');
    const errorDiv = document.getElementById('loginError');
    if (emailInput) emailInput.value = '';
    if (senhaInput) senhaInput.value = '';
    if (errorDiv) errorDiv.style.display = 'none';
  } else {
    console.error("Modal 'modalLoginProjetos' não encontrado!");
    mostrarToast("Erro: Modal de login não encontrado!", true);
  }
}


async function verificarEngenheiro() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const errorDiv = document.getElementById('loginError');
  
  if (!email || !senha) {
    if (errorDiv) {
      errorDiv.textContent = 'Preencha email e senha!';
      errorDiv.style.display = 'block';
    }
    return;
  }
  
  if (errorDiv) errorDiv.style.display = 'none';
  
  // Mostrar loading
  const btn = event.target;
  const originalText = btn.innerText;
  btn.innerText = 'Verificando...';
  btn.disabled = true;
  
  try {
    // USAR A ROTA DE LOGIN EXISTENTE (ela já aceita qualquer usuário)
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })  // Note: "senha" não "password"
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Salvar dados do usuário
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('usuarioLogado', result.user.nome);
      localStorage.setItem('role', result.user.role);
      
      mostrarToast(`✅ Bem-vindo, ${result.user.nome}! Redirecionando...`);
      
      fecharModal('modalLoginProjetos');
      setTimeout(() => {
        window.location.href = 'publicar-projeto.html';
      }, 1500);
    } else {
      if (errorDiv) {
        errorDiv.textContent = result.error || '❌ Usuário não encontrado! Faça o registro primeiro.';
        errorDiv.style.display = 'block';
      }
      mostrarToast(result.error || 'Erro no login!', true);
    }
  } catch (error) {
    console.error('Erro:', error);
    if (errorDiv) {
      errorDiv.textContent = 'Erro ao conectar com o servidor.';
      errorDiv.style.display = 'block';
    }
    mostrarToast('Erro de conexão', true);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

// ── UTILITÁRIOS ──
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── EVENTOS E INICIALIZAÇÃO ──
document.addEventListener('DOMContentLoaded', () => {
  // Configurar modais
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('aberto');
    });
  });
  
  // Configurar botão Adicionar Projetos
  const addProjectBtn = document.getElementById('addProjectBtn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', function(e) {
      e.preventDefault();
      abrirModalLoginProjetos();
    });
  }
  
  // Carregar dados
  atualizarWelcome();
  carregarProjetos();
  carregarPedidos();
});