import {
    db,
    doc,
    collection,
    getDoc,
    getDocs,
    where,
    query,
  } from "/js/config/initializeFirebase.js";

/**
 * La función `comprobarGuiaPagada` comprueba si se ha pagado un determinado número de guía para un
 * determinado transportista.
 * @param objToSend - Un objeto que contiene las siguientes propiedades:
 * @returns un valor booleano. Si el documento existe en la colección especificada en Firestore,
 * devolverá verdadero. De lo contrario, devolverá falso.
 */
export async function comprobarGuiaPagada(objToSend) {
    const transportadora = objToSend["TRANSPORTADORA"];
    const numeroGuia = objToSend["GUIA"];
    
    const guiaPaga = await getDoc(
        doc(
          collection(doc(collection(db, "pagos"), transportadora.toUpperCase()), "pagos"),
          numeroGuia.toString()
        )
      );

    if(guiaPaga.exists) {
        return true;
    }

    return false;
}

/**
 * Recibe como parámetro el centro de costo y procura revisar cuantos centro de costos se encuentran registrados en la base de datos
 * @param {string} centro_de_costo - El mcentro de costo que se quiere revisar (no deberñia haber nunca más de uno):
 * @returns {Promise<number>} la cantidad de usuarios registrados bajo el centro de costo indicado
 */
export async function cantidadDeUsuariosPorCentroDeCosto(centro_de_costo) {
    return await getDocs(
        query(collection(db, "usuarios"), where("centro_de_costo", "==", centro_de_costo))
      ).then((querySnapshot) => {
        return querySnapshot.size;
      });
}

/**
 * La función `guiaExiste` verifica si una determinada guía existe en una colección de Firestore.
 * @param guia - El parámetro "guia" es un objeto que contiene una propiedad llamada "GUIA".
 * @returns una promesa que se resuelve en los datos del primer documento encontrado en la colección de
 * Firestore que coincide con la consulta especificada.
 */
export async function guiaExiste(guia) {
    const numeroGuia = guia["GUIA"];
    return await db.collectionGroup("guias")
    .where("numeroGuia", "==", numeroGuia.toString()).limit(1).get()
    .then(querySnapshot => {
        let guia;
        querySnapshot.forEach(doc => guia = doc.data());

        return guia;
    });
}

export async function cantidadFacturasencontradas(key, value) {
    return await getDocs(
        query(collection(db, "paquetePagos"), where(key, "==", value))
      ).then((querySnapshot) => {
        return querySnapshot.size;
      });
}