const { estadosFinalizacion } = require("./manejadorMovimientosGuia.js");
const firebase = require("../keys/firebase");
const db = firebase.firestore();

const referencePagos = db.collection("pendientePorPagar");
async function inscripcionPago(guia) {
    const { type, numeroGuia, estado, detalles, centro_de_costo } = guia;
    const deuda = guia.debe;

    if(!["SellersublimacionesestampadocalzadoyalgomasVRRAMOS"].includes(centro_de_costo)) return; // Inicialmente solo estará disponibles para centros de costo selectos
    
    if( detalles.versionCotizacion == 2 ) return; // Por ahora ignoraremos los pagos que se harán sobre la versión 2

    // Ignorar aquellas que no presenten número de guía
    if(!numeroGuia) return;

    // Ignorar la convencionales
    if(type === "CONVENCIONAL") return;

    // Si la guía no fue entregada ni devuelta
    if(!estadosFinalizacion.entregados.includes(estado) && !estadosFinalizacion.devolucion.includes(estado)) return;
    
    // Ignorar aquelas que hayan sido pagadas;
    if(type === "PAGO CONTRAENTREGA" && deuda === 0) return;

    // Validamos también en base de datos si se encuentra pagada
    const guiaPagada = await comprobarGuiaPagada(informacionPago);
    if(guiaPagada) return;

    const informacionPago = transformarGuiaAPago(guia);

    await guardarPagoPendiente(informacionPago);
}

function transformarGuiaAPago(guia)  {  
    const detalles = guia.detalles;
    const esDevolucion = estadosFinalizacion.devolucion.includes(guia.estado);
    const costoDevolucion = guia.detalles.costoDevolucion; // El costo de devolución debe ser negativo
  
    const totalPagar = esDevolucion 
      ? -costoDevolucion
      : guia.detalles.recaudo - guia.detalles.total;
  
    const envioTotal = esDevolucion
      ? costoDevolucion
      : guia.detalles.total;
  
    const valorRecaudo = esDevolucion
      ? 0
      : guia.detalles.recaudo;
  
    let comisionHeka = guia.detalles.comision_heka;
  
    if(esDevolucion) {
      switch(guia.transportadora) {
        case "COORDINADORA": 
          comisionHeka = 2000;
        break;
  
        case "ENVIA":
          comisionHeka = Math.round(detalles.flete * 0.25); // Cuando es devolución con envía la comisión heka pasa a ser el 25%
        break;
    
        case "INTERRAPIDISIMO":
          comisionHeka = 1000;
        break;
      }
    }
    
    return {
      GUIA: guia.numeroGuia,
      "REMITENTE": guia.centro_de_costo,
      TRANSPORTADORA: guia.transportadora,
      "CUENTA RESPONSABLE": guia.cuenta_responsable,
      "COMISION HEKA": comisionHeka,
      RECAUDO: valorRecaudo,
      "ENVÍO TOTAL": envioTotal,
      "TOTAL A PAGAR": totalPagar,
      causaPago: esDevolucion ? "DEVOLUCION" : "ENTREGA"
    }
}

/**
 * La función `comprobarGuiaPagada` comprueba si se ha pagado un determinado número de guía para un
 * determinado transportista.
 * @param objToSend - Un objeto que contiene las siguientes propiedades:
 * @returns un valor booleano. Si el documento existe en la colección especificada en Firestore,
 * devolverá verdadero. De lo contrario, devolverá falso.
 */
async function comprobarGuiaPagada(guia) {
    const {transportadora, numeroGuia} = guia;

    const guiaPaga = await db.collection("pagos").doc(transportadora.toUpperCase())
    .collection("pagos").doc(numeroGuia.toString()).get();

    if(guiaPaga.exists) {
        return true;
    }

    return false;
}

async function guardarPagoPendiente(guiaDePago) {
    console.log("Se va a guardar: ", guiaDePago);
    const numeroGuia = guiaDePago["GUIA"].toString();
    const reference = referencePagos.doc(numeroGuia);
    return reference.set(guiaDePago);
}

module.exports = { inscripcionPago }
