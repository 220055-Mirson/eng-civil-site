// ── CONFIGURAÇÃO DA API ──
// REMOVA esta linha fixa:
// const API_URL = 'http://localhost:3000/api';
// Agora usa a variável global do config.js

// ── CONFIGURAR UPLOAD DE ARQUIVOS ──
function setupFileUpload(clickId, inputId, displayId) {
  const clickEl = document.getElementById(clickId);
  const inputEl = document.getElementById(inputId);
  const displayEl = document.getElementById(displayId);
  
  if (clickEl && inputEl && displayEl) {
    clickEl.addEventListener('click', () => inputEl.click());
    inputEl.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        displayEl.textContent = `📎 ${e.target.files[0].name}`;
      }
    });
  }
}

// Inicializar uploads
setupFileUpload('uploadAlvara', 'alvaraInput', 'alvaraNome');
setupFileUpload('uploadNuit', 'nuitInput', 'nuitNome');
setupFileUpload('uploadDiploma', 'diplomaInput', 'diplomaNome');
setupFileUpload('uploadCedula', 'cedulaInput', 'cedulaNome');
setupFileUpload('uploadJuniorDiploma', 'juniorDiplomaInput', 'juniorDiplomaNome');
setupFileUpload('uploadJuniorCedula', 'juniorCedulaInput', 'juniorCedulaNome');

// ── FUNÇÕES DE MODAL ──
function abrirModal(tipo) {
  const modalId = tipo === 'empresa' ? 'modalEmpresa' : (tipo === 'senior' ? 'modalSenior' : 'modalJunior');
  document.getElementById(modalId).classList.add('aberto');
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('aberto');
}

// ── FUNÇÕES DE TOAST ──
function mostrarToast(mensagem, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.classList.add('visivel');
  if (isError) toast.classList.add('error');
  else toast.classList.remove('error');
  
  setTimeout(() => {
    toast.classList.remove('visivel');
    toast.classList.remove('error');
  }, 4000);
}

// ── VALIDAÇÃO DE SENHAS ──
function validarSenhas(senha, confirmar) {
  if (senha !== confirmar) {
    mostrarToast('❌ As senhas não coincidem!', true);
    return false;
  }
  if (senha.length < 6) {
    mostrarToast('❌ A senha deve ter pelo menos 6 caracteres!', true);
    return false;
  }
  return true;
}

// ── FUNÇÃO PARA CRIAR FORM DATA COM OS ARQUIVOS ──
function criarFormDataEmpresa() {
  const formData = new FormData();
  formData.append('nome_empresa', document.getElementById('empresaNome').value);
  formData.append('email', document.getElementById('empresaEmail').value);
  formData.append('senha', document.getElementById('empresaSenha').value);
  formData.append('nuit', document.getElementById('empresaNuit').value);
  formData.append('responsavel', document.getElementById('empresaResponsavel').value);
  formData.append('bi', document.getElementById('empresaBi').value);
  
  const alvara = document.getElementById('alvaraInput').files[0];
  const nuitComprovativo = document.getElementById('nuitInput').files[0];
  
  if (alvara) formData.append('alvara', alvara);
  if (nuitComprovativo) formData.append('nuit_comprovativo', nuitComprovativo);
  
  return formData;
}

function criarFormDataSenior() {
  const formData = new FormData();
  formData.append('nome', document.getElementById('seniorNome').value);
  formData.append('email', document.getElementById('seniorEmail').value);
  formData.append('senha', document.getElementById('seniorSenha').value);
  formData.append('numero_ordem', document.getElementById('seniorOrdem').value);
  formData.append('anos_experiencia', document.getElementById('seniorExperiencia').value);
  formData.append('data_validade_ordem', document.getElementById('seniorValidade').value);
  
  const diploma = document.getElementById('diplomaInput').files[0];
  if (diploma) formData.append('diploma', diploma);
  
  return formData;
}

function criarFormDataJunior() {
  const formData = new FormData();
  formData.append('nome', document.getElementById('juniorNome').value);
  formData.append('email', document.getElementById('juniorEmail').value);
  formData.append('senha', document.getElementById('juniorSenha').value);
  formData.append('numero_ordem', document.getElementById('juniorOrdem').value);
  formData.append('especializacao', document.getElementById('juniorEspecializacao').value);
  formData.append('linkedin', document.getElementById('juniorLinkedin').value);
  
  const diploma = document.getElementById('juniorDiplomaInput').files[0];
  if (diploma) formData.append('diploma', diploma);
  
  return formData;
}

// ── ENVIAR CADASTRO PARA O BACKEND ──
async function enviarCadastro(tipo) {
  let endpoint = '';
  let formData = null;
  let mensagem = '';
  
  if (tipo === 'empresa') {
    const senha = document.getElementById('empresaSenha')?.value;
    const confirmar = document.getElementById('empresaConfirmarSenha')?.value;
    if (!validarSenhas(senha, confirmar)) return;
    
    endpoint = `${API_URL}/cadastro/empresa`;
    formData = criarFormDataEmpresa();
    mensagem = '📄 Empresa registada! Documentos enviados para verificação.';
    
  } else if (tipo === 'senior') {
    const senha = document.getElementById('seniorSenha')?.value;
    const confirmar = document.getElementById('seniorConfirmarSenha')?.value;
    if (!validarSenhas(senha, confirmar)) return;
    
    endpoint = `${API_URL}/cadastro/senior`;
    formData = criarFormDataSenior();
    mensagem = '🎓 Engenheiro Sénior registado! A verificação será feita em 48h.';
    
  } else {
    const senha = document.getElementById('juniorSenha')?.value;
    const confirmar = document.getElementById('juniorConfirmarSenha')?.value;
    if (!validarSenhas(senha, confirmar)) return;
    
    endpoint = `${API_URL}/cadastro/junior`;
    formData = criarFormDataJunior();
    mensagem = '🌱 Talento em Crescimento registado! Perfil será visível na secção especial.';
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      mostrarToast(mensagem);
      
      // Fechar modal
      const modais = ['modalEmpresa', 'modalSenior', 'modalJunior'];
      modais.forEach(m => {
        const el = document.getElementById(m);
        if (el) el.classList.remove('aberto');
      });
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      mostrarToast(data.error || 'Erro ao cadastrar. Tente novamente.', true);
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarToast('Erro de conexão com o servidor. Verifique se o backend está rodando.', true);
  }
}

// ── FECHAR MODAL AO CLICAR FORA ──
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('aberto');
  });
});