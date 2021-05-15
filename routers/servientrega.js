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

const rastreoEnvios = "http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx";
const generacionGuias = "http://web.servientrega.com:8081/generacionguias.asmx";
const genGuiasPrueba = "http://190.131.194.159:8059/GeneracionGuias.asmx";
const id_cliente = "1072497419"


//A partir de aquí habrán solo funciones

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

cron.schedule("00 10 * * *", () => {
  let d = new Date();
  console.log("Se Actualizaron las guías: ", d);
  actualizarEstadosGuias(d);
})

cron.schedule("30 */6 * * *", () => {
  let d = new Date();
  console.log("Se Actualizaron los movimientos de las guías: ", d);
  actualizarMovimientosGuias(d);
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
          "url": rastreoEnvios + "/EstadoGuia",
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

// actualizarMovimientosGuias(new Date());
function actualizarMovimientosGuias(d) {
  firebase.firestore().collectionGroup("guias")
  .where("estado", "==", "EN PROCESAMIENTO")
  // .where("centro_de_costo", "==", "SellerWitotoAccesoriosYArtesanías")
  // .where("numeroGuia", "==", "2102566956")
  .get()
  .then(querySnapshot => {
    let referencia = firebase.firestore().collection("reporte").doc();
    console.log(querySnapshot.size);
    let consulta = {
      guias: [],
      usuarios: [],
      total_consulta: querySnapshot.size,
      fecha: d
    }

    querySnapshot.forEach(doc => {
      if(doc.data().numeroGuia) {
        if(consulta.usuarios.indexOf(doc.data().centro_de_costo) == -1) {
          consulta.usuarios.push(doc.data().centro_de_costo);
        }
        request.post({
          // "headers": {"Content-Type": "text/xml"},
          "url": rastreoEnvios + "/ConsultarGuia",
          form: {
            NumeroGuia: doc.data().numeroGuia
          }
        }, (err, response, body) => {
          if(err) {
            return console.dir(err)
          }
          // console.log(body)
          parseString(body, (error, result) => {
            // let path = doc.ref.path.split("/");
            let data = result.InformacionGuiaMov;
            let movimientos = data.Mov[0].InformacionMov;
            // console.log(data);
            if(movimientos) {
              for(let movimiento of movimientos) {
                for(let x in movimiento) {
                  movimiento[x] = movimiento[x][0];
                }
              }

              let data_to_fb = {
                numeroGuia: data.NumGui[0],
                fechaEnvio: data.FecEnv[0],
                ciudadD: data.CiuDes[0],
                nombreD: data.NomDes[0],
                direccionD: data.DirDes[0],
                estadoActual: data.EstAct[0],
                fecha: data.FecEst[0],
                id_heka: doc.id,
                movimientos
              }; 

              console.log(data_to_fb);

              doc.ref.parent.parent.collection("estadoGuias").doc(doc.id)
              // .get()
              .set(data_to_fb)
              .then(() => {
                console.log("se ha subido el documento correctamente");
                // console.log(doc.data());
                consulta.guias.push(doc.id + " / " + doc.data().numeroGuia)
                consulta.mensaje = `Se han actualizado ${consulta.guias.length} Estados de Guias,
                de un total de ${consulta.total_consulta} registradas cuyo estado es: 
                "En procesamiento" en ${consulta.usuarios.length} usuarios.`
                console.log(consulta);
                referencia.set(consulta);
              });
            }
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


function generarGuia(datos, prueba) {
  let auth_header = prueba ? `<ns1:AuthHeader>
        <ns1:login>Luis1937</ns1:login>
        <ns1:pwd>MZR0zNqnI/KplFlYXiFk7m8/G/Iqxb3O</ns1:pwd>
        <ns1:Id_CodFacturacion>SER408</ns1:Id_CodFacturacion>
        <ns1:Nombre_Cargue></ns1:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
        CARGUE APARECERÁ EN SISCLINET-->
      </ns1:AuthHeader>` 
  : `<ns1:AuthHeader>
      <ns1:login>1072497419SUC1</ns1:login>
      <ns1:pwd>Tb8Hb+NLWsc=</ns1:pwd>
      <ns1:Id_CodFacturacion>SER122990</ns1:Id_CodFacturacion>
      <ns1:Nombre_Cargue></ns1:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
      CARGUE APARECERÁ EN SISCLINET-->
    </ns1:AuthHeader>`;

  let consulta = `<?xml version="1.0" encoding="UTF-8"?>
  <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:ns1="http://tempuri.org/">
    <env:Header>
      ${auth_header}
    </env:Header>
    <env:Body>
      <ns1:CargueMasivoExterno>
        <ns1:envios>
          <ns1:CargueMasivoExternoDTO>
            <ns1:objEnvios>
              <ns1:EnviosExterno>
                <ns1:Num_Guia>0</ns1:Num_Guia>
                <ns1:Num_Sobreporte>0</ns1:Num_Sobreporte>
                <ns1:Num_SobreCajaPorte>0</ns1:Num_SobreCajaPorte>
                <ns1:Doc_Relacionado></ns1:Doc_Relacionado>
                <ns1:Num_Piezas>1</ns1:Num_Piezas>
                <ns1:Des_TipoTrayecto>1</ns1:Des_TipoTrayecto>
                <ns1:Ide_Producto>2</ns1:Ide_Producto><!--ENVÍO CON MERCACÍA PREMIER-->
                <ns1:Des_FormaPago>2</ns1:Des_FormaPago>
                <ns1:Ide_Num_Identific_Dest>${datos.identificacionD}</ns1:Ide_Num_Identific_Dest>
                <ns1:Tipo_Doc_Destinatario>${datos.tipo_doc_Dest == "1" ? "NIT" : "CC"}</ns1:Tipo_Doc_Destinatario>
                <ns1:Des_MedioTransporte>1</ns1:Des_MedioTransporte>
                <ns1:Num_PesoTotal>${datos.peso}</ns1:Num_PesoTotal>
                <ns1:Num_ValorDeclaradoTotal>${datos.valor}</ns1:Num_ValorDeclaradoTotal>
                <ns1:Num_VolumenTotal>0</ns1:Num_VolumenTotal>
                <ns1:Num_BolsaSeguridad>0</ns1:Num_BolsaSeguridad>
                <ns1:Num_Precinto>0</ns1:Num_Precinto>
                <ns1:Des_TipoDuracionTrayecto>1</ns1:Des_TipoDuracionTrayecto>
                <ns1:Des_Telefono>${datos.telefonoD}</ns1:Des_Telefono>
                <ns1:Des_Ciudad>${datos.ciudadD}</ns1:Des_Ciudad><!--o codigo dane para ciudad destino-->
                <ns1:Des_Direccion>${datos.direccionD}</ns1:Des_Direccion>
                <ns1:Nom_Contacto>${datos.nombreD}</ns1:Nom_Contacto>
                <ns1:Des_VlrCampoPersonalizado1>${datos.id_heka}</ns1:Des_VlrCampoPersonalizado1>
                <ns1:Num_ValorLiquidado>0</ns1:Num_ValorLiquidado>
                <ns1:Des_DiceContener>${datos.dice_contener}</ns1:Des_DiceContener>
                <ns1:Des_TipoGuia>1</ns1:Des_TipoGuia>
                <ns1:Num_VlrSobreflete>0</ns1:Num_VlrSobreflete>
                <ns1:Num_VlrFlete>0</ns1:Num_VlrFlete>
                <ns1:Num_Descuento>0</ns1:Num_Descuento>
                <ns1:idePaisOrigen>1</ns1:idePaisOrigen>
                <ns1:idePaisDestino>1</ns1:idePaisDestino>
                <ns1:Des_IdArchivoOrigen></ns1:Des_IdArchivoOrigen>
                <ns1:Des_DireccionRemitente>${datos.direccionR}</ns1:Des_DireccionRemitente><!--Opcional-->
                <ns1:Num_PesoFacturado>0</ns1:Num_PesoFacturado>
                <ns1:Est_CanalMayorista>false</ns1:Est_CanalMayorista>
                <ns1:Num_IdentiRemitente />
                <ns1:Des_CiudadRemitente>${datos.ciudadR}</ns1:Des_CiudadRemitente>
                <ns1:Num_TelefonoRemitente>${datos.celularR}</ns1:Num_TelefonoRemitente>
                <ns1:Des_DiceContenerSobre>${datos.dice_contener}</ns1:Des_DiceContenerSobre>
                <ns1:Num_Alto>${datos.alto}</ns1:Num_Alto>
                <ns1:Num_Ancho>${datos.ancho}</ns1:Num_Ancho>
                <ns1:Num_Largo>${datos.largo}</ns1:Num_Largo>
                <ns1:Des_DepartamentoDestino>${datos.departamentoD}</ns1:Des_DepartamentoDestino>
                <ns1:Des_DepartamentoOrigen>${datos.departamentoR}</ns1:Des_DepartamentoOrigen>
                <ns1:Gen_Cajaporte>false</ns1:Gen_Cajaporte>
                <ns1:Gen_Sobreporte>false</ns1:Gen_Sobreporte>
                <ns1:Nom_UnidadEmpaque>GENERICA</ns1:Nom_UnidadEmpaque>
                <ns1:Nom_RemitenteCanal />
                <ns1:Des_UnidadLongitud>cm</ns1:Des_UnidadLongitud>
                <ns1:Des_UnidadPeso>kg</ns1:Des_UnidadPeso>
                <ns1:Num_ValorDeclaradoSobreTotal>0</ns1:Num_ValorDeclaradoSobreTotal>
                <ns1:Num_Factura>0</ns1:Num_Factura>
                <ns1:Des_CorreoElectronico>${datos.correoD}</ns1:Des_CorreoElectronico>
                <ns1:Num_Recaudo>${prueba ? "0" : datos.valor}</ns1:Num_Recaudo>
              </ns1:EnviosExterno>
            </ns1:objEnvios>
          </ns1:CargueMasivoExternoDTO>
        </ns1:envios>
      </ns1:CargueMasivoExterno>
    </env:Body>
  </env:Envelope>`

  return consulta;
}

function crearGuiaSticker(numeroGuia, id_archivoCargar, prueba) {
  console.log(numeroGuia, id_archivoCargar, prueba)

  let auth_header = prueba ? `<tem:AuthHeader>
  <!--Optional:-->
  <tem:login>Luis1937</tem:login>
  <!--Optional:-->
  <tem:pwd>MZR0zNqnI/KplFlYXiFk7m8/G/Iqxb3O</tem:pwd>
  <!--Optional:-->
  <tem:Id_CodFacturacion>SER408</tem:Id_CodFacturacion>
  </tem:AuthHeader>` : `<tem:AuthHeader>
  <!--Optional:-->
  <tem:login>1072497419SUC1</tem:login>
  <!--Optional:-->
  <tem:pwd>Tb8Hb+NLWsc=</tem:pwd>
  <!--Optional:-->
  <tem:Id_CodFacturacion>SER122990</tem:Id_CodFacturacion>
  </tem:AuthHeader>`;

  ide_codFacturacion = prueba ? "SER408" : "SER122990";

  let consulta = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tem="http://tempuri.org/">
  <soapenv:Header>
    ${auth_header}
  </soapenv:Header>
  <soapenv:Body>
      <GenerarGuiaSticker xmlns="http://tempuri.org/">
        <num_Guia>${numeroGuia}</num_Guia>
        <num_GuiaFinal>${numeroGuia}</num_GuiaFinal>
        <ide_CodFacturacion>${ide_codFacturacion}</ide_CodFacturacion>
        <sFormatoImpresionGuia>1</sFormatoImpresionGuia>
        <Id_ArchivoCargar>${id_archivoCargar}</Id_ArchivoCargar>
        <interno>false</interno>
        <bytesReport></bytesReport>
      </GenerarGuiaSticker>
    </soapenv:Body>
  </soapenv:Envelope>`

  return consulta;
}

function generarManifiesto(arrGuias, prueba) {
  let auth_header = prueba ? `<tem:AuthHeader>
    <!--Optional:-->
    <tem:login>Luis1937</tem:login>
    <!--Optional:-->
    <tem:pwd>MZR0zNqnI/KplFlYXiFk7m8/G/Iqxb3O</tem:pwd>
    <!--Optional:-->
    <tem:Id_CodFacturacion>SER408</tem:Id_CodFacturacion>
  </tem:AuthHeader>`: `<tem:AuthHeader>
    <!--Optional:-->
    <tem:login>1072497419SUC1</tem:login>
    <!--Optional:-->
    <tem:pwd>Tb8Hb+NLWsc=</tem:pwd>
    <!--Optional:-->
    <tem:Id_CodFacturacion>SER122990</tem:Id_CodFacturacion>
  </tem:AuthHeader>`

  let guias = `<tem:Guias>`;
  for(let i = 0; i < arrGuias.length; i++) {
    guias += `<tem:ObjetoGuia>
      <tem:Numero_Guia>${arrGuias[i]}</tem:Numero_Guia>
    </tem:ObjetoGuia>`
  }
  guias += `</tem:Guias>`;

  let consulta = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:tem="http://tempuri.org/">
    <soap:Header>
      ${auth_header}
    </soap:Header>
    <soap:Body>
        <tem:GenerarManifiesto>
            <tem:Ide_Currier>0</tem:Ide_Currier>
            <!--Optional:-->
            <tem:Nombre_Currier>0</tem:Nombre_Currier>
            <tem:Ide_Auxiliar>0</tem:Ide_Auxiliar>
            <!--Optional:-->
            <tem:Nombre_Auxiliar></tem:Nombre_Auxiliar>
            <!--Optional:-->
            <tem:Placa_Vehiculo>0</tem:Placa_Vehiculo>
            <!--Optional:-->
            <tem:Lista_Guias_Xml>
              ${guias}
            </tem:Lista_Guias_Xml>
        </tem:GenerarManifiesto>
    </soap:Body>
  </soap:Envelope>`

  return consulta
}


//A partir de aquí estarán todas las rutas
router.post("/consultarGuia", (req, res) => {
  request.post({
    "headers": { "content-type": "text/xml" },
    "url": rastreoEnvios,
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
    "url": rastreoEnvios,
    "body": estadoGuia(req.body.guia)
  }, (err, response, body) => {
    if(err) {
      return console.dir(err)
    }

    res.send(JSON.stringify(body));
  })
})

router.post("/crearGuia", (req, res) => {
  request.post({
    headers: {"Content-Type": "text/xml"},
    url: genGuiasPrueba,
    body: generarGuia(req.body, true)
  }, (err, response, body) => {
    if(err) return console.error(err);

    console.log("Se está creando una guía");
    res.send(JSON.stringify(body));
  })
})

router.post("/generarGuiaSticker", (req, res) => {
  request.post({
    headers: {"Content-Type": "text/xml"},
    url: genGuiasPrueba,
    body: crearGuiaSticker(req.body.numeroGuia, req.body.id_archivoCargar, true)
  }, (error, response, body) => {
    if(error) {
      return console.dir(error);
    }
    console.log(response.statusCode);
    // console.log(JSON.stringify(body));
    res.send(JSON.stringify(body));
  })
});

router.post("/generarManifiesto", (req, res) => {
  request.post({
    headers: {"Content-Type": "text/xml"},
    url: genGuiasPrueba,
    body: generarManifiesto(["290136660", "290136665", "290136666"], true)
  }, (error, response, body) => {
    if(error) {
      return console.dir(error);
    }
    console.log(response.statusCode);
    // console.log(JSON.stringify(body));
    res.send(JSON.stringify(body));
  })
})

module.exports = router;