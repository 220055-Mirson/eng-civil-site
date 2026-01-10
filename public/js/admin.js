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
      alert("Erro ao enviar projeto: " + err.message);
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
        let imgSrc = "/img/placeholder.png";
        if (proj.images && proj.images.length > 0) {
          imgSrc = proj.images[0];
        }

        card.innerHTML = `
          <img src="${imgSrc}" alt="Imagem do projeto">
          <h3>${proj.title}</h3>
          <p>${proj.description}</p>
          <div class="admin-actions">
            <button class="btn-apagar">Apagar</button>
          </div>
        `;

        // 👉 Apagar projeto (CORRIGIDO)
        card.querySelector(".btn-apagar").addEventListener("click", async () => {
          const confirmar = confirm(
            `Deseja realmente apagar o projeto "${proj.title}"?`
          );
          if (!confirmar) return;

          try {
            const res = await fetch(`/api/projetos/${proj.id}`, {
              method: "DELETE",
            });

            if (!res.ok) {
              throw new Error("Erro ao apagar projeto");
            }

            // remove o card da tela (sem recarregar tudo)
            card.remove();

          } catch (err) {
            console.error("Erro ao apagar projeto:", err);
            alert("Erro ao apagar projeto.");
          }
        });

        listaProjetos.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao listar projetos:", err);
    }
  }

  // Carregar projetos ao abrir a página
  carregarProjetos();
});
