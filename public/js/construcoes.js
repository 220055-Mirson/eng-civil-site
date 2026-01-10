document.addEventListener("DOMContentLoaded", () => {
  const listaConstrucoes = document.getElementById("lista-construcoes");
  const btnAdmin = document.getElementById("btn-admin");

  const usuario = localStorage.getItem("usuarioLogado");
  const role = localStorage.getItem("role");

  // Mostrar botão admin apenas se for admin
  if (usuario && role === "admin") {
    btnAdmin.style.display = "inline-block";
  } else {
    btnAdmin.style.display = "none";
  }

  // ---------- MODAL GALERIA ----------
  let imagensAtuais = [];
  let indiceAtual = 0;

  const modal = document.createElement("div");
  modal.className = "modal-galeria";
  modal.innerHTML = `
    <span class="modal-fechar">&times;</span>
    <span class="modal-seta esq">&#10094;</span>
    <img id="modal-img">
    <div class="modal-contador"></div>
    <span class="modal-seta dir">&#10095;</span>
  `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector("#modal-img");
  const btnFechar = modal.querySelector(".modal-fechar");
  const setaEsq = modal.querySelector(".modal-seta.esq");
  const setaDir = modal.querySelector(".modal-seta.dir");
  const contador = modal.querySelector(".modal-contador");


  function atualizarContador() {
  contador.innerText = `${indiceAtual + 1} / ${imagensAtuais.length}`;
}

  function abrirModal(imagens) {
    imagensAtuais = imagens;
    indiceAtual = 0;
    modalImg.src = imagensAtuais[indiceAtual];
    atualizarContador();
    modal.classList.add("ativo");
  }

  function fecharModal() {

    modal.classList.remove("ativo");
  }

  function proxima() {
    indiceAtual = (indiceAtual + 1) % imagensAtuais.length;
    modalImg.src = imagensAtuais[indiceAtual];
    atualizarContador();
  }

  function anterior() {
    indiceAtual = (indiceAtual - 1 + imagensAtuais.length) % imagensAtuais.length;
    modalImg.src = imagensAtuais[indiceAtual];
    atualizarContador();
  }

  btnFechar.onclick = fecharModal;
  setaDir.onclick = proxima;
  setaEsq.onclick = anterior;

  modal.addEventListener("click", e => {
    if (e.target === modal) fecharModal();
  });

  document.addEventListener("keydown", e => {
    if (!modal.classList.contains("ativo")) return;
    if (e.key === "ArrowRight") proxima();
    if (e.key === "ArrowLeft") anterior();
    if (e.key === "Escape") fecharModal();
  });

  // ---------- CARREGAR CONSTRUÇÕES ----------
  carregarConstrucoes();

  async function carregarConstrucoes() {
    listaConstrucoes.innerHTML = "";

    try {
      const res = await fetch("/api/construcoes");
      const construcoes = await res.json();

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
          card.querySelector(".btn-apagar").addEventListener("click", async (e) => {
            e.stopPropagation(); // ⛔ evita abrir modal
            if (!confirm(`Deseja realmente apagar "${cons.title}"?`)) return;

            try {
              const res = await fetch(`/api/construcoes/${cons.id}`, { method: "DELETE" });

// Checa se o status não é 2xx
if (!res.ok) {
  // tenta ler JSON
  let errMsg = "Erro ao apagar construção";
  try {
    const data = await res.json();
    if (data.error) errMsg = data.error;
  } catch {}
  throw new Error(errMsg);
}

// Se chegou aqui, foi apagado com sucesso
alert("Construção apagada com sucesso!");
carregarConstrucoes();

            } catch (err) {
              console.error("Erro ao apagar construção:", err);
              alert("Erro ao apagar construção: " + err.message);
            }
          });
        }

        // 👉 ABRIR MODAL AO CLICAR NO CARD
        card.addEventListener("click", () => {
          if (cons.images && cons.images.length > 0) {
            abrirModal(cons.images);
          }
        });

        listaConstrucoes.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar construções:", err);
    }
  }
});
