///SErvientrega
let express = require("express");
const app = express();
let router = express.Router();
let request = require("request");
let parseString = require("xml2js").parseString;
const bodyParser = require("body-parser");
const cron = require("node-cron");

const firebase = require("../firebase");
const db = firebase.firestore()

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

function consultarGuia(numGuia){
    let res=`<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
      <ConsultarGuia xmlns="http://servientrega.com/">
      <NumeroGuia>${numGuia}</NumeroGuia>
      </ConsultarGuia>
      </soap:Body>
    </soap:Envelope>`;

    return res;
}

function estadoGuia(numGuia){
  return `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <EstadoGuia xmlns="http://servientrega.com/">
        <ID_Cliente>1072497419</ID_Cliente>
        <guia>${numGuia}</guia>
      </EstadoGuia>
    </soap:Body>
  </soap:Envelope>`
}

var EncriptarContrasena = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
<soap:Body>
<EncriptarContrasena xmlns="http://tempuri.org/">
<strcontrasena>Stv1234</strcontrasena>
</EncriptarContrasena>
</soap:Body>
</soap:Envelope>`

var consultarGuiaPorNumDoc = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
  <AuthHeader xmlns="http://tempuri.org/">
  <login>KatheRecaudo</login>
  <pwd>Yt0208@s</pwd>
  <Id_CodFacturacion>SER122990</Id_CodFacturacion>
  <Nombre_Cargue></Nombre_Cargue>
  </AuthHeader>
  </soap:Header>
  <soap:Body>
  <ConsultarGuiasByNumDocumento xmlns="http://tempuri.org/">
  <numeroGuia>2102566145</numeroGuia>
  <Ide_CodFacturacion>SER122990</Ide_CodFacturacion>
  </ConsultarGuiasByNumDocumento>
  </soap:Body>
  </soap:Envelope>`

let url = "http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx";
let id_cliente = "1072497419"


//  Prueba para revisar las guias por id_heka
// request.post(url + "/ConsultarGuiaPorNumeroReferenciaCliente", {
//   form: {
//     Id_Cliente: "1072497419",
//     Numero_referencia: "100"
//   }
// }, (err, response, body) => {
//   if(err) {
//     return console.dir(err);
//   }
//   console.log(body);
//   console.log(response.headers);
// })


cron.schedule("00 10 * * *", () => {
  let d = new Date();
  console.log("Se Actualizaron las guías: ", d);
  actualizarEstadosGuias(d);
})

cron.schedule("30 */6 * * *", () => {
  let d = new Date();
  console.log("Se Actualizaron las Novedades: ", d);
  actualizarNovedades(d);
})

cron.schedule("00 00 00 * * 0", () => {
  let d = new Date();
  console.log("Se Actualizaron las Novedades: ", d);
  limpiarNovedades(d);
})


// actualizarEstadosGuias(new Date());
function actualizarEstadosGuias(d) {
  firebase.firestore().collectionGroup("guias").orderBy("estado").where("estado", "not-in", ["ENTREGADO", "ENTREGADO A REMITENTE"]).get()
  .then(querySnapshot => {
    let referencia = firebase.firestore().collection("reporte").doc();
    console.log(querySnapshot.size);
    let consulta = {
      guias: [],
      usuarios: [],
      fecha: d,
      total: querySnapshot.size
    }
    querySnapshot.forEach(doc => {
      if(consulta.usuarios.indexOf(doc.data().centro_de_costo) == -1) {
        consulta.usuarios.push(doc.data().centro_de_costo);
      }

      request.post("http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx/ConsultarGuiaPorNumeroReferenciaCliente", {
        form: {
          Id_Cliente: "1072497419",
          Numero_referencia: doc.id
        }
      }, (err, response, body) => {
        if(err) {
          return console.dir(err);
        }
        parseString(body, (error, result) => {
          if(error){
            return console.dir(error);
          }
          if(result) {
            actualizar = result.InformacionGuiaMov;
            if(actualizar.NumGui && parseInt(actualizar.NumGui) != 0) {
              console.dir("Id_heka / numero de Guía: " + doc.id + " / " + actualizar.NumGui[0]);
              console.dir("Estado", actualizar.EstAct[0]);
              // console.log(result.InformacionGuiaMov);
              firebase.firestore().doc(doc.ref.path).update({
                numeroGuia: actualizar.NumGui[0],
                estado: actualizar.EstAct[0],
                ultima_actualizacion: d
              }).then(() => {
                consulta.guias.push(doc.id + "/" + doc.data().numeroGuia);
                consulta.mensaje = "Se han actualizado exitósamente " + consulta.guias.length
                + " Guías de " + consulta.total + " encontradas cuyos estados no son: \"Entregado o entregado remitente\"."
                + " De " + consulta.usuarios.length + " usuarios."
                
                referencia.set(consulta);
              })
            }
          }
        })
      })
    })
    return consulta
  }) 
}

// actualizarNovedades(new Date());
function actualizarNovedades(d) {
  firebase.firestore().collectionGroup("guias")
  .where("estado", "==", "EN PROCESAMIENTO")
  // .where("centro_de_costo", "==", "SellerWitotoAccesoriosYArtesanías ")
  .get()
  .then(querySnapshot => {
    let referencia = firebase.firestore().collection("reporte").doc();
    console.log(querySnapshot.size);
    let consulta = {
      novedades: [],
      novedades_eliminadas: [],
      usuarios: [],
      error: [],
      total_consulta: querySnapshot.size,
      fecha: d
    }

    querySnapshot.forEach(doc => {
      if(doc.data().numeroGuia) {
        if(consulta.usuarios.indexOf(doc.data().centro_de_costo) == -1) {
          consulta.usuarios.push(doc.data().centro_de_costo);
        }
        request.post({
          "headers": {"Content-Type": "text/xml"},
          "url": url + "/EstadoGuia",
          form: {
            Id_Cliente: id_cliente,
            guia: doc.data().numeroGuia
          }
        }, (err, response, body) => {
          if(err) {
            return console.dir(err)
          }
          // console.log(body)
          parseString(body, (error, result) => {
            // let path = doc.ref.path.split("/");
            // console.log(result);
            let respuestaOk = result["DataSet"]["diffgr:diffgram"][0].NewDataSet;
            if(respuestaOk) {
              let estadoGuia = result["DataSet"]["diffgr:diffgram"][0].NewDataSet[0].EstadosGuias[0];
              console.log(estadoGuia);
              let fechaAnt = doc.data().novedad ? doc.data().novedad.fecha : 0
              console.log(fechaAnt)
              if(estadoGuia.Fecha_Entrega && estadoGuia.Guia && estadoGuia.Novedad) {
                if(estadoGuia.Guia[0] != "0" && new Date(fechaAnt).getTime() < new Date(estadoGuia.Fecha_Entrega[0]).getTime()) {
                  console.log("Se va a actualizar correctamente en las novedades de: " + doc.ref.parent.parent.path)
                  
                  doc.ref.parent.parent.collection("novedades").doc(doc.id).set({
                    novedad: estadoGuia.Novedad[0],
                    fecha: estadoGuia.Fecha_Entrega[0],
                    guia: estadoGuia.Guia[0],
                    id_heka: doc.id,
                    centro_de_costo: doc.data().centro_de_costo,
                    ultima_actualizacion: d
                  }).then(() => {
                    consulta.novedades.push(estadoGuia.Guia[0] + "/" + doc.id);
                    consulta.mensaje = mensaje(consulta.novedades.length, consulta.novedades_eliminadas.length, 
                      consulta.error.length, consulta.total_consulta, consulta.usuarios.length);
                      
                      referencia.set(consulta);
                  })
                }
              } else if (estadoGuia.Fecha_Entrega && estadoGuia.Guia && !estadoGuia.Novedad) {
                console.log("Se van a eliminar correctamente en las novedades de: " + doc.ref.parent.parent.path)
                doc.ref.parent.parent.collection("novedades").doc(doc.id).delete().then(() => {
                  consulta.novedades_eliminadas.push(estadoGuia.Guia[0] + "/" + doc.id);
                  consulta.mensaje = mensaje(consulta.novedades.length, consulta.novedades_eliminadas.length, 
                    consulta.error.length, consulta.total_consulta, consulta.usuarios.length);
                    
                  referencia.set(consulta);
                });
              }
            }  else {
              consulta.error.push(doc.data().numeroGuia + "/" + doc.id);
              consulta.mensaje = mensaje(consulta.novedades.length, consulta.novedades_eliminadas.length, 
                consulta.error.length, consulta.total_consulta, consulta.usuarios.length);

              referencia.set(consulta);
              
              console.log("El servidor tardó en responder");
            }

            consulta.mensaje = mensaje(consulta.novedades.length, consulta.novedades_eliminadas.length, 
              consulta.error.length, consulta.total_consulta, consulta.usuarios.length);

          })
        })


      }
    })
  })
  function mensaje(novedades, novedades_eliminadas, error, total, usuarios) {
    return `Se han actualizado ${novedades} novedades,
    eliminado ${novedades_eliminadas} y ${error} han sido fallidas,
    de un total de ${total} registradas cuyo estado es: "En procesamiento" en ${usuarios} usuarios.
    `
  }
}

function limpiarNovedades(d) {
  firebase.firestore().collectionGroup("novedades").get()
  .then(novedadSnapshot => {
    let referencia = firebase.firestore().collection("reporte").doc();
    console.log(novedadSnapshot.size);
    let consulta = {
      novedades_eliminadas: [],
      total_consulta: novedadSnapshot.size,
      fecha: d
    }
    
    novedadSnapshot.forEach(novedad => {
      novedad.ref.parent.parent.collection("guias").doc(novedad.id).get()
      .then(doc => {
        let estado = doc.data().estado;
        if(estado == "ENTREGADO" || estado == "ENTREGADO A REMITENTE") {
          firebase.firestore().doc(novedad.ref.path).delete()
          .then(() => {
            consulta.novedades_eliminadas.push(novedad.id + "/" + novedad.data().guia);
            consulta.mensaje = "Se han eliminado " +consulta.novedades_eliminadas.length
            + " novedades de " +consulta.total_consulta+ " analizadas.";

            referencia.set(consulta);
          })
        }
      })
    })
  })
}


router.post("/consultarGuia", (req, res) => {
  request.post({
    "headers": { "content-type": "text/xml" },
    "url": url,
    "body": consultarGuia(req.body.guia) 
  }, (error, response, body) => {
    if(error) {
        return console.dir(error);
    }
    console.log(response.statusCode);
    // console.log(JSON.stringify(body));
    res.send(JSON.stringify(body));
  });
})

router.post("/estadoGuia", (req, res) => {
  console.log(req.body.guia);
  request.post({
    "headers": {"Content-Type": "text/xml"},
    "url": url,
    "body": estadoGuia(req.body.guia)
  }, (err, response, body) => {
    if(err) {
      return console.dir(err)
    }

    res.send(JSON.stringify(body));
  })
})

let ejemplo = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthHeader xmlns="http://tempuri.org/">
      <login>Luis1937</login>
      <pwd>>MZR0zNqnI/KplFlYXiFk7m8/G/Iqxb3O</pwd>
      <Id_CodFacturacion>SER408</Id_CodFacturacion>
      <Nombre_Cargue></Nombre_Cargue>
    </AuthHeader>
  </soap:Header>
  <soap:Body>
    <GuiasPendientesXManifestar xmlns="http://tempuri.org/">
      <FechaInicial>string</FechaInicial>
      <FechaFinal>string</FechaFinal>
      <mensaje>string</mensaje>
      <idTrazaAuditoria>string</idTrazaAuditoria>
      <usuarioTrazaAuditoria>string</usuarioTrazaAuditoria>
      <urlTrazaAuditoria>string</urlTrazaAuditoria>
    </GuiasPendientesXManifestar>
  </soap:Body>
</soap:Envelope>`;

let urlEjemplo = "http://web.servientrega.com:8081/GeneracionGuias.asmx";

router.get("/ejemplo", (req, res) => {
    request.post({
        "headers": {"Content-Type" : "text/xml"},
        "url": urlEjemplo,
        "body": ejemplo
    }, (err, response, body) => {
        if(err) {
            return console.dir(err);
        }

        console.log(response.statusCode);
        res.send(body);
    })
})
//2102566145
module.exports = router;