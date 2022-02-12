const ciudades = require("../data/ciudades");
const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {revisarTipoEstado, revisarNovedad, traducirMovimientoGuia} = require("./manejadorMovimientosGuia");

// funcion para actualizar estadisticas tomando todos los datos posibles
async function buscarGuiasParaActualizarEstadisticas() {
    const querySnapshot = await db.collectionGroup("guias")
    .where("seguimiento_finalizado", "==", true)
    // .where("ciudadD", "==", "CALI")
    .limit(1)
    .get()


    querySnapshot.forEach(async doc => {
        const guia = doc.data();
        if(guia.capturadaEstadisticaEntrega) return;
        
        const referenciaCiudad = await encontrarDaneCiudad(guia);
        const estadoGuia = await encontrarMovimientos(doc);
        const estadisticas = formatoEstadistica(estadoGuia);

        console.log(doc.data().id_user, doc.id)
        await referenciaCiudad.set(estadisticas, {merge: true});
        // doc.ref.update({capturadaEstadisticaEntrega: true});
    }); 
}
// buscarGuiasParaActualizarEstadisticas();

//funcion para agregar estadistica en la ciudad contenida en "doc.data()"
async function agregarEstadistica(doc, estadoGuia) {
    // ES IMPORTATNTE que "doc" sea el documentode la guía, 
    // porque ese es el que se va a actualizar para referenciar que ya fue 
    // guardada la estadística

    const guia = doc.data();
    if(guia.capturadaEstadisticaEntrega) return;
    
    const referenciaCiudad = await encontrarDaneCiudad(guia);
    const estadisticas = formatoEstadistica(estadoGuia);

    await referenciaCiudad.set(estadisticas, {merge: true});
    doc.ref.update({capturadaEstadisticaEntrega: true});
}

//aqui se encontrará la ciudad que corresponde a la guía
async function encontrarDaneCiudad(guia) {
    const collCiudades = "ciudades";
    const collEstadisticas = "estadisticasEntrega";
    const ciudades = db.collection(collCiudades);
    const cod_dane = guia.dane_ciudadD;
    const transp = guia.transportadora || "SERVIENTREGA";

    let ciudad;
    if(!cod_dane) {
        const nombre = guia.ciudadD + "(" + guia.departamentoD + ")";
        const ciudadesEnc = await ciudades.where("nombre", "==", nombre).get();
        ciudadesEnc.forEach(doc => ciudad = doc.ref.collection(collEstadisticas).doc(transp))
    } else {
        ciudad = ciudades.doc(cod_dane)
        .collection(collEstadisticas).doc(transp);
    }
    return ciudad
}

//devuelve un objeto que será enviado directo a las estadisticas de firebase
function formatoEstadistica(movimientos) {
    const {data:seguimiento, cantNovedades, posiblesNovedades} = definirEstadisticas(movimientos);
    const estadisticas = {};
    const tipoEntrega = revisarTipoEstado(seguimiento.estadoActual);

    //buscamos el tipo de entrega para saber si fue entregada o devuelta
    // y le aumentamos su respectivo valor con fieldValue de firebase
    if(tipoEntrega) {
        estadisticas.envios = firebase.firestore.FieldValue.increment(1);
        estadisticas[tipoEntrega] = firebase.firestore.FieldValue.increment(1);
    }

    // si tiene novedades, se contabiliza la cantidad total, y también
    // se aumenta uno de forma genérica
    if(cantNovedades) {
        estadisticas.presentaronNovedad = firebase.firestore.FieldValue.increment(1);
        estadisticas.novedades = firebase.firestore.FieldValue.increment(cantNovedades);
        
    }

    // Arreglo que será lleno con las novedades más frecuentes presentadas
    if(posiblesNovedades.length) {
        estadisticas.posiblesNovedades = firebase.firestore.FieldValue.arrayUnion(...posiblesNovedades);
    }

    return estadisticas
}

async function encontrarMovimientos(doc) {
    const movimiento = await doc.ref.parent.parent
    .collection("estadoGuias").doc(doc.id).get();
    
    const data = movimiento.data();
    return data;

}

function definirEstadisticas(data) {
    const movimientos = data.movimientos;
    const ultMov = movimientos[movimientos.length - 1];
    const posiblesNovedades = [];
    const cantNovedades = movimientos.reduce((a,b)  => {
        const novedad = revisarNovedad(b, data.transportadora);
        if(novedad) {
            const campoNovedad = traducirMovimientoGuia(data.transportadora).novedad
            posiblesNovedades.push(b[campoNovedad]);
            a++;
        }
        return a
    }, 0);

    return {data, movimientos, ultMov, cantNovedades, posiblesNovedades};
}

module.exports = {agregarEstadistica}