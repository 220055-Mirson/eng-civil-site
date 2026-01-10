document.addEventListener("DOMContentLoaded", () => {
  const gridCards = document.querySelector(".grid-cards");
  const bemVindo = document.getElementById("bemVindo");
  const menuAdmin = document.getElementById("menuAdmin");

  // ✅ Pega o usuário logado do localStorage
  const usuarioLogado = localStorage.getItem("usuarioLogado");
  const role = localStorage.getItem("role");

  // 🔹 Redireciona para login se não estiver logado
  if (!usuarioLogado) {
    window.location.href = "/login.html";
    return;
  }

  // 🔹 Atualiza o "Bem-vindo"
  if (bemVindo) {
    bemVindo.innerText = `Bem-vindo, ${usuarioLogado}`;
  }

  // 🔹 Exibe ou esconde menu admin
  if (menuAdmin && role !== "admin") {
    menuAdmin.style.display = "none";
  }

  // 🔹 Função de logout
  window.logout = () => {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("role");
    window.location.href = "/login.html";
  };

  // 🔹 Função para carregar projetos
  async function carregarProjetos() {
    if (!gridCards) return;

    gridCards.innerHTML = "";

    try {
      const res = await fetch("/api/projetos");
      const projetos = await res.json();

      projetos.forEach((proj) => {
        let imgSrc = "/img/placeholder.png";
        if (proj.images && proj.images.length > 0) {
          imgSrc = proj.images[0];
        }

        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
          <img src="${imgSrc}" alt="${proj.title}" class="img-projeto">
          <h3>${proj.title}</h3>
          <p>${proj.description}</p>
          <textarea class="comentario" placeholder="Deixe um comentário..."></textarea>
          <button class="btn-comentar">Comentar</button>
        `;

        // Abrir detalhes ao clicar na imagem
        card.querySelector(".img-projeto").addEventListener("click", () => {
          window.location.href = `detalhes.html?id=${proj.id}`;
        });

        // Comentar usando usuário logado
        card.querySelector(".btn-comentar").addEventListener("click", async () => {
          const text = card.querySelector(".comentario").value.trim();

          if (!text) {
            alert("Digite um comentário.");
            return;
          }

          try {
            await fetch(`/api/comments/${proj.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user: usuarioLogado, text })
            });

            window.location.href = `detalhes.html?id=${proj.id}`;
          } catch (err) {
            console.error("Erro ao salvar comentário:", err);
            alert("Erro ao enviar comentário.");
          }
        });

        gridCards.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar projetos:", err);
    }
  }

  // Carrega os projetos
  carregarProjetos();
});
