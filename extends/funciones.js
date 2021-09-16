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
  const ultimo_mov = toUpdate.movimientos[toUpdate.movimientos.length - 1];

  toUpdate.transportadora = doc.data().transportadora || "SERVIENTREGA";
  toUpdate.centro_de_costo = doc.data().centro_de_costo;
  toUpdate.id_heka = doc.id;

  toUpdate.mostrar_usuario = Boolean(revisarNovedad(ultimo_mov, doc.data().transportadora));

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


/** FUNCIONES */
function revisarNovedad(mov, transp) {
  if(transp === "INTERRAPIDISIMO") {
      return mov.Motivo;
  } else {
      return mov.TipoMov === "1";
  }
}