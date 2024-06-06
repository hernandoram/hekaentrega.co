import { cotizar } from "./cotizar.js";
import { llenarBodegasCotizador, llenarProductos } from "./plantillas.js";

const btnCotizarGlobal = $(".cotizador-button");
btnCotizarGlobal.on("click", cotizar);

export function iniciarOpcionesCotizador() {
    llenarBodegasCotizador();
    llenarProductos();
    $("#cotizador .form-control-user").removeClass("form-control-user");
}