import inicio from "./homeView/main.js";
import agregarBodega from "./bodegas/bodegas.js";
import { iniciarOpcionesCotizador, llenarBodegasCotizador, llenarProductos } from "./cotizador/index.js";
import { registroDesdePunto } from "./auth/register.js";
import { agregarObjetoDeEnvio } from "./auth/handlers.js";

if(estado_prueba) {
    iniciarOpcionesCotizador();
    llenarBodegasCotizador();
    llenarProductos();
}

inicio();

$(".agregar-bodega").click(agregarBodega);
$("#register-form").on("submit", registroDesdePunto);

$("#register-add-objetos_envio").click(agregarObjetoDeEnvio);
$("#register-objetos_envio").on("keypress", agregarObjetoDeEnvio);