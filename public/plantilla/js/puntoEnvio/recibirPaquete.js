import TablaEnvios from "./tablaEnvios.js";

const estadosRecepcion = {
    recibido: "RECIBIDO",
    empacado: "EMPACADO"
}

const config = { 
    fps: 2, qrbox: {width: 250, height: 250}
    // rememberLastUsedCamera: false,
}

const idElement = "reader-flexii_guia";
const btnActivador = $("#activador_scanner-flexii_guia");

btnActivador.on("click", activationScanner);
const tablaPendientes = new TablaEnvios("#contenedor_tabla-fleii_guia");

function onScanSuccess(decodedText, decodedResult) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    stopScanning();
}

const html5QrCode = new Html5Qrcode(idElement);
console.log(html5QrCode);
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

const bodegasEl = $("#bodega-flexii_guia");
bodegasWtch.watchFromLast((info) => {
    if (!info) return;

    bodegasEl.html("");

    const opciones = info.map((bodega) => {
      const bodegaEl = `<option value="${bodega.id}">${bodega.nombre}</option>`;
      return bodegaEl;
    });

    opciones.unshift(`<option value>Seleccione Bodega</option>`);

    bodegasEl.html(opciones.join(""));
});

obtenerUsuariosFrecuentes().then(listarUsuariosFrecuentes);

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

const oficinaDestinoEl = $("#ciudadD-flexii_guia");
function listarUsuariosFrecuentes(info) {
    if (!info.length) return;

    oficinaDestinoEl.html("");

    const opciones = info.map((destino) => {
      const destinoEl = `<option value="${destino.id}">${destino.nombre}</option>`;
      return destinoEl;
    });

    opciones.unshift(`<option value>Seleccione Bodega</option>`);

    oficinaDestinoEl.html(opciones.join(""));

    return info;
}