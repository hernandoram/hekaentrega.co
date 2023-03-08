const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {traducirMovimientoGuia, guiaEnNovedad} = require("../extends/manejadorMovimientosGuia");
const {actualizarMovimientosPorComparador} = require("./seguimientos");

const _collEstadoGuia = "estadoGuias";
const _collGuia = "guias";

const tituloPorNovedad = {
    DIRECCION: "¿Te gustaría reparto?",
    REUSADO: "Nuevo intento."
}

function cargarMensajeAleatorio() {
    const titulos = ["DIRECCION", "REUSADO"];
    const seleccionado = titulos[Math.floor((Math.random() * titulos.length))];

    return {tipo: seleccionado, titulo: tituloPorNovedad[seleccionado]};
}

exports.consultarGuia = async (req, res) => {
    const {n} = req.query;

    // if(!process.env.DEVELOPMENT)
    await actualizarMovimientosPorComparador("numeroGuia", "==", n);
    // console.log("REPORTE", reporte);

    const docMovimiento = await buscarGuia(n, _collEstadoGuia);

    if(!docMovimiento) return res.send("GUIA NO ENCONTRADA");
    let movimientosEncontrado = docMovimiento.data();
    console.log("MOVIMIENTO =>", movimientosEncontrado);

    const tradMov = traducirMovimientoGuia(movimientosEncontrado.transportadora);

    const traduccion = (mov) => {
        const titulos = Object.keys(tradMov);
        const res = {};
        titulos.forEach(t => res[t] = mov[tradMov[t]]);
        return res
    }

    const traducirMovimientos = movimientosEncontrado.movimientos.map(traduccion).reverse();

    const {novedad} = guiaEnNovedad(movimientosEncontrado.movimientos, movimientosEncontrado.transportadora);
    const novedadActual = novedad ? traduccion(novedad) : {};
    const {tipo, titulo} = cargarMensajeAleatorio();
    novedadActual.tituloRespuesta = titulo;
    novedadActual.tipo_solucion = tipo;
    console.log(novedadActual);

    const guia = {
        movimientos: traducirMovimientos,
        estado: movimientosEncontrado.estadoActual.toUpperCase(),
        numeroGuia: movimientosEncontrado.numeroGuia,
        fechaEnvio: movimientosEncontrado.fechaEnvio,
        enNovedad: movimientosEncontrado.enNovedad,
        novedadActual
    }

    // res.json(movimientosEncontrado);
    res.render("guias/historicoGuia", {guia, novedadActual, layout:"general"});
    
    // res.render("productos", {productos, tienda: req.params.storeInfo});
};

exports.plantearSolucion = async (req, res) => {
    console.log(req.body);
    const { numeroGuia, gestion, fechaMovimiento } = req.body;

    const doc = await buscarGuia(numeroGuia, _collGuia);
    if(!doc) return res.status(400).send("GUÍA NO ENCONTRADA");

    const gest = {
        gestion, fecha: new Date(),
        type: "EXTERNO",
        fechaMovimiento
    }

    doc.ref.update({seguimiento: firebase.firestore.FieldValue.arrayUnion(gest)})
    .then(() => {
        res.send("Información registrada correctamente");
    })
    .catch((e) => {
        console.log(e);
        res.status(400).send("Error registrando la información");
    });
}

async function buscarGuia(numeroGuia, coll) {
    return await db.collectionGroup(coll)
    .where("numeroGuia", "==", numeroGuia)
    .limit(1)
    .get().then(querySnapshot => {
        const doc = querySnapshot.docs[0];

        return doc
    });
}