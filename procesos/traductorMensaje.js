const XLSX = require("xlsx");
const path = require("path");
const db = require("../keys/firebase.js").firestore()

const ws = XLSX.readFile("../procesos/novedades_traducidas_ws.xlsx");

function guardarTraducciones() {
    const novedades =  XLSX.utils.sheet_to_json(ws.Sheets[ws.SheetNames[0]], {range: "F2-I27"});
    
    const traduccion = novedades.map(n => ({
        novedad: n.NOVEDADES.trim(),
        notificar_ws: n["MENSAJE WHATSAPP "] === "SI",
        mensaje: n.mensaje ? n.mensaje.trim() : "",
        transportadora: n.transportadora.trim().toUpperCase()
    }));
    
    console.log(traduccion);

    // db.collection("infoHeka").doc("novedadesMensajeria")
    // .set({lista: traduccion})
}
