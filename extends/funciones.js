exports.segmentarString = (base64, limite = 1000) => {
    if (!base64) return new Array(0);
    let initial = 0;
    let final = limite;
    let parts = Math.floor(base64.length / limite);
  
    let res = new Array();
  
    for(let i = 0; i < parts; i ++) {
      res.push(base64.substring(initial, final));
      initial += limite;
      final += limite;
    };
  
    res.push(base64.substring(initial));
  
    return res
}

exports.actualizarEstado = async (doc, toUpdate) => {
  return await doc.ref.parent.parent.collection("guias")
  .doc(doc.id).update(toUpdate)
  .then(() => {
    // console.log(doc.data());
    return {
      estado: "Est.A", //Estado Actualizado
      guia: doc.id + " / " + doc.data().numeroGuia
    };

  }).catch(err => {
    return {
      estado: "Est.N.A", //Estado no actualizado
      guia: doc.id + " / " + doc.data().numeroGuia
    };
  });
}

exports.actualizarMovimientos = async (doc, toUpdate) => {
  return await doc.ref.parent.parent.collection("estadoGuias")
  .doc(doc.id)
  // .get()
  .set(toUpdate)
  .then(() => {
    // console.log(doc.data());
    return {
      estado: "Mov.A",
      guia: doc.id + " / " + doc.data().numeroGuia
    };

  }).catch(err => {
    return {
      estado: "Mov.N.A",
      guia: doc.id + " / " + doc.data().numeroGuia
    };
  });
}