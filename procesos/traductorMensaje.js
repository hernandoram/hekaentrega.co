const XLSX = require("xlsx");
const path = require("path");
const db = require("../keys/firebase.js").firestore()

const ws = XLSX.readFile("../procesos/novedades_traducidas_ws.xlsx");


const novedades =  XLSX.utils.sheet_to_json(ws.Sheets[ws.SheetNames[0]], {range: "F2-I11"});

const traduccion = novedades.map(n => ({
    novedad: n.NOVEDADES.trim(),
    notificar_ws: n["MENSAJE WHATSAPP "] === "SI",
    mensaje: n.mensaje.trim(),
    transportadora: "INTERRAPIDISIMO"
}));

console.log(traduccion);

// db.collection("infoHeka").doc("novedadesMensajeria")
// .set({lista: traduccion})