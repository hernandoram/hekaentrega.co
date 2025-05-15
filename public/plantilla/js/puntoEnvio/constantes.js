export const idReceptorFlexiiGuia = "flexii_guia_recept";
export const idGestorEntregaflexii = "gestor_entrega";
export const idFlexiiGuia = "flexii_guia";
export const idScannerEstados = "scanner_estados_flexii";
export const idFormActualizadorEstados = "actualizador_estados-" + idFlexiiGuia;

export const estadoRecibido = {
    estado: "Recibido",
    descripcion: "Paquete recibido",
    esNovedad: false,
    observaciones: "",
    ubicacion: "",
    reporter: user_id
}

export const estadoValidado = {
    estado: "Recogido",
    descripcion: "Adjuntado y validado",
    esNovedad: false,
    observaciones: "",
    ubicacion: "",
    reporter: user_id
}

export const estadoGeneracion = {
    estado: "Generado",
    descripcion: "Envío generado",
    esNovedad: false,
    observaciones: "",
    ubicacion: "",
    reporter: user_id
}

export const estadosRecepcion = {
    neutro: "NEUTRO", // Este estado no se debería guarda en base de datos, ya que será una forma de ifltrar todas las guías
    recibido: "RECIBIDO", // Cuando el Qr Ha sido escaneado
    validado: "VALIDADO", // Cuando el operador ha validado la guía
    empacado: "EMPACADO", // Cuando el pedido ha sido generado
    enrutado: "ENRUTADO", // Cuando el mensajero he definido una ruta sobre el paquete
    bloqueado: "BLOQUEADO", // Bloqueado por alguna novedad, o una forma de ocultar ciertos atributos del envío al destinatario y/o remitente (por definir)
    entregado: "ENTREGADO" // Cuando el mensajero ha entregado el paquete
}

