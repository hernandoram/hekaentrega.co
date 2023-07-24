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
    
    const guiaPaga = await firebase.firestore().collection("pagos").doc(transportadora.toLocaleLowerCase())
    .collection("pagos").doc(numeroGuia.toString()).get();

    if(guiaPaga.exists) {
        return true;
    }

    return false;
}

/**
 * La función `guiaExiste` verifica si una determinada guía existe en una colección de Firestore.
 * @param guia - El parámetro "guia" es un objeto que contiene una propiedad llamada "GUIA".
 * @returns una promesa que se resuelve en los datos del primer documento encontrado en la colección de
 * Firestore que coincide con la consulta especificada.
 */
export async function guiaExiste(guia) {
    const numeroGuia = guia["GUIA"];
    return await firebase.firestore().collectionGroup("guias")
    .where("numeroGuia", "==", numeroGuia.toString()).limit(1).get()
    .then(querySnapshot => {
        let guia;
        querySnapshot.forEach(doc => guia = doc.data());

        return guia;
    });
}