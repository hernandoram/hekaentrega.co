const FirebaseServiceConection = require("../keys/firebase");
const firebaseService = new FirebaseServiceConection();
const db = firebaseService.dbFirebase();

exports.imprimirRotuloPunto = async (req, res) => {
    const numeroGuia = req.params.id_heka;

    if(!numeroGuia) return res.send("Se necesita el número de guía.");
  
    let guias = new Array();

    await db.collectionGroup("guias").where("id_heka", "==", numeroGuia)
    .get().then(q => {
        q.forEach(doc => {
            const guia = doc.data();
            guia.vol = guia.alto * guia.ancho * guia.largo;
            
            guias.push(guia);
        })
    })

    res.render("printRotuloPunto", {guias, layout:"printer"});
}