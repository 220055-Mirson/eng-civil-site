document.addEventListener("DOMContentLoaded", () => {
  const listaConstrucoes = document.getElementById("lista-construcoes");
  const btnAdmin = document.getElementById("btn-admin");

  const usuario = localStorage.getItem("usuarioLogado");
  const role = localStorage.getItem("role");

  if (usuario && role === "admin") {
    btnAdmin.style.display = "inline-block";
  }

  carregarConstrucoes();

  async function carregarConstrucoes() {
    listaConstrucoes.innerHTML = "";

    try {
      const res = await fetch("/api/construcoes");
      const construcoes = await res.json();

      if (!Array.isArray(construcoes)) {
  console.error("Resposta inválida:", construcoes);
  return;
}

      construcoes.forEach(cons => {
        const card = document.createElement("div");
        card.classList.add("card");

        let imgSrc = "/img/placeholder.png";
        if (cons.images && cons.images.length > 0) imgSrc = cons.images[0];

        card.innerHTML = `
          <img src="${imgSrc}" alt="${cons.title}" class="img-construcao">
          <h3>${cons.title}</h3>
          <p>${cons.description}</p>
          ${role === "admin" ? '<button class="btn-apagar">Apagar</button>' : ''}
        `;

        // Apagar (admin)
        if (role === "admin") {
          card.querySelector(".btn-apagar").addEventListener("click", async () => {
            if (!confirm(`Deseja apagar "${cons.title}"?`)) return;

            await fetch(`/api/construcoes/${cons.id}`, { method: "DELETE" });
            carregarConstrucoes();
          });
        }

        // Abrir lightbox
        card.querySelector(".img-construcao").addEventListener("click", () => {
          abrirLightbox(cons.images || [imgSrc]);
        });

        listaConstrucoes.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar construções:", err);
    }
  }

  /* ======================
     LIGHTBOX
  ======================= */

  let imagens = [];
  let indiceAtual = 0;

  function abrirLightbox(lista) {
    imagens = lista;
    indiceAtual = 0;

    const overlay = document.createElement("div");
    overlay.className = "lightbox";

    overlay.innerHTML = `
      <span class="lightbox-fechar">&times;</span>
      <img class="lightbox-img">
      <button class="lightbox-prev">&#10094;</button>
      <button class="lightbox-next">&#10095;</button>
    `;

    document.body.appendChild(overlay);
    atualizarImagem();

    overlay.querySelector(".lightbox-fechar").onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    overlay.querySelector(".lightbox-prev").onclick = e => {
      e.stopPropagation();
      indiceAtual = (indiceAtual - 1 + imagens.length) % imagens.length;
      atualizarImagem();
    };

    overlay.querySelector(".lightbox-next").onclick = e => {
      e.stopPropagation();
      indiceAtual = (indiceAtual + 1) % imagens.length;
      atualizarImagem();
    };

    document.addEventListener("keydown", escHandler);

    function escHandler(e) {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
      }
    }

    function atualizarImagem() {
      overlay.querySelector(".lightbox-img").src = imagens[indiceAtual];
    }
  }
});
