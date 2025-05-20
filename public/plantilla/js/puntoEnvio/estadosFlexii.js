import { v0 } from "../config/api.js";
import { storage } from "../config/firebase.js";
import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import CreateModal from "../utils/modal.js";
import { estadosRecepcion, idScannerEstados } from "./constantes.js";
import { actualizarEstadoEnvioHeka } from "./crearPedido.js";
import TablaEnvios from "./tablaEnvios.js";
import { formActualizarEstado } from "./views.js";

const principalId = idScannerEstados;
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
const btnActualizarEstados = $("#actualizar_estados-" + principalId);
const btnActivadorFiles = $("#activador_files-" + principalId);
const btnActivadorLabel = $("#activador_label-" + principalId);
const inputIdEnvio = $("#id_envio-" + principalId);
const fileInput = $("#scanner_files-" + principalId);
const tablaEnvios = $("#contenedor_tabla-" + principalId);

btnActivador.on("click", activadorPrincipal);
btnActualizarEstados.on("click", abrirModalActuaizarEstadoMasivo);
btnActivadorFiles.on("click", () => fileInput.click());
btnActivadorLabel.on("change", activarInsercionManual);
fileInput.on("change", leerImagenQr);

const tabla = new TablaEnvios(tablaEnvios);
const anotaciones = new AnotacionesPagos(contenedorAnotaciones);

async function onScanSuccess(decodedText, decodedResult) {
    const url = new URL(decodedText);
    const id = url.searchParams.get(scannerIdentifier);
    
    if(id) {
        await stopScanning();

        await encolarEnvioParaActualizacionEstado(id);

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

        await encolarEnvioParaActualizacionEstado(id)

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

            return encolarEnvioParaActualizacionEstado(id);
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

async function encolarEnvioParaActualizacionEstado(id_envio) {
    Cargador.fire({
        text: "Procesando información, por favor espere."
    });
    
    const ref = db.collection("envios").doc(id_envio);

    const envio = await ref.get().then(d => {
        if(!d.exists) return null;

        const data = d.data();
        data.id = d.id;

        return data;
    });

    if(!envio) {
        return Swal.fire({
            icon: "error",
            text: "El envío con el que se quiere conectar no existe en la base de datos.",
        });
    }

    tabla.add(envio);

    Cargador.close();
}

function abrirModalActuaizarEstadoMasivo() {
    if(!tabla.table.data().length) return Swal.fire({
        icon: "error",
        text: "No existe ninguna guía en la tabla que actualizar"
    });

    const modal = new CreateModal({
        title: "Actualizar estado"
    });

    modal.init = formActualizarEstado;

    const form = $("form", modal.modal);
    opccionesFormularioEstados(form);

    modal.onSubmit = (e) => actualizarEstadoEnvios(e, form[0])
        .then(res => {
            if(res.error) {
                return Swal.fire({
                    icon: "error",
                    text: res.message
                })
            }

            Toast.fire({
                text: res.message,
                icon: "success"
            });
            modal.close();
        });

}

function abrirModalActuaizarEstado(envio) {
    const modal = new CreateModal({
        title: "Actualizar estado"
    });

    modal.init = formActualizarEstado;

    const form = $("form", modal.modal);
    opccionesFormularioEstados(form);

    modal.onSubmit = (e) => actualizarEstadoEnvioIndividual(e, form[0], envio)
        .then(res => {
            modal.res = res;
            modal.data = res.dataIn ?? null;
            if(res.error) {
                return Swal.fire({
                    icon: "error",
                    text: res.message
                })
            }

            Toast.fire({
                text: res.message,
                icon: "success"
            });
            modal.close();
        });

    return modal;

}

let listaEstadosHeka = [];

async function obtenerEstadosHeka() {
    return await fetch(v0.pathEstadosNotificacion)
    .then(d => d.json())
    .then(d => d.body)
    .catch(e => console.error(e));
}

async function opccionesFormularioEstados(form) {
    const referenciaEstados = db.collection("infoHeka").doc("novedadesMensajeria");

    if(!listaEstadosHeka.length) {
        const lista = await obtenerEstadosHeka();
    
        listaEstadosHeka = lista.filter(est => est.transportadora === "HEKA");
    }

    const inputEstados = $(`#estado-${idScannerEstados}`, form);
    const inputDescripcionEstado = $(`#descripcion-${idScannerEstados}`, form);
    const inputDescripcionExtraEstado = $(`#descripcion_extra-${idScannerEstados}`, form);
    const switchNovedad = $(`#switch_novedad-${idScannerEstados}`);
    const inputEvidencia = $(`#evidencia-${idScannerEstados}`);
    const inputTipo = $(`#tipo-${idScannerEstados}`);
    const descripcionPropertyName = inputDescripcionEstado.prop("name");

    const activateOptions = (options, input) => {
        input.html("");
        options.forEach(estado => {
            input.append(`<option value="${estado}">${estado}</option>`);
        });
    }

    const estados = new Set(listaEstadosHeka.map(est => est.estado));
    activateOptions(estados, inputEstados);

    const filtrarDescripciones = (value) => {
        const descripciones = listaEstadosHeka.filter(est => est.estado === value).map(est => est.descripcion).concat(["OTRO"]);
    
        activateOptions(descripciones, inputDescripcionEstado);
    }

    const activarOpcionesAdicionalesEstado = () => {
        const existOption = listaEstadosHeka.find(est => est.estado === inputEstados.val() && inputDescripcionEstado.val() === est.descripcion);
        if(existOption) {
            inputTipo.val(existOption.tipo ?? "");
            switchNovedad.prop("checked", existOption.esNovedad ?? false);
        }

        return existOption;
    }

    const descripcionEstadoParticular = (value) => {
        if(value === "OTRO") {
            inputDescripcionExtraEstado.show();
            inputDescripcionExtraEstado.prop("name", descripcionPropertyName);
            inputDescripcionEstado.prop("name", "");
            inputDescripcionExtraEstado.prop("required", true);
            inputDescripcionEstado.prop("required", false);
        } else {
            inputDescripcionExtraEstado.hide();
            inputDescripcionExtraEstado.prop("name", "");
            inputDescripcionEstado.prop("name", descripcionPropertyName);
            inputDescripcionExtraEstado.prop("required", false);
            inputDescripcionEstado.prop("required", true);
        }
    }


    filtrarDescripciones(inputEstados.val());
    activarOpcionesAdicionalesEstado();

    inputEstados.on("change", (e) => {
        const {value} = e.target;

        filtrarDescripciones(value);
        activarOpcionesAdicionalesEstado();
        descripcionEstadoParticular(inputDescripcionEstado.val());
    });

    inputDescripcionEstado.on("change", e => {
        const {value} = e.target;
        activarOpcionesAdicionalesEstado();
        descripcionEstadoParticular(value);
    });

    inputEvidencia.on("change", validarImagen);
}


async function guardarEvidencia(idEnvio, data) {
    const archivo = data.evidencia;

    if(!archivo || !archivo.size) return;

    const [nombre, tipo] = archivo.name.split(".");
    const nombrePila = data.estado + "_" + nombre;

    const referenceStorage = storage
    .ref()
    .child(`enviosHeka/${idEnvio}/${nombrePila}.${tipo}`);

    const existentData = await referenceStorage.getDownloadURL()
    .catch(() => null);

    console.log(existentData);
    let urlImage = existentData;
    if(!existentData) {
        const resultInfo = await referenceStorage
        .put(data.evidencia);
    
        urlImage = await resultInfo.ref.getDownloadURL();
    }

    data.urlEvidencia = urlImage // La ruta sobre la qu ese encontrará para mandarlo al back guardada el archivo
}

async function validarImagen(e) {
    const target = e.target;
    const file = target.files[0];
    const maxMb = 10;
    const longitudImagenPermitida = maxMb * 1024 * 1024; // 10 Megabytes
    const label = target.parentNode.querySelector("label");
    target.classList.remove("border-danger");

    if(file.size > longitudImagenPermitida) {
        target.classList.add("border-danger");
        target.value = "";
        label.innerHTML = "Imagen inválida";

        return verificador([target.id], true, `La imagen supera el límite permitido de "${maxMb}" MegaBytes`);
    }

    label.innerHTML = file.name;

}

function validacionActualizacionEstado(form) {
    const formData = new FormData(form);
    formData.append("reporter", user_id);
    formData.append("ubicacion", "");
    const data = Object.fromEntries(formData.entries());

    if(!data.estado || !data.descripcion) {
        verificador(["estado-"+principalId, "descripcion-"+principalId], null, "Este campo es obligatorio");
        l.end();
        return {
            error: true,
            message: "Por favor valide los campos obligatorios"
        }
    }

    verificador(); // Limpiamos cualquier verificación previa

    data.esNovedad = !!data.esNovedad;

    return data;
}

async function actualizarEstadoEnvios(e, form) {
    const l = new ChangeElementContenWhileLoading(e.target);
    l.init();
    anotaciones.reset();
    anotaciones.setContent();

    const data = validacionActualizacionEstado(form);

    if(data.error) return data;

    const envios = tabla.table.data().toArray();
    let existeError = false;
    tabla.clean();
    while(envios.length) {
        const envio = envios.shift();
        const resActualizacion = await guardarEstadoEnvioDiligenciado(envio, data);
        if(resActualizacion.error) {
            existeError = true;
            anotaciones.addError(envio.numeroGuia + " - " + resActualizacion.body);
            tabla.add(envio);
        }
    }

    l.end();

    return {
        error: existeError,
        message: existeError ? "Hubo al menos un error en una de las guías al actualizar" : "Todas las guías han sido actualizadas correctamente"
    };
}

async function actualizarEstadoEnvioIndividual(e, form, envio) {
    const l = new ChangeElementContenWhileLoading(e.target);
    l.init();

    const data = validacionActualizacionEstado(form);

    if(data.error) return data;

    const res = await guardarEstadoEnvioDiligenciado(envio, data);
    res.message = res.body.message; // Simplemente para que se muestre, ya que en la respuesta se espera un message
    res.dataIn = data;

    l.end();

    return res
}

async function guardarEstadoEnvioDiligenciado(envio, data) {
    const {id} = envio;
    await guardarEvidencia(id, data);

    return await actualizarEstadoEnvioHeka(id, data);

}

export { abrirModalActuaizarEstadoMasivo, abrirModalActuaizarEstado }