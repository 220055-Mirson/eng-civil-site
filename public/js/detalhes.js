document.addEventListener("DOMContentLoaded", () => {

  // 👉 pegar ID do projeto da URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  // 👉 usuário vindo do login
  const usuarioLogado = localStorage.getItem("usuarioLogado");

  const listaComentarios = document.getElementById("lista-comentarios");
  const formComentario = document.getElementById("form-comentario");

  if (!projectId) {
    console.error("ID do projeto não encontrado na URL");
    return;
  }

  // ---------------- CARREGAR DETALHES ----------------
  async function carregarDetalhes() {
    try {
      const res = await fetch("/api/projetos");
      if (!res.ok) throw new Error("Erro ao buscar projetos");

      const projetos = await res.json();
      const proj = projetos.find(p => p.id == projectId);

      if (!proj) {
        console.error("Projeto não encontrado");
        return;
      }

      document.getElementById("titulo-projeto").innerText = proj.title;
      document.getElementById("descricao-projeto").innerText = proj.description;

      // galeria
      const galeria = document.getElementById("galeria");
      galeria.innerHTML = "";

      proj.images.forEach(imgPath => {
        const img = document.createElement("img");
        img.src = imgPath;
        img.alt = proj.title;
        img.style.cursor = "pointer";
        galeria.appendChild(img);
      });

      // modal
      const modal = document.getElementById("modal-img");
      const modalImg = document.getElementById("imgFull");
      const spanClose = modal.querySelector(".close");

      galeria.querySelectorAll("img").forEach(img => {
        img.addEventListener("click", () => {
          modal.style.display = "block";
          modalImg.src = img.src;
        });
      });

      spanClose.addEventListener("click", () => {
        modal.style.display = "none";
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });

      carregarComentarios();

    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
    }
  }

  // ---------------- CARREGAR COMENTÁRIOS ----------------
  async function carregarComentarios() {
  try {
    const res = await fetch(`/api/comments/${projectId}`);

    // 👇 PROTEÇÃO CRÍTICA
    const contentType = res.headers.get("content-type");
    if (!res.ok || !contentType || !contentType.includes("application/json")) {
      throw new Error("Resposta inválida (não JSON)");
    }

    const comentarios = await res.json();
    listaComentarios.innerHTML = "";

    if (comentarios.length === 0) {
      listaComentarios.innerHTML = "<p>Sem comentários ainda.</p>";
      return;
    }

    comentarios.forEach(c => {
      const div = document.createElement("div");
      div.className = "comentario-card";
      div.innerHTML = `
        <h4>${c.user_name}</h4>
        <p>${c.text}</p>
      `;
      listaComentarios.appendChild(div);
    });

  } catch (err) {
    console.error("Erro ao carregar comentários:", err);
    listaComentarios.innerHTML =
      "<p>Não foi possível carregar os comentários.</p>";
  }
}


  // ---------------- ENVIAR COMENTÁRIO ----------------
  if (formComentario) {
    if (!usuarioLogado) {
      formComentario.style.display = "none";
      listaComentarios.insertAdjacentHTML(
        "beforeend",
        "<p><em>Faça login para comentar.</em></p>"
      );
    } else {
      formComentario.addEventListener("submit", async (e) => {
        e.preventDefault();

        const text = formComentario.texto.value.trim();
        if (!text) {
          alert("Digite um comentário.");
          return;
        }

        try {
          const res = await fetch(`/api/comments/${projectId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user: usuarioLogado,
              text: text
            })
          });

          if (!res.ok) throw new Error("Erro ao enviar comentário");

          formComentario.reset();
          carregarComentarios();

        } catch (err) {
          console.error("Erro ao enviar comentário:", err);
          alert("Erro ao enviar comentário.");
        }
      });
    }
  }

  

  // ---------------- INIT ----------------
  carregarDetalhes();

});
