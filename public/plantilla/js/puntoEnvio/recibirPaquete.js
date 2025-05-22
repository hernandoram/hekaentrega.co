import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { estadoRecibido, estadosRecepcion, idReceptorFlexiiGuia } from "./constantes.js";
import { actualizarEstadoEnvioHeka } from "./crearPedido.js";
import TablaEnvios from "./tablaEnvios.js";

const principalId = idReceptorFlexiiGuia;
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

const anotaciones = new AnotacionesPagos(contenedorAnotaciones);
const tablaRecepcionPaquetes = new TablaEnvios("#contenedor_tabla-" + principalId);
tablaRecepcionPaquetes.searchInFilter = [estadosRecepcion.recibido]; // Para que solo se hagan búsquedas de los envíos recibidos
tablaRecepcionPaquetes.filtrador = estadosRecepcion.recibido; // Ajustamos el filtrador para que nos active las funcionalidades que corresponde a recibir un envío


btnActivador.on("click", activadorPrincipal);
btnActivadorFiles.on("click", () => fileInput.click());
btnActivadorLabel.on("change", activarInsercionManual);
fileInput.on("change", leerImagenQr);

async function onScanSuccess(decodedText, decodedResult) {
    const url = new URL(decodedText);
    const id = url.searchParams.get(scannerIdentifier);
    
    if(id) {
        await stopScanning();
        
        Cargador.fire({
            text: "Procesando información, por favor espere."
        });

        await capturarEnvio(id)
        .then(res => Swal.fire(res));

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

    if(tablaRecepcionPaquetes.filtrador === estadosRecepcion.recibido) {
        const primeraGuia = tablaRecepcionPaquetes.filtradas[0];
        if(primeraGuia && primeraGuia.centro_de_costo !== envio.centro_de_costo) {
            return {
                icon: "error",
                text: "Actualmente está intentando capturar una guía que epertenece a un usuario diferente, si ya ha terminado con el usuario anterior, valide los envíos en pantalla e intente nuevamente."
            }
        }
    }

    await ref.update({
        id_punto: user_id
    });

    await actualizarEstadoEnvioHeka(id_envio, estadoRecibido);

    tablaRecepcionPaquetes.reloadData();

    return {
        icon: "success",
        text: "Envío registrado con éxito",
    };
}

export {tablaRecepcionPaquetes, capturarEnvio, scannerIdentifier}