import { controls, cotizadorApiClassIdentifier } from "./constantes.js";
import { cotizar } from "./cotizar.js";
import { llenarBodegasCotizador, llenarProductos } from "./plantillas.js";

const btnCotizarGlobal = controls.btnCotizarGlobal;
btnCotizarGlobal.on("click", cotizar);
btnCotizarGlobal.addClass(cotizadorApiClassIdentifier);

export function iniciarOpcionesCotizador() {
    llenarBodegasCotizador();
    llenarProductos();

    if(btnCotizarGlobal.hasClass(cotizadorApiClassIdentifier)) {
        $("#cotizador .d-cotizador-api").removeClass("d-none");
        controls.valorRecaudo.attr("required", true);
    }
}

controls.tipoEnvio.on("change", e => {
    const {target} = e;

    if(target.value === PAGO_CONTRAENTREGA) {
        controls.valorRecaudo.parent().show("fast");
        controls.valorRecaudo.attr("required", true);
    } else {
        controls.valorRecaudo.parent().hide("fast");
        controls.valorRecaudo.removeAttr("required");
        controls.sumaEnvio.prop("checked", false);
    }
});