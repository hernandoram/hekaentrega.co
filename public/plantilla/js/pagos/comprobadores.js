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

export async function guiaExiste(guia) {
    const numeroGuia = guia["GUIA"];
    return await firebase.firestore().collectionGroup("guias")
    .where("numeroGuia", "==", numeroGuia).limit(1).get()
    .then(querySnapshot => {
        let guia;
        querySnapshot.forEach(doc => guia = doc.data());

        return guia;
    });
}