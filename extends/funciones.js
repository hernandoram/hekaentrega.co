const {agregarEstadistica} = require("./estadisticas");
const fetch = require("node-fetch");

const {revisarNovedadAsync, revisarEstadoFinalizado, guiaEnNovedad, actualizarReferidoPorGuiaEntregada} = require("./manejadorMovimientosGuia");
const { templateMessage } = require("../controllers/messageBird");

exports.segmentarString = (base64, limite = 1000) => {
  if (!base64 || typeof base64 !== "string") return new Array(0);
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
  await actualizarReferidoPorGuiaEntregada(doc.data(), toUpdate);

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

  const novedad = guiaEnNovedad(toUpdate.movimientos, doc.data().transportadora).enNovedad;

  toUpdate.mostrar_usuario = novedad && !revisarEstadoFinalizado(toUpdate.estadoActual);
  toUpdate.enNovedad = novedad && !revisarEstadoFinalizado(toUpdate.estadoActual);

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
      nombre: `${data.datos_oficina.nombres.trim()} ${data.datos_oficina.apellidos.trim()}`,
      ciudad: data.datos_oficina.ciudad,
      direccion: `${data.datos_oficina.direccion.trim()}, ${data.datos_oficina.barrio.trim()}`,
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
      nombre: data.nombreD.trim(),
      tipo_documento: data.tipo_doc_dest,
      numero_documento: data.identificacionD,
      direccion: data.direccionD.trim(),
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
  // return;
  try {
    const parametros = [guia.transportadora, guia.numeroGuia].map(p => ({default: p}));
    templateMessage("pedido_en_oficina", guia.telefonoD, parametros);
  } catch {
    console.log("Error enviando mensaje");
  }
}

exports.notificarNovedad = (guia, mensaje) => {
  // return;
  try {
    const parametros = [guia.transportadora, guia.numeroGuia, mensaje].map(p => ({default: p}));
    templateMessage("novedad_envio_completa", guia.telefonoD, parametros);
  } catch {
    console.log("Error enviando mensaje");
  }
}

exports.urlToPdfBase64 = async (url) => {
  const res = await fetch(url).then(r => {
      return r.arrayBuffer();
  }).catch(e => console.log(e));

  const buff = Buffer.from(res, "utf8");
  const base64 = buff.toString("base64");

  // console.log("base64 => ", base64);
  return base64; 
}