const db = require("../keys/firebase.js").firestore();
const json2xls = require("json2xls");
const fs = require("fs");


const estadosEntrega = [
    "ENTREGADO",
    "ENTREGADO A REMITENTE",
];

const novedad = "EMPRESARIO SATELITE C.O.D. Y/O LPC";

// revisarGuias();
async function revisarGuias() {
    const analisis = new Object();

    const historia = await paginator();


    historia.sort((a,b) => {
        if (a.ciudadD > b.ciudadD) {
          return 1;
        }
        if (a.ciudadD < b.ciudadD) {
          return -1;
        }
        
        return 0;
    });

    const xls = json2xls(historia);

    fs.writeFileSync("../Entregas en oficina.xlsx", xls, "binary");
}


async function paginator(next, segmento = 0) {
    const size = 2500;
    const ref = db.collectionGroup("estadoGuias").where("estadoActual", "in", estadosEntrega).limit(size);

    let consulta = ref;
    segmento++

    if(next) {
        consulta = consulta.startAfter(next);
    }

    return await consulta
    .get().then(async q => {
        const t = q.size;
        let historia = new Array();

        q.forEach(d => {
            const data = d.data();
            const {movimientos, direccionD, numeroGuia, estadoActual, ciudadD} = data;
        
            const zonaDist = movimientos.find(m => m.NomMov === "EN ZONA DE DISTRIBUCION");
        
            if(!zonaDist || /oficina|servientrega/gi.test(direccionD)) return;
            
            const guardado = {
                direccionD, ciudadD, numeroGuia, estado: estadoActual, 
                novedad: zonaDist.NomConc, 
                movimiento: zonaDist.NomMov,
                entrega_ofi: zonaDist.NomConc === novedad
            }
    
            historia.push(guardado);
        });

        console.log("Cargaron " + historia.length + " de " + t + " en el segmento: " + segmento);

        if(t) {
            const siguiente = q.docs[t - 1];
            const interno = await paginator(siguiente, segmento);
            historia = historia.concat(interno);
        }


        return historia;
    });

}