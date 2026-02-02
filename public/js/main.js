function abrirDetalhes() {
  window.location.href = "detalhes.html";
}

const role = localStorage.getItem("role");
const meuAdmin = document.getElementById("meuAdmin");

if (meuAdmin && role !== "admin") {
  meuAdmin.style.display = "none";
}
