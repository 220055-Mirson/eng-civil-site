// ── CONFIGURAÇÃO DA API ──
const API_URL = 'http://localhost:3000';

// ── DADOS DOS PROJETOS (FALLBACK) ──
const projetosDataFallback = {
  1: {
    id: 1,
    titulo: "Moradia Unifamiliar T4",
    descricao: "Projeto de construção residencial com acabamentos modernos, estrutura em betão armado. Esta moradia foi projetada para oferecer conforto e funcionalidade, com áreas bem distribuídas e iluminação natural privilegiada. Utilizamos materiais de alta qualidade e técnicas construtivas inovadoras para garantir durabilidade e eficiência energética.",
    categoria: "Residencial",
    tags: ["Residencial", "Betão armado", "Moderno"],
    engenheiro: {
      nome: "Eng. Nédio Ugembe",
      local: "Maputo",
      avatar: "NU"
    },
    imagemPrincipal: "/uploads/teste1.png",
    galeria: ["/uploads/teste1.png", "/uploads/teste1.png", "/uploads/teste1.png"],
    comentarios: [
      { id: 1, usuario: "Carlos Silva", texto: "Excelente projeto! Muito bem executado.", data: "2024-01-15" },
      { id: 2, usuario: "Marina Costa", texto: "Acabamentos de primeira linha.", data: "2024-01-20" }
    ]
  },
  2: {
    id: 2,
    titulo: "Edifício Comercial 5 Pisos",
    descricao: "Projeto de edifício comercial com planta aberta, sistema de climatização central e fachada moderna em vidro. O edifício conta com elevadores de alta velocidade, estacionamento subterrâneo e certificação sustentável. Ideal para escritórios corporativos e lojas comerciais.",
    categoria: "Comercial",
    tags: ["Comercial", "Estruturas", "Sustentável"],
    engenheiro: {
      nome: "Eng. Ana Machava",
      local: "Matola",
      avatar: "AM"
    },
    imagemPrincipal: "/uploads/teste2.png",
    galeria: ["/uploads/teste2.png", "/uploads/teste2.png"],
    comentarios: [
      { id: 1, usuario: "João Mendes", texto: "Projeto inovador e bem localizado.", data: "2024-02-10" }
    ]
  },
  3: {
    id: 3,
    titulo: "Ponte Pedonal Municipal",
    descricao: "Infra-estrutura urbana em aço galvanizado com capacidade para 500 pessoas. A ponte conecta dois bairros da cidade, melhorando a mobilidade urbana e a segurança dos pedestres. Projeto executado em parceria com a câmara municipal.",
    categoria: "Infra-estrutura",
    tags: ["Infra-estrutura", "Aço", "Ponte"],
    engenheiro: {
      nome: "Eng. João Pereira",
      local: "Beira",
      avatar: "JP"
    },
    imagemPrincipal: "/uploads/teste3.png",
    galeria: ["/uploads/teste3.png", "/uploads/teste3.png"],
    comentarios: [
      { id: 1, usuario: "Prefeitura da Beira", texto: "Excelente trabalho, ponte muito segura.", data: "2024-03-05" }
    ]
  },
  4: {
    id: 4,
    titulo: "Escola Primária 8 Salas",
    descricao: "Construção modular de escola com materiais locais sustentáveis e ventilação natural. O projeto inclui 8 salas de aula, biblioteca, refeitório e áreas de lazer. Utilizamos técnicas de construção rápida com baixo impacto ambiental.",
    categoria: "Educação",
    tags: ["Educação", "Sustentável", "Modular"],
    engenheiro: {
      nome: "Eng. Sara Fumo",
      local: "Nampula",
      avatar: "SF"
    },
    imagemPrincipal: "/uploads/teste4.png",
    galeria: ["/uploads/teste4.png", "/uploads/teste4.png"],
    comentarios: [
      { id: 1, usuario: "Comunidade local", texto: "As crianças adoraram a nova escola!", data: "2024-04-12" }
    ]
  }
};

// ── VARIÁVEIS GLOBAIS ──
let projetoAtual = null;
let engenheiroAtual = '';

// ── PEGAR ID DA URL ──
function getProjetoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// ── CARREGAR PROJETO DO BACKEND ──
async function carregarProjeto() {
  const projetoId = getProjetoId();
  
  if (!projetoId) {
    mostrarErro('ID do projeto não informado');
    return;
  }
  
  try {
    // Tentar buscar do backend
    const response = await fetch(`${API_URL}/projetos/${projetoId}`);
    
    if (response.ok) {
      const projeto = await response.json();
      // Converter formato do backend para o formato esperado
      projetoAtual = {
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        categoria: projeto.categoria,
        tags: projeto.tags || [],
        engenheiro: {
          nome: projeto.engenheiro_nome || projeto.engenheiro || 'Engenheiro',
          local: projeto.local || 'Moçambique',
          avatar: (projeto.engenheiro_nome || projeto.engenheiro || 'EN').substring(0, 2).toUpperCase()
        },
        imagemPrincipal: projeto.foto_capa || (projeto.fotos && projeto.fotos[0]) || 'https://placehold.co/800x400/D4B896/FFFFFF?text=Sem+Imagem',
        galeria: projeto.fotos || [],
        comentarios: projeto.comentarios || []
      };
      exibirDetalhes();
    } else {
      // Fallback para dados locais
      if (projetosDataFallback[projetoId]) {
        projetoAtual = projetosDataFallback[projetoId];
        exibirDetalhes();
      } else {
        mostrarErro('Projeto não encontrado');
      }
    }
  } catch (error) {
    console.error('Erro ao carregar projeto:', error);
    // Fallback para dados locais
    if (projetosDataFallback[projetoId]) {
      projetoAtual = projetosDataFallback[projetoId];
      exibirDetalhes();
    } else {
      mostrarErro('Erro ao carregar projeto. Verifique sua conexão.');
    }
  }
}

// ── EXIBIR DETALHES DO PROJETO ──
function exibirDetalhes() {
  if (!projetoAtual) return;
  
  // Montar galeria de fotos
  let galeriaHtml = '';
  if (projetoAtual.galeria && projetoAtual.galeria.length > 0) {
    galeriaHtml = `
      <div class="galeria-section">
        <h4>📸 Galeria de Fotos</h4>
        <div class="galeria-grid">
          ${projetoAtual.galeria.map(img => `<img src="${img}" alt="Foto do projeto" class="galeria-img" onclick="abrirImagemGrande('${img}')">`).join('')}
        </div>
      </div>
    `;
  }
  
  // Montar comentários
  let comentariosHtml = '';
  const comentarios = projetoAtual.comentarios || [];
  
  if (comentarios.length > 0) {
    comentariosHtml = `
      <div class="comentarios-section">
        <h4>💬 Comentários (${comentarios.length})</h4>
        ${comentarios.map(com => `
          <div class="comentario-card">
            <div class="comentario-header">
              <div class="comentario-avatar">${escapeHtml(com.usuario.charAt(0))}</div>
              <span class="comentario-nome">${escapeHtml(com.usuario)}</span>
              <span class="comentario-data">${com.data || new Date().toLocaleDateString()}</span>
            </div>
            <div class="comentario-texto">${escapeHtml(com.texto)}</div>
          </div>
        `).join('')}
        <div class="form-comentario">
          <textarea id="novoComentario" placeholder="Deixe seu comentário..." rows="3"></textarea>
          <button class="btn-enviar" onclick="adicionarComentario()">Enviar comentário</button>
        </div>
      </div>
    `;
  } else {
    comentariosHtml = `
      <div class="comentarios-section">
        <h4>💬 Comentários</h4>
        <p style="color: #888780; margin-bottom: 1rem;">Seja o primeiro a comentar este projeto!</p>
        <div class="form-comentario">
          <textarea id="novoComentario" placeholder="Deixe seu comentário..." rows="3"></textarea>
          <button class="btn-enviar" onclick="adicionarComentario()">Enviar comentário</button>
        </div>
      </div>
    `;
  }
  
  const tags = projetoAtual.tags || [];
  const engenheiro = projetoAtual.engenheiro || { nome: 'Engenheiro', local: 'Moçambique', avatar: 'EN' };
  
  const html = `
    <div class="projeto-detalhes">
      <img class="projeto-imagem-principal" src="${projetoAtual.imagemPrincipal}" alt="${escapeHtml(projetoAtual.titulo)}">
      <div class="projeto-info">
        <span class="projeto-categoria">${escapeHtml(projetoAtual.categoria || 'Projeto')}</span>
        <h1 class="projeto-titulo">${escapeHtml(projetoAtual.titulo)}</h1>
        
        <div class="projeto-engenheiro">
          <div class="avatar-grande">${escapeHtml(engenheiro.avatar)}</div>
          <div class="eng-info">
            <h3>${escapeHtml(engenheiro.nome)}</h3>
            <div class="eng-local"><span class="dot-local"></span> ${escapeHtml(engenheiro.local)}</div>
          </div>
        </div>
        
        <div class="projeto-descricao">
          <h4>Sobre o projeto</h4>
          <p>${escapeHtml(projetoAtual.descricao)}</p>
        </div>
        
        <div class="projeto-tags">
          ${tags.map(tag => `<span class="tag-detalhe">${escapeHtml(tag)}</span>`).join('')}
        </div>
        
        <button class="btn-contato-contato" onclick="abrirModalContacto('${escapeHtml(engenheiro.nome)}')">
          📞 Pedir contacto com o engenheiro
        </button>
      </div>
    </div>
    ${galeriaHtml}
    ${comentariosHtml}
  `;
  
  document.getElementById('detalhesContainer').innerHTML = html;
}

// ── MOSTRAR ERRO ──
function mostrarErro(mensagem) {
  document.getElementById('detalhesContainer').innerHTML = `
    <div style="text-align: center; padding: 3rem; background: white; border-radius: 20px;">
      <h2 style="color: var(--laranja);">⚠️ ${mensagem}</h2>
      <p style="margin-top: 1rem;">O projeto que você procura não existe ou foi removido.</p>
      <button class="btn-voltar" onclick="voltarPagina()" style="margin-top: 1rem;">← Voltar para projetos</button>
    </div>
  `;
}

// ── FUNÇÕES AUXILIARES ──
function voltarPagina() {
  window.location.href = 'index.html';
}

function abrirImagemGrande(imgSrc) {
  window.open(imgSrc, '_blank');
}

function adicionarComentario() {
  const comentario = document.getElementById('novoComentario')?.value.trim();
  if (!comentario) {
    mostrarToast("Por favor, escreva um comentário.");
    return;
  }
  
  const usuarioLogado = localStorage.getItem("usuarioLogado") || "Visitante";
  
  // Aqui você pode enviar o comentário para o backend
  mostrarToast("Comentário adicionado com sucesso!");
  document.getElementById('novoComentario').value = '';
  
  // Recarregar página para mostrar novo comentário (simulação)
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// ── MODAIS ──
function abrirModalContacto(engenheiro) {
  engenheiroAtual = engenheiro;
  document.getElementById("modalTitulo").innerText = `Contactar: ${engenheiro}`;
  document.getElementById("modalContacto").classList.add("aberto");
}

function fecharModal(id) {
  document.getElementById(id).classList.remove("aberto");
}

function enviarPedido() {
  const nome = document.getElementById("clienteNome").value.trim();
  const tel = document.getElementById("clienteTel").value.trim();
  if (!nome || !tel) {
    mostrarToast("Por favor preencha nome e telefone.");
    return;
  }
  fecharModal("modalContacto");
  mostrarToast(`Pedido de contacto enviado para ${engenheiroAtual}!`);
  document.getElementById("clienteNome").value = '';
  document.getElementById("clienteTel").value = '';
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMensagem").innerText = msg;
  toast.classList.add("visivel");
  setTimeout(() => toast.classList.remove("visivel"), 4000);
}

// ── UTILITÁRIOS ──
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── AUTH ──
function atualizarWelcome() {
  const nome = localStorage.getItem("usuarioLogado");
  const menuAdmin = document.getElementById("menuAdmin");
  
  if (nome) {
    document.getElementById("bemVindo").innerText = `Bem-vindo, ${nome}`;
    if (menuAdmin) menuAdmin.style.display = "list-item";
  } else {
    document.getElementById("bemVindo").innerText = `Bem-vindo, Visitante`;
    if (menuAdmin) menuAdmin.style.display = "none";
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

// ── EVENTOS E INICIALIZAÇÃO ──
document.addEventListener('DOMContentLoaded', () => {
  // Configurar fechamento de modais
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('aberto');
    });
  });
  
  atualizarWelcome();
  carregarProjeto();
});