const db = require("../keys/firebase").firestore();

/*
    COORDINADORA

        ENTREGADA
        CERRADO POR INCIDENCIA, VER CAUSA

    ENVIA

        ENTREGADA DIGITALIZADA
        DEVOLUCION

    INTER

        Entrega Exitosa
        Entregada
        Devuelto al Remitente

    SERVI

        ENTREGADO
        ENTREGADO A REMITENTE
*/
const estadosEntregado = [
    "ENTREGADA", // COORDINADORA
    "ENTREGADA DIGITALIZADA", //ENVIA
    "Entrega Exitosa", "Entregada", // INTERRAPIDISIMO
    "ENTREGADO" // SERVIENTREGA
];

const estadosDevolucion = [
    "CERRADO POR INCIDENCIA, VER CAUSA", // COORDINADORA
    "DEVOLUCION", //ENVIA
    "Devuelto al Remitente", // INTERRAPIDISIMO
    "ENTREGADO A REMITENTE" // SERVIENTREGA
];

const estadosAnuladas = [
    "Documento Anulado" // INTERRAPIDÍSIMO
]

exports.estadosGuia = {
    novedad: "NOVEDAD",
    pedido: "PEDIDO",
    pagada: "PAGADA",
    finalizada: "FINALIZADA",
    generada: "GENERADA",
    proceso: "TRANSITO",
    empacada: "EMPACADA",
    eliminada: "ELIMINADA"
}

/**
 * @deprecated Función utilizada solo para estadísticas
 */
exports.revisarTipoEstado = (est, transp) => {
    const entregadas = estadosEntregado;
    const devoluciones = estadosDevolucion;
    const anulados = estadosAnuladas;
  
    if(entregadas.includes(est)) return "entregas";
    if(devoluciones.includes(est)) return "devoluciones";
    return "";
}

exports.traducirMovimientoGuia = (transportadora) => {
    switch (transportadora) {
        case "ENVIA":
            return {
                novedad: "novedad",
                fechaMov: "fechaMov",
                observacion: "observacion",
                descripcionMov: "estado",
                ubicacion: "ciudad"
            }
        case "TCC":
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
        case "COORDINADORA":
            return {
                novedad: "codigo_novedad",
                fechaMov: "fecha_completa",
                observacion: "descripcion",
                descripcionMov: "descripcion",
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

let listaNovedadesServientrega;
exports.revisarNovedadAsync = async (mov, transp) => {
    if(transp === "INTERRAPIDISIMO") {
        return mov.Motivo;
    } else if (transp === "ENVIA" || transp === "TCC") {
        return mov.novedad
    } else if(transp === "COORDINADORA") {
        return !!mov.codigo_novedad;
    } else {
        listaNovedadesServientrega = listaNovedadesServientrega || await db.collection("infoHeka")
        .doc("novedadesRegistradas").get().then(d => d.data());

        if(listaNovedadesServientrega) {
            return listaNovedadesServientrega.SERVIENTREGA.includes(mov.NomConc)
        }

        return mov.TipoMov === "1";
    }
}

exports.revisarNovedad = (mov, transp) => {
    if(transp === "INTERRAPIDISIMO") {
        return !!mov.Motivo;
    } else if(transp === "COORDINADORA") {
        return !!mov.codigo_novedad;
    } else if (transp === "ENVIA" || transp === "TCC") {
        return !!mov.novedad
    } else {
        if(listaNovedadesServientrega) {
            return listaNovedadesServientrega.SERVIENTREGA.includes(mov.NomConc)
        } else {
            this.revisarNovedadAsync(mov,transp);
        }

        return mov.TipoMov === "1";
    }
}

exports.guiaEnNovedad = (movimientos, transp) => {
    movimientos.reverse();
    const lastMov = movimientos[0];
    const fechaActual = new Date().getTime();
    const maxHors = 72 * 3.6e6;

    let enNovedad = false;
    let novedad;

    switch(transp) {
        case "INTERRAPIDISIMO": 
        // case "SERVIENTREGA":
            for (const mov of movimientos) {
                const tradFecha = this.traducirMovimientoGuia(transp)["fechaMov"];
                const fechaMov = mov[tradFecha];
                // const [soloFech, soloHr] = fechaMov.split(" ");
                // const soleFechFormat = soloFech.split("/").reverse().join("-");

                // const fechaMovMill = new Date(soleFechFormat + " " + soloHr).getTime();
                const fechaMovMill = new Date(fechaMov).getTime();
                const diferencia = fechaActual - fechaMovMill;
                const novedadEncontrada = this.revisarNovedad(mov, transp);
                
                if(novedadEncontrada) {
                    novedad = mov;
                    enNovedad = diferencia <= maxHors;
                    break;
                }
            }
            break;

        default: 
            novedad = lastMov
            enNovedad = this.revisarNovedad(lastMov, transp);
            break;
    }

    movimientos.reverse();

    console.log("NOVEDAD REGISTRADA", novedad, enNovedad);

    return {enNovedad, novedad, transp};
}

exports.revisarEstadoFinalizado = (estado) => {
    const listaEstadosFinalizadaCompleta = estadosEntregado.concat(estadosAnuladas, estadosDevolucion);
    
    return listaEstadosFinalizadaCompleta.includes(estado)
}