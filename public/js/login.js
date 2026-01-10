document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    if (!username) return alert("Digite um nome válido!");

    // Envia o nome para o backend
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    const data = await res.json();

    if (data.success) {
      // Guarda o nome no localStorage
      localStorage.setItem("username", username);
      window.location.href = "index.html"; // redireciona para página principal
    } else {
      alert("Erro no login! Tente novamente.");
    }
  });



  function login() {
    const nome = document.getAnimations.ElementById("username").value.trim();

    if (!nome) {
      alert("Digite seu nome");
      return;
    }

    //Definir papel
    let role = "user";
    if (nome.toLowerCase() === "ugembe") {
      role = "admin";
    }

    //Guardar no navegador
    localStorage.setItem("usuarioLogado", nome);
    localStorage.setItem("role", role);

    //Redirecionar
    window.location.href = "index.html";
  }
  
});

