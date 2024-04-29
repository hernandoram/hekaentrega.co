const revisarNovedadesUser = document.getElementById(
  "btn-revisar-novedades-user"
);
const bt_limpiar_novedades_user = document.getElementById(
  "btn-vaciar-consulta-user"
);

revisarNovedadesUser.addEventListener("click", (e) => {
  e.preventDefault();
  const inputGuia = $("#filtrado-novedades-guias").val();
  if (inputGuia) {
    revisarMovimientosGuiaIndividualUser(inputGuia);
  } else {
    revisarMovimientosGuias(false);
  }
});

bt_limpiar_novedades_user.addEventListener("click", (e) => {
  e.preventDefault();
  novedadesExcelData = [];
  $("#visor_novedades").html("");
});
