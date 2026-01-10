document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-construcao");
  form.addEventListener("submit", adicionar);

  carregarConstrucoes();
});

// Função para adicionar construção
async function adicionar(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  try {
    const res = await fetch("/api/construcoes", {
      method: "POST",
      body: data
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.error || "Erro ao adicionar construção");

    alert("Construção adicionada com sucesso!");
    form.reset();
    carregarConstrucoes();
  } catch (err) {
    console.error("Erro ao adicionar construção:", err);
    alert("Erro ao adicionar construção: " + err.message);
  }
}

// Função para carregar construções no admin
async function carregarConstrucoes() {
  const div = document.getElementById("lista-admin");
  div.innerHTML = "";

  try {
    const res = await fetch("/api/construcoes");
    const construcoes = await res.json();

    construcoes.forEach(c => {
      const el = document.createElement("div");
      el.style.marginBottom = "20px";

      // Exibir todas as imagens
      const imgsHTML = c.images.map(i => `<img src="${i}" style="height:80px; margin-right:5px;">`).join("");

      el.innerHTML = `
        <strong>${c.title}</strong>
        <div style="margin:5px 0">${imgsHTML}</div>
        <button onclick="apagar(${c.id})">Apagar</button>
      `;

      div.appendChild(el);
    });
  } catch (err) {
    console.error("Erro ao carregar construções:", err);
  }
}

// Função apagar construção
async function apagar(id) {
  if (!confirm("Deseja realmente apagar esta construção?")) return;

  try {
    const res = await fetch(`/api/construcoes/${id}`, { method: "DELETE" });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || "Erro ao apagar construção");

    carregarConstrucoes();
  } catch (err) {
    console.error("Erro ao apagar construção:", err);
    alert("Erro ao apagar construção: " + err.message);
  }
}
