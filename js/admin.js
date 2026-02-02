document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-projeto");
  const listaProjetos = document.getElementById("lista-projetos");

  // Capturar submissão do formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form); // inclui arquivos

    try {
      const res = await fetch("/api/projetos", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar projeto");

      alert("Projeto adicionado com sucesso!");
      form.reset();
      carregarProjetos();
    } catch (err) {
      console.error("Erro ao enviar projeto:", err);
      alert("Erro ao enviar projetos: " + err.message);
    }
  });

  // Função para carregar projetos
  async function carregarProjetos() {
    listaProjetos.innerHTML = "";

    try {
      const res = await fetch("/api/projetos");
      const projetos = await res.json();

      projetos.forEach((proj) => {
        const card = document.createElement("div");
        card.classList.add("card");

        // Se houver imagens, pegar a primeira para exibir no card
        let imgSrc = "/img/placeholder.png"; // imagem padrão
        if (proj.images) {
          try {
            const imgs = JSON.parse(proj.images);
            if (imgs.length > 0) imgSrc = imgs[0];
          } catch (e) {
            console.warn("Erro ao ler imagens do projeto", e);
          }
        }

        card.innerHTML = `
          <img src="${imgSrc}" alt="Imagem do projeto">
          <h3>${proj.title}</h3>
          <p>${proj.description}</p>
          <div class="admin-actions">
            <button class="btn-editar">Editar</button>
            <button class="btn-apagar">Apagar</button>
          </div>
        `;
        listaProjetos.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao listar projetos:", err);
    }
  }

  // Carregar projetos ao abrir a página
  carregarProjetos();
});
