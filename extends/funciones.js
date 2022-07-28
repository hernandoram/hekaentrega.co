const {agregarEstadistica} = require("./estadisticas");
const {revisarNovedadAsync, revisarEstadoFinalizado, guiaEnNovedad} = require("./manejadorMovimientosGuia");

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
  toUpdate.daneOrigen = doc.data().dane_ciudadR || "NA";
  toUpdate.daneDestino = doc.data().dane_ciudadD || "NA";
  toUpdate.id_heka = doc.id;
  toUpdate.fechaUltimaActualizacion = new Date();

  const novedad = guiaEnNovedad(toUpdate.movimientos, doc.data().transportadora);

  toUpdate.mostrar_usuario = novedad && !revisarEstadoFinalizado(toUpdate.estadoActual);
  toUpdate.enNovedad = Boolean(novedad);

  return await doc.ref.parent.parent.collection("estadoGuias")
  .doc(doc.id)
  // .get()
  .set(toUpdate)
  .then(() => {
    // console.log(doc.data());
    if(revisarEstadoFinalizado(toUpdate.estadoActual)) {
      agregarEstadistica(doc, toUpdate);
    }

    return {
      estado: "Mov.A",
      guia: doc.id + " / " + doc.data().numeroGuia,
      guardado: toUpdate
    };

  }).catch(err => {
    return {
      estado: "Mov.N.A",
      guia: doc.id + " / " + doc.data().numeroGuia
    };
  });
}

exports.estandarizarFecha = (date, specialFormat, parseHour) => {
  const fecha = new Date(date || new Date().getTime());
  
  if(isNaN(fecha.getTime())) return date;
  
  const norm = n => n < 10 ? "0" + n : n;
  const format = {
    D: fecha.getDate(),
    DD: norm(fecha.getDate()),
    M: fecha.getMonth() + 1,
    MM: norm(fecha.getMonth() + 1),
    YY: fecha.getFullYear().toString().slice(-2),
    YYYY: fecha.getFullYear(),
    H: fecha.getHours(),
    HH: norm(fecha.getHours()),
    m: fecha.getMinutes(),
    mm: norm(fecha.getMinutes()),
    s: fecha.getSeconds(),
    ss: norm(fecha.getSeconds()),
  }

  let res = format.DD + "/" + format.MM + "/" + format.YYYY;
  let originalHour = parseInt(format.H);
  if(parseHour) {
    let h = originalHour
    h = h ? h : 12 
    const hourParser = h > 12 ? h - 12 : h
    format.HH = norm(hourParser);
    format.H = hourParser;
  }

  if(specialFormat) {
    res = "";
    const str = specialFormat.match(/(\w+)/g);
    const sign = specialFormat.match(/([^\w+])/g);

    str.forEach((v,i) => {
      res += format[v];
      if(sign && sign[i]) {
        res += sign[i];
      }
    });

    if(parseHour) {
      res += originalHour > 12 ? "p.m" : "a.m";
    }
    
  }

  return res;
}

exports.transformarDatosDestinatario = data => {
  if (data.oficina) {
    let tipoDocument;
    switch (data.datos_oficina.tipo_documento) {
      case "CC":
        tipoDocument = 2;
        break;
      case "NIT":
        tipoDocument = 1;
        break;
      default:
        tipoDocument = null;
        break;
    }
    
    const datos_oficina = {
      nombre: `${data.datos_oficina.nombres} ${data.datos_oficina.apellidos}`,
      ciudad: data.datos_oficina.ciudad,
      direccion: `${data.datos_oficina.direccion}, ${data.datos_oficina.barrio}`,
      tipo_documento: tipoDocument,
      numero_documento: data.datos_oficina.numero_documento,
      celular: data.datos_oficina.celular2 || data.datos_oficina.celular,
      telefono: data.datos_oficina.celular,
      correo: data.datos_oficina.correo,
      type: "CONVENCIONAL"
    };
    return datos_oficina;
  } else {
    const datos_destinatario = {
      nombre: data.nombreD,
      tipo_documento: data.tipo_doc_dest,
      numero_documento: data.identificacionD,
      direccion: data.direccionD,
      ciudad: data.ciudadD,
      telefono: data.telefonoD,
      celular: data.celularD,
      correo: data.correoD,
      type: data.type
    };
    return datos_destinatario;
  }
};

exports.notificarEntregaEnOficina = (guia) => {
  const mensaje = "Tu envío "+guia.transportadora+" con número "+guia.numeroGuia+" se encuentra en la oficina principal de tu ciudad, para que sea reclamado máximo en 6 días hábiles.";
  console.log(mensaje);

  // return;
  singleMessage("57"+guia.telefonoD, mensaje);
}