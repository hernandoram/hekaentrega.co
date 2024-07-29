const loadStats = document.getElementById("load-stats");
const statsGlobales = document.getElementById("stats-globales");
const loader= document.getElementById("loading-s");
let guias = [];

loadStats.addEventListener("click", () => {
  console.warn("cargando stats...");
  setTimeout(() => {
    console.log("5 segundos han pasado");
  //  loader.classList.add("d-none");
    alert("finaliza");
    statsGlobales.classList.remove("d-none");
  }, 5000);
  console.warn(statsGlobales);
});