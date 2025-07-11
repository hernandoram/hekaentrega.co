const { estandarizarFecha } = require("../extends/funciones.js");
const fs = require("fs");

const transportadorasFrom = ["servientrega", "envía", "tcc", "interrapidisimo", "coordinadora"];
const transportadorasTo = ["SERVIENTREGA", "ENVIA", "TCC", "INTERRAPIDISIMO", "COORDINADORA"];
const camposNumericos = ["COMISION HEKA", "RECAUDO", "ENVÍO TOTAL", "TOTAL A PAGAR"];
const firebase = require("../keys/firebase.js");
const db = firebase.firestore()

/**
 * Script creado el 3 de agosto del 2023 para migrar toda la información contenida en pagos
 * desde los nodos encontrados en pagos con cada transportadora respectiva para mantener un estandar
 * en la que se migró la información parcialmente por cada transportadora.
 * 
 * ARREGLOS:
 *  - Se migró toda la información registrada en la base de datos (pagos/{@link transportadorasFrom}/pagos/{id}) -> (pagos/{@link transportadorasTo}/pagos/{id})
 *  - Se cambió el tipo de transportadora para que quedara estandar {@link transportadorasFrom} -> {@link transportadorasTo}
 *  - Aquello campos que deberían ser numéricos quedaron se les hicieron un parseo para que se guardaran de forma correcta
    - Se añadió un complemento para poder consultas los pagos realizados en rangos de fechas de manera más sencilla y rápida
        - timeline: Corresponde al momento exacto en el que se propone a pagar
        - momentoParticularPago: la fecha en milisegundos que corresponda al campo "FECHA" en caso de que la fecha impuesta por 
            "timeline" sea diferente (en la mayoría de los casos ambos son iguales)
    - Se matuvo el registro de los pagos originales que fueron realizados antes del 3 de agosto del 2023, en caso de que se detecte 
        algún inconveniente se puede consultas a su origen para corroborar datos antiguos (pagos/{@link transportadorasFrom}/pagos/{id})
*/
async function migracionDeDatos() {

    if(!transportadoraFrom || !transportadoraTo) throw new Error("No se de donde a donde migrar datos");
    const ref = db.collection("pagos");

    const refFrom = ref.doc(transportadoraFrom).collection("pagos")
    .limit(maxPagination)


    const segemetos = await busquedaPaginada(refFrom);

    const reporteFinal = `
        Se han migrado ${correctos} datos correctamente de ${contadorTotal}
        desde "${transportadoraFrom}" hacia "${transportadoraTo}"
        Con un total de ${segemetos} segmentaciones.

        Resumen de las advertencias:
            - ${warnings.join("\n\t\t\t- ")}
        
        Este es el resumen de los errores: 
            - ${errores.join("\n\t\t\t- ")}
    `;
    console.log(reporteFinal);
    
    fs.writeFile("./reporteMigracionPagos/" + transportadoraTo + ".txt", reporteFinal, err => {
        if(err) return console.error("NO SE PUDO GUARDAR EL REPORTE");

        console.log("Reporte generado correctamente");
    })
}

// Indice donde se encuentra de la transportadora que se está transfiriendo
const indexT = 4;
const transportadoraFrom = transportadorasFrom[indexT];
const transportadoraTo = transportadorasTo[indexT];

const maxPagination = 5000;

let correctos = 0;
let contadorTotal = 0;
async function busquedaPaginada(ref, next, segmento = 0) {
    segmento++
    let consulta = ref;
    if(next) {
        consulta = ref.startAfter(next);
    }

    const resultado = await consulta
    .get().then(async q => {
        const t = q.size;
        contadorTotal += t;

        await migrarDatos(q);

        if(t === maxPagination) {
            const siguiente = q.docs[t - 1];
            segmento = await busquedaPaginada(ref, siguiente, segmento);
        }

        return true;
    });


    return segmento;
}

// migracionDeDatos();
const errores = [];
const warnings = [];


async function migrarDatos(q) {
    let faltantes = q.size;

    const refTo = db.collection("pagos")
    .doc(transportadoraTo).collection("pagos");

    
    const obtenerTimelineDeFecha = (fecha) => {
        /**
         Es necesario invertir la fecha ya que el formato e el que se guardar en base de datos es:
        DD-MM-AAAA y para que funcione la especificaciò del Date.parse, se debe usar el formato:
        AAAA-MM-DD para posteriormente sumarle "T00:00:00" por el TimeZone y para uqe funcione en todos los navegadores 
        */
        const fechaParse = fecha.split("-").reverse().join("-");
        return Date.parse(fechaParse + "T00:00:00");
    }


    await new Promise((res, rej) => {

        for (const d of q.docs) {
            const data = d.data();
            data.TRANSPORTADORA = transportadoraTo;
    
            if(typeof data.GUIA === "number") {
                data.GUIA = data.GUIA.toString();
            }
        
            if(!data.timeline) {
                warnings.push(`La guía ${data.GUIA} no tenía timeline`);
                const newTimeline = obtenerTimelineDeFecha(data.FECHA);
                data.timeline = newTimeline;
            }

            camposNumericos.forEach(c => {
                if(typeof data[c] == "string") {
                    let tipo = "NATURAL";
                    if(data[c].includes(",") || data[c].includes(".")) {
                        data[c] = parseFloat(data[c]);
                        tipo = "DECIMAL"
                    } else {
                        data[c] = parseInt(data[c]);
                    }

                    const warn = `La guia ${data.GUIA} contenía el campo ${c} como ${tipo} y fue parseado`;
                    warnings.push(warn);

                    if(Number.isNaN(data[c])) errores.push(`La guia ${data.GUIA} tiene un error en el campo ${c} al tratar de parsear.`);;
                }
            });
        
            const timeline = data.timeline;
            data.momentoParticularPago = timeline;
        
            const fechaEstandTimeline = estandarizarFecha(timeline, "DD-MM-YYYY");
        
            if(fechaEstandTimeline !== data.FECHA) { 
                data.momentoParticularPago = obtenerTimelineDeFecha(data.FECHA);
            }
        
            ultimaGuia = d.ref.id;
            refTo.doc(d.ref.id)
            .set(data)
            .then(d => {
                correctos++;
                if(faltantes % (maxPagination / 5) == 0)
                    console.log("Documento actualizado: " +data.GUIA+ ", restantes: " + faltantes);
    
            })
            .catch(err => {
                const message = "Hubo un error al guardar la guía " + data.GUIA + " -- ERROR: " + err.message;
                console.log(message);
                errores.push(message);
                
            })
            .finally(fin => {
                faltantes--;
                if(faltantes > 0) return;

                res(true);
            })
            
            
        }
    });

}

function actualizacionDePendientesPorPagar() {
    const ref = db.collection("pendientePorPagar")
    // .limit(2);

    ref.get().then(q => {
        q.forEach(d => {
            const data = d.data();
            const transp = data.TRANSPORTADORA;

            const indiceTranps = transportadorasFrom.indexOf(transp.toLowerCase());
            const message = "No se encuentra el índice de una transportadora, algo anda mal con la guía " + d.ref.id;
            let error = false;
            if(indiceTranps == -1) {
                errores.push(message);
                error = true;
            }

            data.TRANSPORTADORA = transportadorasTo[indiceTranps];

            console.log("Esta es la data que se va a sustituir: ", data);

            // return;
            if(!error)
                d.ref.update(data);

            console.log("Reportando errorres => ", errores);
        })
    })
}

// actualizarPaqPagos()
// .then(() => process.exit());
async function actualizarPaqPagos(id) {
    
    const pagos = await obtenerPagoPorIdPaquete(id);

    const actualizacion = pagos.reduce((a,b) => {
        a.comision_heka += b["COMISION HEKA"];
        a.comision_logistica_propia += b.comision_logistica_propia ?? 0;
        a.comision_heka_facturacion += b.comision_heka_facturacion;
        a.comision_transportadora += b.comision_transportadora;
        a.total_pagado += b['TOTAL A PAGAR'];
        a.comision_natural_heka += b.comision_natural_heka ?? 0;
        a.cuatro_x_mil_banco += b.cuatro_x_mil_banco ?? 0;
        a.cuatro_x_mil_transp += b.cuatro_x_mil_transp ?? 0;
        a.iva += b.iva ?? 0;

        return a;
    }, {
        comision_heka: 0,
        comision_logistica_propia: 0,
        comision_heka_facturacion: 0,
        comision_transportadora: 0,
        total_pagado: 0,
        comision_natural_heka: 0,
        cuatro_x_mil_banco: 0,
        cuatro_x_mil_transp: 0,
        iva: 0
    });
    
    actualizacion.cantidad_pagos = pagos.length;

    console.log(actualizacion);

    await db.collection("paquetePagos").doc(id)
    .update(actualizacion)
    .then(() => console.log("Paquete actualizado correctamente"));
}

async function obtenerPagoPorIdPaquete(id) {

    let result = [];

    for ( let t of transportadorasTo ) {
        await db.collection("pagos")
        .doc(t).collection("pagos")
        .where("idPaquetePago", "==", id)
        .get()
        .then(q => {
            q.forEach(d => {
                result.push(d.data());
            });
        })
    }

    return result;
}