const XLSX = require("xlsx");
const path = require("path");
const db = require("../keys/firebase.js").firestore()

const ws = XLSX.readFile("../procesos/convertirGuiasEmpresa.xlsx");


const guias =  XLSX.utils.sheet_to_json(ws.Sheets[ws.SheetNames[0]], {header: "A1"});
console.log(guias);
// cambiarEmpresa();
async function cambiarEmpresa() {
    guias.push(Object.keys(guias[0])[0])
    let cantidadGuias = guias.length
    const reporte = {
        total: guias.length,
        actualizadas: new Set(),
        noActualizadas: new Set(),
        noEncontradas: new Set(),
    };

    for await (let g of guias) {
        const numeroGuia = Object.values(g)[0];
        console.log(numeroGuia);
    
        await db.collectionGroup("guias")
        .where("numeroGuia", "==", numeroGuia.toString().trim())
        .get().then(async q => {
            if(!q.size) reporte.noEncontradas.add(numeroGuia)
            const doc = q.docs[0];
            if(!doc) return;
    
            console.log(doc.data().cuenta_responsable);
            // console.log(doc.data());
            // return;
            await doc.ref.update({ cuenta_responsable: "EMPRESA" })
            .then(() => {
                cantidadGuias--;
                console.log("Faltan => ", cantidadGuias);
                reporte.actualizadas.add(numeroGuia)
            }).catch(() => {
                reporte.noActualizadas.add(numeroGuia)
                console.log("ERROR AL CARGAR: " + numeroGuia);
            });
        });
    }

    console.log(reporte);
}