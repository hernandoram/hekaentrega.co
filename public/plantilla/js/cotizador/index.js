import { cotizadorApiClassIdentifier } from "./constantes.js";
import { cotizar } from "./cotizar.js";
import { llenarBodegasCotizador, llenarProductos } from "./plantillas.js";

const btnCotizarGlobal = $(".cotizador-button");
btnCotizarGlobal.on("click", cotizar);
btnCotizarGlobal.addClass(cotizadorApiClassIdentifier);

const controlTipoEnvio = $("#tipo_envio-cotizador");
const controlValorRecaudo = $("#recaudo-cotizador");

export function iniciarOpcionesCotizador() {
    llenarBodegasCotizador();
    llenarProductos();

    if(btnCotizarGlobal.hasClass(cotizadorApiClassIdentifier)) {
        $("#cotizador .d-cotizador-api").removeClass("d-none");
        controlValorRecaudo.attr("required", true);
    }
}

controlTipoEnvio.on("change", e => {
    console.log(e);
    const {target} = e;

    if(target.value === PAGO_CONTRAENTREGA) {
        controlValorRecaudo.parent().show("fast");
        controlValorRecaudo.attr("required", true);
    } else {
        controlValorRecaudo.parent().hide("fast");
        controlValorRecaudo.removeAttr("required");
    }
});