const ciudades = require("../data/ciudades");
const FirebaseServiceConection = require("../keys/firebase");
const firebaseService = new FirebaseServiceConection();
const db = firebaseService.dbFirebase();
const {revisarTipoEstado, revisarNovedadAsync, traducirMovimientoGuia} = require("./manejadorMovimientosGuia");

// FUNCIONES SOLO PARA USO EN DESARROLLO 

// buscarGuiasParaActualizarEstadisticas();
// funcion para actualizar estadisticas tomando todos los datos posibles
async function buscarGuiasParaActualizarEstadisticas(ref) {
    const querySnapshot = await ref
    .where("seguimiento_finalizado", "==", true)
    // db.collection("usuarios")
    // .doc("1122131320").collection("guias")
    // .where("id_heka", "==", "132039567")
    // .where("ciudadD", "==", "CALI")
    // .limit(4)
    .get()

    const novedades = {
        SERVIENTREGA: [], INTERRAPIDISIMO: [],
        ENVIA: [], TCC: [], DESCONOCIDO: []
    }

    try {
        let size = querySnapshot.size;
        console.log("cantidad de guias del usuario => ", size)
        for await (let doc of querySnapshot.docs) {
            const guia = doc.data();
            size--;
            if(guia.capturadaEstadisticaEntrega || guia.prueba) continue;
            
            const referenciaCiudad = await encontrarDaneCiudad(guia);
            const estadoGuia = await encontrarMovimientos(doc);
            const estadisticas = formatoEstadistica(estadoGuia);
            const {posiblesNovedades} = definirEstadisticas(estadoGuia);
            posiblesNovedades.forEach(n => {
                const t = estadoGuia.transportadora || "DESCONOCIDO";
                if (!novedades[t].includes(n))
                    novedades[t].push(n)
            });
        
            console.log(doc.data().id_user, doc.id, guia.id_heka, "guias Faltantes: "+size);
            if(estadisticas) await referenciaCiudad.set(estadisticas, {merge: true}).then(() => console.log("Actualizado en estadísticas"));
            doc.ref.update({capturadaEstadisticaEntrega: true});
        }

        return novedades;
    } catch(e) {
        console.error(e);
        console.log(novedades);
    }
}

// buscarUsuariosParaActualizarEstadisticas();
//funcion que utilizo para buscar los usuarios uno por uno, para luego actualizar las estadísticas de sus guías
async function buscarUsuariosParaActualizarEstadisticas() {
    const querySnapshot = await db.collection("usuarios")
    .orderBy("centro_de_costo")
    .where("centro_de_costo", ">=", "SellerOptipick")
    // .where("ciudadD", "==", "CALI")
    // .limit(5)
    .get()

    const novedades = {
        SERVIENTREGA: [], INTERRAPIDISIMO: [],
        ENVIA: [], TCC: [], DESCONOCIDO: []
    }

    try {
        let size = querySnapshot.size;
        console.log("Usuarios consultados =>", size);
        for await (let doc of querySnapshot.docs) {
            size--
            const novedadesGuias = await buscarGuiasParaActualizarEstadisticas(doc.ref.collection("guias"))
        
            console.log(doc.data().centro_de_costo, doc.id, "usuarios faltantes: "+size);
            if(!novedadesGuias) throw new Error("me quedé con el usuario => "+ doc.data().centro_de_costo)
            console.log("Camntidad novedades en estadísticas ", novedadesGuias);
            for(let t in novedadesGuias) {
                novedadesGuias[t].forEach(n => {
                    if (!novedades[t].includes(n))
                        novedades[t].push(n)
                })
            }
        }

        console.log("Todas las novedades => ", novedades);
    } catch(e) {
        console.error(e);
        console.error(e.message);
        console.log(novedades);
    }
}
//FIN DE FUNCIONES PARA USO EN SOLO DESARROLLO

//funcion para agregar estadistica en la ciudad contenida en "doc.data()"
async function agregarEstadistica(doc, estadoGuia) {
    // ES IMPORTATNTE que "doc" sea el documentode la guía, 
    // porque ese es el que se va a actualizar para referenciar que ya fue 
    // guardada la estadística

    const guia = doc.data();
    if(guia.capturadaEstadisticaEntrega) return;
    
    const referenciaCiudad = await encontrarDaneCiudad(guia);
    const estadisticas = await formatoEstadistica(estadoGuia);
    
    if(estadisticas) {
        estadisticas.transportadora = guia.transportadora || "SERVIENTREGA";
        estadisticas.nombreCiudad = guia.ciudadD +"("+ guia.departamentoD+")";
        await referenciaCiudad.set(estadisticas, {merge: true});
        doc.ref.update({capturadaEstadisticaEntrega: true});
    }
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
async function formatoEstadistica(movimientos) {
    if(!movimientos) return;
    const {data:seguimiento, cantNovedades, posiblesNovedades} = await definirEstadisticas(movimientos);
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

async function definirEstadisticas(data) {
    const posiblesNovedades = [];
    if(!data) return {posiblesNovedades};

    const movimientos = data.movimientos;
    const ultMov = movimientos[movimientos.length - 1];
    const cantNovedades = await movimientos.reduce(async (a,b)  => {
        try {
            const novedad = await revisarNovedadAsync(b, data.transportadora);
            if(novedad) {
                posiblesNovedades.push(b.novedad);
                a++;
            }
        } catch (e) {
            console.log("Error con el contador de novedades ", e.message)
        }
        return a
    }, 0);

    console.log("Cantidad novedades estadísticas", cantNovedades);

    return {data, movimientos, ultMov, cantNovedades, posiblesNovedades};
}

module.exports = {agregarEstadistica}