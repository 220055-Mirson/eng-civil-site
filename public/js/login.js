document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // previne recarregar página

    const nome = document.getElementById("username").value.trim();
    if (!nome) {
      alert("Digite seu nome");
      return;
    }

    // Define o papel do usuário
    let role = "user";
    if (nome.toLowerCase() === "ugembe") role = "admin";

    // Guarda no localStorage
    localStorage.setItem("usuarioLogado", nome);
    localStorage.setItem("role", role);

    // Redireciona para index.html
    window.location.href = "/index.html";
  });
});
