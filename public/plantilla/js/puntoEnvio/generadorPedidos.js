import { cotizarApi } from "../cotizador/cotizadorApi.js";
import { TranslatorFromApi } from "../cotizador/translator.js";
import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { estadoRecibido, estadosRecepcion, idFlexiiGuia } from "./constantes.js";
import { actualizarEstadoEnvioHeka, dataValueSelectedFromInput, crearPedidoEnvios } from "./crearPedido.js";
import TablaEnvios from "./tablaEnvios.js";
import { bodegasEl, diceContenerEl, oficinaDestinoEl, containerQuoterResponse } from "./views.js";

const principalId = idFlexiiGuia;
const principalHash = "#" + principalId;
const scannerIdentifier = "id";


const config = { 
    fps: 2, qrbox: {width: 250, height: 250}
    // rememberLastUsedCamera: false,
}

const textsButton = {
    reanudar: "Reanudar escáner",
    detener: "Detener escáner",
    validar: "Validar envío"
}

const idElement = "reader-" + principalId;
const contenedorAnotaciones = $("#anotaciones-" + principalId);
const btnActivador = $("#activador_scanner-" + principalId);
const btnActivadorFiles = $("#activador_files-" + principalId);
const btnActivadorLabel = $("#activador_label-" + principalId);
const inputIdEnvio = $("#id_envio-" + principalId);
const fileInput = $("#scanner_files-" + principalId);
const switchModo = $("#switch_modo-" + principalId);
const contenedorCotizador = $("#contenedor_cotizador-" + principalId);
const contenederReceptor = $("#receptor-" + principalId);
const principalTitle = $("#principal_title-" + principalId);

const anotaciones = new AnotacionesPagos(contenedorAnotaciones);
const tablaGeneradorPedidos = new TablaEnvios("#contenedor_tabla-" + principalId);


async function obtenerGuiasEnEsperaPunto() {
    tablaGeneradorPedidos.reloadData()
    .then(() => {
    });
}


const configSelectize = {
    options: [],
    labelField: "nombre", // el label de lo que se le muestra al usuario por cada opción
    valueField: "id", // el valor que será guardado, una vez el lusuario seleccione dicha opción
    searchField: ["nombre"] // El criterio de filtrado para el input
};

bodegasEl.selectize(configSelectize);
oficinaDestinoEl.selectize(configSelectize);
diceContenerEl.selectize(configSelectize)

bodegasWtch.watchFromLast((info) => renderOptionsSelectize(bodegasEl, info));
tablaGeneradorPedidos.selectionCityChange.watch(val => obtenerUsuariosFrecuentes(val).then((info) => renderOptionsSelectize(oficinaDestinoEl, info)));
cargarObjetosFrecuentes().then((info) => renderOptionsSelectize(diceContenerEl, info));



function renderOptionsSelectize(element, options) {
    if (!options) return;

    
    const selectorSelectize = element[0].selectize;

    selectorSelectize.clearOptions();

    options.forEach(data => selectorSelectize.addOption(data));
}

async function obtenerUsuariosFrecuentes(daneCiudad) {
    const referenciaUsuariosFrecuentes = usuarioAltDoc().collection(
        "plantillasUsuariosFrecuentes"
    );
    
    const opciones = [];
    
    await referenciaUsuariosFrecuentes
    .where("daneCiudad", "==", daneCiudad)
    .get()
    .then((querySnapshot) => {
        querySnapshot.forEach((document) => {
            const data = document.data();
            data.id = document.id;
        
            opciones.push(data);
        });
    });

    return opciones;
}


$("#cotizador-" + principalId).on("submit", cotizarConjunto);
async function cotizarConjunto(e) {
    e.preventDefault();
    const {target} = e;
    const formData = new FormData(target);
    const l = new ChangeElementContenWhileLoading($("[type='submit']", target));
    l.init();

    formData.set("typePayment", 3); // Este tipo de envíos siempre serán envíos convencionales
    formData.set("collectionValue", 0); // Debido a que será un envío convencional, no se toma en cuenta ele valor de recaudo
    formData.set("withshippingCost", false); // No aplica para este tipo de envíos;
    formData.set("daneCityOrigin", dataValueSelectedFromInput(bodegasEl).dane_ciudad); // Seteamos a mano la ciuda origen/detino debido a que el value corresponde al id del documento de base de datos
    formData.set("daneCityDestination", dataValueSelectedFromInput(oficinaDestinoEl).daneCiudad); // Seteamos a mano la ciuda origen/detino debido a que el value corresponde al id del documento de base de datos

    const dataTypes = {
        weight: "number",
        declaredValue: "number",
        width: "number",
        long: "number",
        height: "number",
        typePayment: "number",
        collectionValue: "number",
        withshippingCost: "boolean"
    }

    try {
        containerQuoterResponse.html("");
        const consulta = Object.fromEntries(formData.entries());

        // Para convertir los datos y enviarlos correctamente al back (numéricos y boleanos)
        Object.keys(dataTypes).forEach(key => {
            const convertor = dataTypes[key];
            switch(convertor) {
                case "number":
                    consulta[key] = Number(consulta[key]);
                break;

                case "boolean":
                    consulta[key] = consulta[key] === "false" ? false : !!consulta[key];
                break;
            }
        });

        const cotizacion = await cotizarApi(consulta);

        mostrarListaTransportadoras(consulta, cotizacion.response);
    } catch (e) {
        console.error("Error Al cotizar: ", e);
    } finally {
        l.end();
    }

}


function mostrarListaTransportadoras(consultaCotizacion, respuestaCotizacion) {
    respuestaCotizacion.filter(r => !r.message).forEach((r, i) => {
        const {entity, total} = r;
        const transp = entity.toUpperCase();
        const configTransp = transportadoras[transp];
        const pathLogo = configTransp.logoPath;
        
        const cotizacionTraducida = new TranslatorFromApi(consultaCotizacion, r); 
        const transportElement = document.createElement("li");
        transportElement.classList.add("list-group-item", "list-group-item-action");
        transportElement.style.cursor = "pointer";

        const innerHtml = `
            <img 
                src="${pathLogo}" 
                style="max-height:100px; max-width:120px"
                alt="logo-${entity}"
            />
            <h5>Costo de Envío: <b>$${convertirMiles( total )}</b></h5>
        `;

        transportElement.innerHTML = innerHtml;
        transportElement.onclick = () => crearPedidoEnvios(cotizacionTraducida, tablaGeneradorPedidos.dataSelected)
            .then(() => {
                console.log("Se está recargando la info"); 
                tablaGeneradorPedidos.reloadData();
            });

        containerQuoterResponse.append(transportElement);
    });
}


export {tablaGeneradorPedidos};
