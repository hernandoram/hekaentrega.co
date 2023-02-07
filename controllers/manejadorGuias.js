const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {traducirMovimientoGuia} = require("../extends/manejadorMovimientosGuia");
const {actualizarMovimientosPorComparador} = require("./seguimientos");

const _collEstadoGuia = "estadoGuias";
const _collGuia = "guias";

exports.consultarGuia = async (req, res) => {
    const {n} = req.query;

    if(!process.env.DEVELOPMENT)
        await actualizarMovimientosPorComparador("numeroGuia", "==", n);
    // console.log("REPORTE", reporte);

    const docMovimiento = await buscarGuia(n, _collEstadoGuia);
    const docGuia = await buscarGuia(n, _collEstadoGuia);
    if(!docMovimiento || !docGuia) return res.send("GUIA NO ENCONTRADA");
    let movimientosEncontrado = docMovimiento.data();

    let guiaEncontrada = docGuia.data();
    const {seguimiento} = guiaEncontrada;

    const traducirMovimientos = movimientosEncontrado.movimientos.map(m => {
        const tradMov = traducirMovimientoGuia(movimientosEncontrado.transportadora);
        const titulos = Object.keys(tradMov);
        const res = {};
        
        titulos.forEach(t => res[t] = m[tradMov[t]]);
        
        if(seguimiento && seguimiento.length) {
            const gestEnc = seguimiento.find(s => s.fechaMovimiento === res.fechaMov)

            if(gestEnc) res.gestion = gestEnc.gestion;
        }
        return res;
    }).reverse();

    console.log(movimientosEncontrado, guiaEncontrada);

    const guia = {
        movimientos: traducirMovimientos,
        estado: movimientosEncontrado.estadoActual.toUpperCase(),
        numeroGuia: movimientosEncontrado.numeroGuia,
        fechaEnvio: movimientosEncontrado.fechaEnvio,
    }

    // res.json(movimientosEncontrado);
    res.render("guias/historicoGuia", {guia, layout:"general"});
    
    // res.render("productos", {productos, tienda: req.params.storeInfo});
};

exports.plantearSolucion = async (req, res) => {
    console.log(req.body);
    const { numeroGuia, gestion, fechaMovimiento } = req.body;

    const doc = await buscarGuia(numeroGuia, _collEstadoGuia); // Mientra para ir probando
    if(!doc) return res.status(400).send("GUÍA NO ENCONTRADA");

    const gest = {
        gestion, fecha: new Date(),
        type: "EXERNO",
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