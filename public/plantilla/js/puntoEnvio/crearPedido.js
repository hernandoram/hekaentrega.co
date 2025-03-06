import { v0 } from "../config/api.js";
import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import GuiaBase from "../utils/guiaBase.js";
import { estadoGeneracion, estadosRecepcion } from "./constantes.js";
import { bodegasEl, diceContenerEl, oficinaDestinoEl, recoleccionEl } from "./views.js";

const contenedorAnotaciones = $("#anotaciones-flexii_guia");

export async function crearPedidoEnvios(cotizacion, enviosInvolucrados) {
    console.log(cotizacion);

    Cargador.fire({
        text: "Se está generando la información de su conjunto de envíos"
    });

    const guia = new GuiaBase(cotizacion);

    if(guia.saldoInvalido) {
        return Swal.fire({
            title: "Saldo insuficiente",
            icon: "error",
            text: "No posee saldo suficiente para crear guías"
        });
    }

    const dataBodega = getDataSelectedfromInput(bodegasEl);
    const dataDestinatario = getDataSelectedfromInput(oficinaDestinoEl);


    guia.datosBodega = dataBodega;
    guia.datosDestinatario = dataDestinatario;
    guia.datosRemitente = datos_usuario;
    guia.detallesProducto = getDataSelectedfromInput(diceContenerEl);

    if(recoleccionEl.is(":checked")) {
        guia.recoleccion_esporadica = 1; // Habilitamos la rcolección esporádia, ya que por defeccto no estaría activa
    }

    const pedidoPorGenerar = guia.toObject();
    
    try {
        const res = await enviar_firestore(pedidoPorGenerar); // Si a esta altura todo ha salido bien, el pedido por generar debe tener un id heka creado correctamente

        if(res.icon === "success") {
            await actualizarEstadosEnvio(pedidoPorGenerar.id_heka, enviosInvolucrados);
        }

        const resSwal = await Swal.fire({
            ...res,
            text: res.mensaje,
            timer: 6000,
            showCancelButton: true,
            confirmButtonText: "Si, continuar",
            cancelButtonText: "No, ver el historial.",
        
        });

        if (!resSwal.isConfirmed) {
            location.href = "#historial_guias";
            cambiarFecha();
        }

    } catch (e) {
        Swal.fire("Error Inesperado", e.message, "error");
    }
}

async function actualizarEstadoEnvioIndividual(idEnvio, estado) {
    return await fetch(v0.seguimientoEnvios + "/" + idEnvio, {
        method: "POST",
        headers: {
            "Content-Type": "Application/json"
        },
        body: JSON.stringify(estado)
    })
    .then(d => d.json())
    .catch(e => ({
        error: true,
        body: "Error al actualizar estado: " + e.message
    }));
}

async function actualizarEstadosEnvio(idHekaCreado, arrEnvios) {
    const anotaciones = new AnotacionesPagos(contenedorAnotaciones);
    anotaciones.setContent();

    for(let envio of arrEnvios) {
        const {id} = envio;
        const empaqueGuia = await empacarGuiaPedido(id, idHekaCreado);
        if(empaqueGuia.error) {
            anotaciones.addError("Error al procesar empaque: " + empaqueGuia.message, undefined, {
                text: "Reempacar",
                color: "error",
                onClick: () => empacarGuiaPedido(id, idHekaCreado)
                    .then(res => Swal.fire({icon: res.error ? "error" : "success", text: res.message ?? "Guía empacada correctamente."}))
            });
        }
        
        const resActualizacionEstado = await actualizarEstadoEnvioIndividual(id, estadoGeneracion);
        if(resActualizacionEstado.error) {
            anotaciones.addError("Error al actualizar estado: " + resActualizacionEstado.message, undefined, {
                text: "Volver a notificar",
                color: "warning",
                onClick: () => actualizarEstadoEnvioIndividual(id, estadoGeneracion)
                    .then(res => Swal.fire({icon: res.error ? "error" : "success", text: res.message ?? "Guía notificada correctamente."}))
            });
        }
    }

}

async function empacarGuiaPedido(idEnvio, idHekaCreado) {
    return await db.collection("envios").doc(idEnvio)
    .update({
        id_agrupacion_guia: idHekaCreado, 
        estado_recepcion: estadosRecepcion.empacado
    })
    .then(r => ({error: false, message: "Envío actualizado correctamente"}))
    .catch(e => ({error: true, message: e.message}));
}

export const dataValueSelectedFromInput = getDataSelectedfromInput;
export const actualizarEstadoEnvioHeka = actualizarEstadoEnvioIndividual;



function getDataSelectedfromInput($JqueryElement) {
    const elemetnSelectize = $JqueryElement[0].selectize;
    const valueSelected = elemetnSelectize.getValue();
    const dat = elemetnSelectize.options[valueSelected];

    return dat;
}