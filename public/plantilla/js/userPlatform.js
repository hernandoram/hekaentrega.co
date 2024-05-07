import inicio from "./homeView/main.js";
import agregarBodega from "./bodegas/bodegas.js";
import "./historialGuias/main.js";
import { iniciarOpcionesCotizador } from "./cotizador/index.js";
import { registroDesdePunto } from "./auth/register.js";
import { agregarObjetoDeEnvio } from "./auth/handlers.js";

// if(estado_prueba) {
// }
// #region Funciones para habilitar configuraciones báses del cotizador
iniciarOpcionesCotizador();
// #endregion

inicio();

$(".agregar-bodega").click(agregarBodega);
$("#register-form").on("submit", registroDesdePunto);

$("#register-add-objetos_envio").click(agregarObjetoDeEnvio);
$("#register-objetos_envio").on("keypress", agregarObjetoDeEnvio);


x();
async function x() {
    const swalObj = {
        title: 'Continuar...',
        text: "Probando el Swal $" + convertirMiles(50000) + " al usuario  ¿Deseas continuar?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '¡Hágale! 👍',
        cancelButtonText: "¡No, me equivoqué!"
    }

    const comprobar = await Swal.fire(swalObj);

    console.log(comprobar);
    console.log("¿Se Debería detener? ", !comprobar.isConfirmed);
}