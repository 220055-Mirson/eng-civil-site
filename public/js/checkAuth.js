// Verifica se o usuário está logado
const usuarioLogado = localStorage.getItem("usuarioLogado");

if (!usuarioLogado) {
  // Redireciona imediatamente para login se não estiver logado
  window.location.href = "/login.html";
}
