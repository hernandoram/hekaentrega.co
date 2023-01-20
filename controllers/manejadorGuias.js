const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {traducirMovimientoGuia} = require("../extends/manejadorMovimientosGuia");
const {actualizarMovimientosPorComparador} = require("./seguimientos");

exports.consultarGuia = async (req, res) => {
    const {n} = req.query;

    const reporte = await actualizarMovimientosPorComparador("numeroGuia", "==", n);
    // console.log("REPORTE", reporte);

    let guiaEncontrada = await db.collectionGroup("estadoGuias")
    .where("numeroGuia", "==", n)
    .limit(1)
    .get().then(querySnapshot => {
        const doc = querySnapshot.docs[0];

        if(doc)
        return doc.data();

        return;
    });

    const traducirMovimientos = guiaEncontrada.movimientos.map(m => {
        const tradMov = traducirMovimientoGuia(guiaEncontrada.transportadora);
        const titulos = Object.keys(tradMov);
        const res = {};

        titulos.forEach(t => res[t] = m[tradMov[t]]);
        return res;
    }).reverse();

    console.log(guiaEncontrada);

    const guia = {
        movimientos: traducirMovimientos,
        estado: guiaEncontrada.estadoActual.toUpperCase(),
        numeroGuia: guiaEncontrada.numeroGuia,
        fechaEnvio: guiaEncontrada.fechaEnvio,
    }


    // res.json(guiaEncontrada);
    res.render("guias/historicoGuia", {guia, layout:"general"});
    
    // res.render("productos", {productos, tienda: req.params.storeInfo});
};