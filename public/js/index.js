document.addEventListener("DOMContentLoaded", () => {
  const gridCards = document.querySelector(".grid-cards");

  // 👉 nome do usuário vindo do login
  const usuarioLogado = localStorage.getItem("usuarioLogado");

  async function carregarProjetos() {
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

        // 👉 clicar na imagem → detalhes
        card.querySelector(".img-projeto").addEventListener("click", () => {
          window.location.href = `detalhes.html?id=${proj.id}`;
        });

        // 👉 comentar → usar usuário do login
        card.querySelector(".btn-comentar").addEventListener("click", async () => {
          const text = card.querySelector(".comentario").value.trim();

          if (!usuarioLogado) {
            alert("Faça login para comentar.");
            return;
          }

          if (!text) {
            alert("Digite um comentário.");
            return;
          }

          try {
            await fetch(`/api/comments/${proj.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user: usuarioLogado,
                text: text
              })
            });

            // 👉 após salvar, abre detalhes
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

  carregarProjetos();
});
