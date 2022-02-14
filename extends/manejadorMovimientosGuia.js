exports.revisarTipoEstado = (est, transp) => {
    const entregadas = ["ENTREGADO", "Entrega Exitosa"];
    const devoluciones = ["ENTREGADO A REMITENTE", "Devuelto al Remitente"];
    const anulados = ["Documento Anulado"];
  
    if(entregadas.includes(est)) return "entregas";
    if(devoluciones.includes(est)) return "devoluciones";
    return "";
}

exports.traducirMovimientoGuia = (transportadora) => {
    switch (transportadora) {
        case "ENVIA": case "TCC":
            return {
                novedad: "aclaracion",
                fechaMov: "fechamostrar",
                observacion: "descripcion",
                descripcionMov: "estado",
                ubicacion: "ciudad"
            }
        case "INTERRAPIDISIMO":
            return {
                novedad: "Motivo",
                fechaMov: "Fecha Cambio Estado",
                observacion: "Motivo",
                descripcionMov: "Descripcion Estado",
                ubicacion: "Ciudad"
            }
        default:
            return {
                novedad: "NomConc",
                fechaMov: "FecMov",
                observacion: "DesTipoMov",
                descripcionMov: "NomMov",
                ubicacion: "OriMov"
            }
    }
}

exports.revisarNovedad = (mov, transp) => {
    if(transp === "INTERRAPIDISIMO") {
        return mov.Motivo;
    } else if (transp === "ENVIA" || transp === "TCC") {
        return mov.novedad
    } else {
        return mov.TipoMov === "1";
    }
}

exports.revisarEstadoFinalizado = (estado) => {
    return [
        "ENTREGADO", "Entrega Exitosa", 
        "ENTREGADO A REMITENTE", "Devuelto al Remitente", 
        "Documento Anulado"
    ].includes(estado)
}