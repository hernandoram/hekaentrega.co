const db = require("../keys/firebase").firestore();

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

let listaNovedadesServientrega;
exports.revisarNovedadAsync = async (mov, transp) => {
    if(transp === "INTERRAPIDISIMO") {
        return mov.Motivo;
    } else if (transp === "ENVIA" || transp === "TCC") {
        return mov.novedad
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
    } else if (transp === "ENVIA" || transp === "TCC") {
        return !!mov.novedad
    } else {
        if(listaNovedadesServientrega) {
            return listaNovedadesServientrega.SERVIENTREGA.includes(mov.NomConc)
        }

        return mov.TipoMov === "1";
    }
}

exports.guiaEnNovedad = (movimientos, transp) => {
    movimientos.reverse();
    const lastMov = movimientos[0];
    const fechaActual = new Date().getTime();
    const maxHors = 48 * 3.6e6;

    let enNovedad = false;

    switch(transp) {
        case "INTERRAPIDISIMO":
            for (const mov of movimientos) {
                const tradFecha = this.traducirMovimientoGuia(transp)["fechaMov"];
                const fechaMov = mov[tradFecha];
                const [soloFech, soloHr] = fechaMov.split(" ");
                const soleFechFormat = soloFech.split("/").reverse().join("-");

                const fechaMovMill = new Date(soleFechFormat + " " + soloHr).getTime();
                const diferencia = fechaActual - fechaMovMill ;
                const novedadEncontrada = this.revisarNovedad(mov, transp);

                if(novedadEncontrada) {
                    enNovedad = diferencia <= maxHors;
                    break;
                }
            }
            break;

        default: 
            enNovedad = this.revisarNovedad(lastMov, transp);
            break;
    }

    movimientos.reverse();

    return enNovedad;
}

exports.revisarEstadoFinalizado = (estado) => {
    return [
        "ENTREGADO", "Entrega Exitosa", 
        "ENTREGADO A REMITENTE", "Devuelto al Remitente", 
        "Documento Anulado"
    ].includes(estado)
}