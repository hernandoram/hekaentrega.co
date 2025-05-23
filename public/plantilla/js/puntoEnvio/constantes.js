export const idReceptorFlexiiGuia = "flexii_guia_recept";
export const idGestorEntregaflexii = "gestor_entrega";
export const idFlexiiGuia = "flexii_guia";
export const idScannerEstados = "scanner_estados_flexii";
export const idFormActualizadorEstados = "actualizador_estados-" + idFlexiiGuia;

export const estadosRecepcion = {
    neutro: "NEUTRO", // Este estado no se debería guarda en base de datos, ya que será una forma de ifltrar todas las guías
    recibido: "RECIBIDO", // Cuando el Qr Ha sido escaneado
    validado: "VALIDADO", // Cuando el operador ha validado la guía
    empacado: "EMPACADO", // Cuando el pedido ha sido generado
    novedad: "NOVEDAD", // Cuando el envío posee una novedad que necesita ser resuelta bien sea por el destinatario o remitenta
    novedad_op: "NOVEDAD OPERATIVA", // Cuando el envío posee una novedad que no necesita ser diligenciada por remitentne ni destinatario
    devuelto: "DEVOLUCION", // Cuando el pedido ha sido devuelto (entregado al remitente)
    entregado: "ENTREGADO", // Cuando el mensajero ha entregado el paquete
    reparto: "REPARTO", // Cuando el mensajero indica que está repartiendo el paquete
    bodega: "EN BODEGA", // Cuando el mensajero ha dejado el paquete en alguna dirección de referencia Heka
}

export const estadoRecibido = {
    estado: "Recibido",
    descripcion: "Paquete recibido",
    esNovedad: false,
    observaciones: "",
    ubicacion: "",
    tipo: estadosRecepcion.recibido,
    reporter: user_id
}

export const estadoValidado = {
    estado: "Recogido",
    descripcion: "Adjuntado y validado",
    esNovedad: false,
    observaciones: "",
    ubicacion: "",
    tipo: estadosRecepcion.validado,
    reporter: user_id
}

export const estadoGeneracion = {
    estado: "Generado",
    descripcion: "Envío generado",
    esNovedad: false,
    observaciones: "",
    ubicacion: "",
    tipo: estadosRecepcion.empacado,
    reporter: user_id
}

