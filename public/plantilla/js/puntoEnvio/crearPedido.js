import { v0 } from "../config/api.js";
import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { estadoGeneracion, estadosRecepcion } from "./constantes.js";
import { bodegasEl, diceContenerEl, oficinaDestinoEl, recoleccionEl } from "./views.js";

const contenedorAnotaciones = $("#anotaciones_creacion-flexii_guia");

export async function crearPedidoEnvios(cotizacion, enviosInvolucrados) {
    console.log(cotizacion);

    const guia = new GuiaBase(cotizacion);

    // TODO: Validar la información base para determinar si tiene el saldo adecuado para continuar (actualizar cuando se migre a master)
    if(!guia.poseeSaldoValido && false) {
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
    return await fetch({
        url: v0.seguimientoEnvios + "/" + idEnvio, 
        method: "POST",
        headers: {
            "Content-Type": "Application/json"
        },
        boyd: JSON.stringify(estado)
    })
    .then(d => d.json())
    .catch(e => ({
        error: true,
        message: "Error al actualizar estado: " + e.message
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

class GuiaBase {
    peso = 0;
    costo_envio = 0;
    valor = 0;
    seguro = 0;
    type = 0;
    dane_ciudadR = "";
    dane_ciudadD = "";
    transportadora = "";
    recoleccion_esporadica = 0; // 0:Sin recolección - 1: con recolección
    id_tipo_entrega = 1; // 1: Entrega en Dirección - 2: Entrega en oficina
    estadoActual = estadosGuia.pedido; // Básicamente empezarán siendo de tipo pedido
    seguimiento_finalizado = false;
    id_user = "";

    constructor(baseCotizacion) {
        this.peso = baseCotizacion.kgTomado;
        this.costo_envio = baseCotizacion.costoEnvio;
        this.valor = baseCotizacion.valor;
        this.seguro = baseCotizacion.seguro;
        this.type = baseCotizacion.type;
        this.dane_ciudadR = baseCotizacion.dane_ciudadR;
        this.dane_ciudadD = baseCotizacion.dane_ciudadD;
        this.transportadora = baseCotizacion.transportadora;

        this.detalles = baseCotizacion.getDetails;

        this.transpVisible = this.transportadora;

        this.fecha = genFecha();
        this.timeline = new Date().getTime();
        this.id_user = user_id;
    }

    get poseeSaldoValido() {
        return !this.debe &&
        !datos_personalizados.actv_credit &&
        this.costo_envio > datos_personalizados.saldo &&
        this.type !== CONTRAENTREGA
    }

    set datosRemitente(remitente) {
        this.nombreR = remitente.nombre_completo.trim();
        this.nombre_empresa = remitente.nombre_empresa || "";
        this.celularR = remitente.celular?.toString();
    }

    set datosBodega(bodega) {
        this.direccionR = bodega.direccion.trim() + ", " + bodega.barrio.trim();

        if (
            this.transportadora === transportadoras.INTERRAPIDISIMO.cod
        ) {
            this.codigo_sucursal = bodega.codigo_sucursal_inter;

            // Por ahora solo se presentará esta varialbe con interrapidísimo
            // Ya que este permite filtrar la solicitud de recolección
            this.recoleccion_solicitada = false;
        }
    }

    set datosDestinatario(destinatario) {
        this.nombreD = destinatario.nombre.trim();
        this.identificacionD = destinatario.documentoIdentidad || 123;
        
        const direccion =
        destinatario.direccionDestinatario.trim() +
        " " +
        destinatario.barrio.trim() +
        " " +
        destinatario.observaciones.trim();
        this.direccionD = direccion.trim();

        this.telefonoD = destinatario.otroCelular;
        this.celularD = destinatario.celular || destinatario.otroCelular;
        this.correoD = destinatario.email.trim() || "notiene@gmail.com";

        this.tipo_doc_dest = destinatario.tipoDocumento;
        this.observaciones = destinatario.observaciones;

    }

    set detallesProducto(producto) {
        this.dice_contener = producto.nombre.trim();
        this.referencia = producto.referencia.trim();
        this.empaqueDetalles = producto.paquete.trim();
    }    

    toObject() {
        return Object.assign({}, this);
    }
}