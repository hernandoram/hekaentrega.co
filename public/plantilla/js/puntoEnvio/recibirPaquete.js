import { v1 } from "../config/api.js";
import { TranslatorFromApi } from "../cotizador/translator.js";
import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { estadoRecibido, estadosRecepcion } from "./constantes.js";
import { actualizarEstadoEnvioHeka, dataValueSelectedFromInput, crearPedidoEnvios } from "./crearPedido.js";
import TablaEnvios from "./tablaEnvios.js";
import { bodegasEl, diceContenerEl, oficinaDestinoEl } from "./views.js";

const principalHash = "#flexii_guia";
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

const idElement = "reader-flexii_guia";
const contenedorAnotaciones = $("#anotaciones-flexii_guia");
const btnActivador = $("#activador_scanner-flexii_guia");
const btnActivadorFiles = $("#activador_files-flexii_guia");
const btnActivadorLabel = $("#activador_label-flexii_guia");
const inputIdEnvio = $("#id_envio-flexii_guia");
const fileInput = $("#scanner_files-flexii_guia");
const switchModo = $("#switch_modo-flexii_guia");
const contenedorCotizador = $("#contenedor_cotizador-flexii_guia");
const contenederReceptor = $("#recibidor_envio-flexii_guia");
const principalTitle = $("#principal_title-flexii_guia");

// Esperamos que se carguen todo los datos necesarios de usuario Para realizar una primera lectura de información directamente desde la url
ControlUsuario.hasLoaded
.then(() => {
    const url = new URL(location);
    const id = url.searchParams.get(scannerIdentifier) // dónde debería venir el id de la guía
    const isCurrentHash = url.hash === principalHash;

    // Se va a invocar la función, siempre que exista un id y el hash actual corresponda con la vista que le compete a la recepción de guías
    if(id && isCurrentHash) {
        // Se invoca la función encargada de capturar el envío
        capturarEnvio(id)
        .then((res) => {
            url.searchParams.delete(scannerIdentifier);
            history.replaceState(null, null, url);
            Swal.fire(res);
        });
    }

    if(isCurrentHash) obtenerGuiasEnEsperaPunto();

});

// TODO: Añadir el actualizador de estado a cada uno de los eventos respectivos: Recibir el paquete, generar Relación, Generar Pedido

btnActivador.on("click", activadorPrincipal);
btnActivadorFiles.on("click", () => fileInput.click());
btnActivadorLabel.on("change", activarInsercionManual);
fileInput.on("change", leerImagenQr);
switchModo.on("change", cambiarModo)

const anotaciones = new AnotacionesPagos(contenedorAnotaciones);
const tablaPendientes = new TablaEnvios("#contenedor_tabla-flexii_guia");

function cambiarModo(e) {
    const {target} = e;
    const ischecked = target.checked; // Habilitado para generar los pedidos

    if(ischecked) {
        contenederReceptor.hide('fast');
        contenedorCotizador.show('fast');
        tablaPendientes.filter(estadosRecepcion.neutro);
        principalTitle.text("Genera la guía en tu Punto");
    } else {
        principalTitle.text("Receptor de pedidos");
        contenederReceptor.show('fast');
        contenedorCotizador.hide('fast');
        tablaPendientes.filter(estadosRecepcion.recibido);
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    const url = new URL(decodedText);
    const id = url.searchParams.get(scannerIdentifier);
    
    if(id) {
        await stopScanning();
        
        Cargador.fire({
            text: "Procesando información, por favor espere."
        });

        await capturarEnvio(id);

        startScanning();
    }
}

const html5QrCode = new Html5Qrcode(idElement);
function stopScanning() {
    return html5QrCode.stop().then(() => {
        btnActivador.text(textsButton.reanudar);
    });
}

function startScanning() {
    html5QrCode.start({facingMode: "environment"}, config, onScanSuccess)
    .then(() => {
        btnActivador.text(textsButton.detener);
    });
}

async function activadorPrincipal(e) {
    anotaciones.reset();
    if(btnActivadorLabel.is(":checked")) {
        const l = new ChangeElementContenWhileLoading(e.target);
        l.init();
        const inputValue = inputIdEnvio.val().trim();
        
        if(!inputValue) return l.end();

        let id = inputValue;
        if(inputValue.length < 12) { // Significa que probablemente la información insertada fue un número de guía y no el id del envío
            const idEncontrado = await db.collection("envios")
            .where("numeroGuia", "==", inputValue)
            .get().then(q => q.size ? q.docs[0].id : null);

            console.log("idEncontrado: ", idEncontrado);

            if(idEncontrado) id = idEncontrado;
        }

        await capturarEnvio(id)
        .then(res => Swal.fire(res));

        l.end();

    } else if(html5QrCode.isScanning) {
        stopScanning();
    } else {
        startScanning();
    }
}

function activarInsercionManual(e) {
    if(html5QrCode.isScanning) stopScanning();

    if(e.target.checked) {
        inputIdEnvio.show("fast");
        btnActivador.text(textsButton.validar);
    } else {
        inputIdEnvio.hide("fast");
        btnActivador.text(textsButton.reanudar);
    }
}

async function leerImagenQr(e) {
    const files = e.target.files;
    if(files.length === 0) return;

    if(html5QrCode.isScanning) await stopScanning();

    anotaciones.reset();
    anotaciones.setContent();

    for(let file of files) {
        const responseAccanner = await html5QrCode.scanFile(file, true)
        .then(value => {
            const url = new URL(value);
            const id = url.searchParams.get(scannerIdentifier);

            if(!id) return {
                icon: "error",
                text: "Por favor ingrese un QR válido"
            }

            return capturarEnvio(id);
        })
        .catch(err => ({icon: "error", text: `Error al scanear ${file.name}: ${err}`}));

        if(responseAccanner.icon === "error") {
            anotaciones.addError(responseAccanner.text);
        } else {
            anotaciones.addError(responseAccanner.text, {color: "success"});
        }

    }

    anotaciones.addError("Proceso Finalizado", {color: "success"})
}

async function capturarEnvio(id_envio) {
    const ref = db.collection("envios").doc(id_envio);

    const envio = await ref.get().then(d => d.exists ? d.data() : false);

    if(!envio) {
        return {
            icon: "error",
            text: "El envío con el que se quiere conectar no existe en la base de datos.",
        };
    }

    if(envio.id_punto === user_id) {
        return {
            icon: "success",
            text: "Este envío ya está registrada en tu punto",
        };
    }

    if(envio.id_punto && envio.id_punto !== user_id) {
        return {
            icon: "success",
            text: "Este envío ya está registrada en otro punto",
        };
    }

    if(tablaPendientes.filtrador === estadosRecepcion.recibido) {
        const primeraGuia = tablaPendientes.filtradas[0];
        if(primeraGuia && primeraGuia.centro_de_costo !== envio.centro_de_costo) {
            return {
                icon: "error",
                text: "Actualmente está intentando capturar una guía que epertenece a un usuario diferente, si ya ha terminado con el usuario anterior, valide los envíos en pantalla e intente nuevamente."
            }
        }
    }

    await ref.update({
        id_punto: user_id,
        estado_recepcion: estadosRecepcion.recibido
    });

    await actualizarEstadoEnvioHeka(id_envio, estadoRecibido);

    obtenerGuiasEnEsperaPunto();

    return {
        icon: "success",
        text: "Envío registrada con éxito",
    };
}

async function obtenerGuiasEnEsperaPunto() {
    tablaPendientes.reloadData()
    .then(() => {
        const estadoBase = switchModo.is(":checked") ? estadosRecepcion.neutro : estadosRecepcion.recibido;
        tablaPendientes.filter(tablaPendientes.filtrador ?? estadoBase);
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
        transportElement.onclick = () => crearPedidoEnvios(cotizacionTraducida, tablaPendientes.dataSelected)
            .then(() => obtenerGuiasEnEsperaPunto());

        containerResponse.append(transportElement);
    });
}

