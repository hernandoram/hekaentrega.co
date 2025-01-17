import { loadStats } from '/js/usuarios.js'
loadStats.addEventListener("click", () => {
  console.warn("cargando stats...");
  setTimeout(() => {
    console.log("5 segundos han pasado");
    //  loader.classList.add("d-none");
    statsGlobales.classList.remove("d-none");
  }, 5000);
  console.warn(statsGlobales);
});
