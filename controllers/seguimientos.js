const firebase = require("../firebase");
const db = firebase.firestore();
const cron = require("node-cron");

const servientregaCtrl = require("./servientrega");
const interrapidisimoCtrl = require("./inter");


cron.schedule("00 */6 * * *", () => {
  let d = new Date();
  firebase.firestore().collection("reporte").add({
    mensaje: "Comenzó el cron de actualización de guías",
    fecha: d
  })
  console.log("Se Actualizaron los movimientos de las guías: ", d);
  actualizarMovimientosGuias(d).then((detalles) => {
    console.log(detalles);
    firebase.firestore().collection("reporte").add(detalles);
   });
});

cron.schedule("0 0 * * 0", () => {
  let d = new Date();
  console.log("Se Actualizaron los movimientos semanales de las guías: ", d);
  actualizarMovimientosGuias(d, true).then((detalles) => {
    console.log(detalles);
    detalles.actulización_semanal = true;
    firebase.firestore().collection("reporte").add(detalles);
   });
});

// actualizarMovimientosGuias(new Date()).then((detalles) => {
//     console.log("DETALLES DE ACTUALIZACIÓN: ", detalles);
//      firebase.firestore().collection("reporte").add(detalles);
//      process.exit();
// });
async function actualizarMovimientosGuias(d, general) {
    let inicio_func = new Date().getTime();
    let referencePpal = firebase.firestore().collectionGroup("guias")

    //Comenzamos con la selección del tipo de consulta y/o filtrado a generar
    if(general) {
    //Para aactualizar las guías de 7 días de antiguedad sin importar el estado
    referencePpal = referencePpal.orderBy("timeline").startAt(d.getTime() - 69.12e7)
    .endAt(d.getTime())
    } else {
    referencePpal = referencePpal
    .where("seguimiento_finalizado", "!=", true)
    // .orderBy("estado")
    // .where("estado", "not-in", ["ENTREGADO", "ENTREGADO A REMITENTE"])
    // .where("transportadora", "==", "INTERRAPIDISIMO")
    // .where("centro_de_costo", "==", 'SellerNatalia')
    // .where("numeroGuia", "in", ["2112740521"])
    // .limit(500)
    }
    
    try {
        let resultado = await referencePpal.get()
       
        console.log(resultado.size);
        let faltantes = resultado.size
        // throw "no babe"

        //Objeto que se va llenando paral luego mostrarme los detalles del proceso
        let consulta = {
            guias_est_actualizado: [],
            guias_mov_actualizado: [],
            guias_sin_mov: [],
            guias_con_errores: [],
            usuarios: [],
            total_consulta: resultado.size,
            fecha: d,
            servientrega: 0,
            interrapidisimo: 0
        }
        
        //Aquí se alamcenarán la respuesta obtenida de cada proceso de actualización
        let resultado_guias = new Array();
        
        //Itero entre todos los registros de guías encontrados
        for await (let doc of resultado.docs) {
            //Verifico que exista un número de guía
            if (doc.data().numeroGuia || doc.data().transportadora !== "INTERRAPIDISIMO") {
                if (consulta.usuarios.indexOf(doc.data().centro_de_costo) == -1) {
                    consulta.usuarios.push(doc.data().centro_de_costo);
                }
                
                let guia;
                if(doc.data().transportadora && doc.data().transportadora === "INTERRAPIDISIMO") {
                    consulta.interrapidisimo ++;
                    guia = await interrapidisimoCtrl.actualizarMovimientos(doc);
                } else {
                    consulta.servientrega ++
                    guia = await servientregaCtrl.actualizarMovimientos(doc);
                }

                /* Es IMPORTANTE que "guia" me devuelva un arreglo de objeto con longitud de 2
                -si devuelte un arreglo de longitud 1 es porque hubo un error 
                -el primer arreglo me devuelve el estado de la actualización de la guía
                -el segundo el estado de la actualizacion del movimiento
                - Los estados que debería devolver son: Est.A (estado actualizado), Mov.A (movimiento actualizado),
                    Sn.Mov (Sin movimiento), en el objeto este es el campo importante que me categoriza las estadísticas
                    y la revisión de los estados que se actualizan*/
                resultado_guias.push(guia);
            }

            faltantes--;
            console.log(faltantes);
        }
        
        console.log(resultado_guias)
        let guias_procesadas = resultado_guias;
        for(let guia of guias_procesadas) {
            if(guia.length == 1) {
                consulta.guias_con_errores.push(guia[0].guia);
            } else {
                let modo_estado = guia[0], modo_movimientos = guia[1];
                if(modo_estado.estado == "Est.A") {
                    consulta.guias_est_actualizado.push(guia[0].guia)
                } 
        
                if(modo_movimientos.estado == "Mov.A") {
                    consulta.guias_mov_actualizado.push(modo_movimientos.guia);
                } else if (modo_movimientos.estado == "Sn.Mov") {
                    consulta.guias_sin_mov.push(modo_movimientos.guia);
                }
            }
        }
        
        
        let final_func = new Date().getTime();
        consulta.tiempo_ejecucion  = (final_func - inicio_func) + "ms";
        
        consulta.mensaje = `Se han actualizado: los estados de ${consulta.guias_est_actualizado.length} Guias, 
        los movimientos de ${consulta.guias_mov_actualizado.length} Guias.
        Hubo errores en ${consulta.guias_con_errores.length} Guias.
        De un total de ${consulta.total_consulta} registradas cuyo proceso no haya
        sido finalizado en ${consulta.usuarios.length} usuarios.
        Tiempo de ejecución: ${consulta.tiempo_ejecucion}`;
        
        // console.log("246",consulta);
        
        return consulta;
    } catch (error) {
        console.log(error);
        firebase.firestore().collection("reporte").add({
            error,
            mensaje: "Hubo un error al actualizar."
        })
        console.log("Hubo un error,es probable que no se haya actualizado nada.")
    }
}

module.exports = actualizarMovimientosGuias;