import { v1 } from "../config/api.js";
import { TranslatorFromApi } from "../cotizador/translator.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { dataValueSelectedFromInput, seleccionarTransportadora } from "./crearPedido.js";
import TablaEnvios from "./tablaEnvios.js";
import { bodegasEl, diceContenerEl, oficinaDestinoEl } from "./views.js";

const estadosRecepcion = {
    recibido: "RECIBIDO",
    empacado: "EMPACADO"
}

const config = { 
    fps: 2, qrbox: {width: 250, height: 250}
    // rememberLastUsedCamera: false,
}

// TODO: Un "oninit" para que se lean los parámetros de la Url (para cuando se escanee desde el celular y sea redirigido)
// TODO: Una forma de subir fotos que automáticamente escanee los Qr y coloque las guías en la lista de la tabla

const idElement = "reader-flexii_guia";
const btnActivador = $("#activador_scanner-flexii_guia");

btnActivador.on("click", activationScanner);
const tablaPendientes = new TablaEnvios("#contenedor_tabla-fleii_guia");

function onScanSuccess(decodedText, decodedResult) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    stopScanning();
}

const html5QrCode = new Html5Qrcode(idElement);
function stopScanning() {
    html5QrCode.stop().then(() => {
        btnActivador.text("Reanudar escáner");
    });
}

function startScanning() {
    html5QrCode.start({facingMode: "environment"}, config, onScanSuccess)
    .then(() => {
        btnActivador.text("Detener escáner");
    });
}

function activationScanner() {
    if(html5QrCode.isScanning) {
        stopScanning();
    } else {
        startScanning();
    }
}


async function capturarEnvio(id_envio) {
    const ref = db.collection("envios").doc(id_envio);

    const envio = await ref.get().then(d => d.exists ? d.data() : false);

    if(!envio) {
        return Swal.fire({
            icon: "error",
            text: "El envío con el que se quiere conectar no existe en la base de datos.",
        }); 
    }

    if(envio.id_punto === user_id) {
        return Swal.fire({
            icon: "success",
            text: "Este envío ya está registrada en tu punto",
        });
    }

    if(envio.id_punto && envio.id_punto !== user_id) {
        return Swal.fire({
            icon: "success",
            text: "Este envío ya está registrada en otro punto",
        });
    }

    await ref.update({
        id_punto: user_id,
        estado_recepcion: estadosRecepcion.recibido
    });

    return Swal.fire({
        icon: "success",
        text: "Envío registrada con éxito",
    });
}

obtenerGuiasEnEsperaPunto();
async function obtenerGuiasEnEsperaPunto() {
    db.collection("envios")
    .where("id_punto", "==", user_id)
    .where("estado_recepcion", "==", estadosRecepcion.recibido)
    .get()
    .then(q => {
        q.forEach(d => {
            const data = d.data();
            data.id = d.id;
            tablaPendientes.add(data);
        })
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
obtenerUsuariosFrecuentes().then((info) => renderOptionsSelectize(oficinaDestinoEl, info));
cargarObjetosFrecuentes().then((info) => renderOptionsSelectize(diceContenerEl, info));



function renderOptionsSelectize(element, options) {
    if (!options || !options.length) return;

    
    const selectorSelectize = element[0].selectize;

    selectorSelectize.clearOptions();

    options.forEach(data => selectorSelectize.addOption(data));
}
async function obtenerUsuariosFrecuentes() {
    const referenciaUsuariosFrecuentes = usuarioAltDoc().collection(
        "plantillasUsuariosFrecuentes"
    );
    
    const opciones = [];
    
    await referenciaUsuariosFrecuentes
    // .where("ciudad", "==", ciudad.value)
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


$("#cotizador-flexii_guia").on("submit", cotizarConjunto);
const containerResponse = $("#respuesta-flexii_guia");
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

    try {
        containerResponse.html("");
        const consulta = Object.fromEntries(formData.entries());
        const cotizacion = await cotizarApi(consulta);

        mostrarListaTransportadoras(consulta, cotizacion.response);
    } catch (e) {
        console.error("Error Al cotizar: ", e);
    } finally {
        l.end();
    }

}

// TODO: A penas se termine la integración del nuevo cotizador, traer la función que venga del cotizador, en vez de generar aquí una copia
async function cotizarApi(request) {
    const data = await fetch(v1.quoter, {
        method: "POST",
        headers: {
            "Content-Type": "Application/json"
        },
        body: JSON.stringify(request)
    })
    .then(d => d.json());

    return data;
}


function mostrarListaTransportadoras(consultaCotizacion, respuestaCotizacion) {
    respuestaCotizacion.forEach((r, i) => {
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
        transportElement.onclick = (e) => seleccionarTransportadora(e, cotizacionTraducida);

        containerResponse.append(transportElement);
    });
}


