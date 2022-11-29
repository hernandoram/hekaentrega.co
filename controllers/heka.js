const db = require("firebase").firestore();

let ciudades = [];
exports.consultarCiudades = async (req, res) => {
    const parametro = req.query.search;

    if(!ciudades.length) await bringCiudades();

    if(parametro === "all") return res.send(ciudades.filter(c => !c.desactivada));

    const ciudadesFiltradas = ciudades.filter(c => 
        !c.desactivada 
        && new RegExp("^"+parametro.toUpperCase()).test(c.nombre.toUpperCase())
    );

    res.send(ciudadesFiltradas);
}

if(!process.env.DEVELOPMENT) {
    bringCiudades();
}

async function bringCiudades() {
    console.log("CONSULTANDO CIUDADES");
    const initial = new Date().getTime();

    ciudades = await db.collection("ciudades")
    .get().then(q => q.docs.map(d => d.data()));

    const final = new Date().getTime();

    console.log("TIEMPO DE CONSULTA => ", (final - initial) / 1000);

    return ciudades;
}