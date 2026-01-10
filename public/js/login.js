document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("username").value.trim();
    if (!nome) {
      alert("Digite um nome válido!");
      return;
    }

    // Definir papel
    let role = "user";
    if (nome.toLowerCase() === "ugembe") {
      role = "admin";
    }

    // Guardar no navegador
    localStorage.setItem("usuarioLogado", nome);
    localStorage.setItem("role", role);

    // Redirecionar para index
    window.location.href = "/index.html";

  });
});
