///SErvientrega
const express = require("express");
const app = express();
const router = express.Router();
const request = require("request");
const requestPromise = require("request-promise");
const parseString = require("xml2js").parseString;
const DOMParser = require("xmldom").DOMParser;
const bodyParser = require("body-parser");
const cron = require("node-cron");
const {PDFDocument} = require("pdf-lib");
const fs = require("fs");
const Blob = require("node-blob");
// globalThis.Blob = Blob;


const firebase = require("../firebase");
const db = firebase.firestore();
const storage = firebase.storage();

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

const rastreoEnvios = "http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx";
const generacionGuias = "http://web.servientrega.com:8081/generacionguias.asmx";
const genGuiasPrueba = "http://190.131.194.159:8059/GeneracionGuias.asmx";
const id_cliente = "1072497419"

const auth_header_prueba = `<tem:AuthHeader>
<tem:login>Luis1937</tem:login>
<tem:pwd>MZR0zNqnI/KplFlYXiFk7m8/G/Iqxb3O</tem:pwd>
<tem:Id_CodFacturacion>SER408</tem:Id_CodFacturacion>
<tem:Nombre_Cargue></tem:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
CARGUE APARECERÁ EN SISCLINET-->
</tem:AuthHeader>`;

const auth_header_convencional = `<tem:AuthHeader>
<tem:login>1072497419</tem:login>
<tem:pwd>Tb8Hb+NLWsc=</tem:pwd>
<tem:Id_CodFacturacion>SER122989</tem:Id_CodFacturacion>
<tem:Nombre_Cargue></tem:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
CARGUE APARECERÁ EN SISCLINET-->
</tem:AuthHeader>`;

const auth_header_pagoContraentrega = `<tem:AuthHeader>
<tem:login>1072497419SUC1</tem:login>
<tem:pwd>NuBQAVjagIbdvqINzxg5lQ==</tem:pwd>
<tem:Id_CodFacturacion>SER122990</tem:Id_CodFacturacion>
<tem:Nombre_Cargue></tem:Nombre_Cargue><!--AQUI VA EL NOMBRE DEL
CARGUE APARECERÁ EN SISCLINET-->
</tem:AuthHeader>`


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

cron.schedule("00 */6 * * *", () => {
  let d = new Date();
  console.log("Se Actualizaron los movimientos de las guías: ", d);
  actualizarMovimientosGuias(d).then((detalles) => {
    console.log(detalles);
    firebase.firestore().collection("reporte").add(detalles);
   });
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

// actualizarMovimientosGuias(new Date()).then((detalles) => {
//  console.log(detalles);
// //  firebase.firestore().collection("reporte").add(detalles);
// });
async function actualizarMovimientosGuias(d) {
  let inicio_func = new Date().getTime();
  return await firebase.firestore().collectionGroup("guias")
  .orderBy("estado")
  .where("estado", "not-in", ["ENTREGADO", "ENTREGADO A REMITENTE"])
  // .where("centro_de_costo", "==", "SellerNuevo")
  // .where("numeroGuia", "in", ["6100000099", "6100000100", "0", "2112740014", "290147258"])
  // .limit(200)
  .get()
  .then(async querySnapshot => {
    console.log(querySnapshot.size);
    // throw "no babe"
    let consulta = {
      guias_est_actualizado: [],
      guias_mov_actualizado: [],
      guias_sin_mov: [],
      guias_con_errores: [],
      usuarios: [],
      total_consulta: querySnapshot.size,
      fecha: d
    }

    let resultado_guias = new Array();

    querySnapshot.forEach(async doc => {
      if(doc.data().numeroGuia) {
        if(consulta.usuarios.indexOf(doc.data().centro_de_costo) == -1) {
          consulta.usuarios.push(doc.data().centro_de_costo);
        }
        
        let guia = requestPromise({
          // "headers": {"Content-Type": "text/xml"},
          method: "POST",
          "uri": rastreoEnvios + "/ConsultarGuia",
          form: {
            NumeroGuia: doc.data().numeroGuia
          },
          json: true
        })
        .then(async body => {
          // console.log(body)
          let respuesta = await new Promise((resolve, reject) => {
            parseString(body, async (error, result) => {
              if(error) return {
                estado: "Est.N.A",
                guia: doc.id + " / " + doc.data().numeroGuia
              }
              try {
                // let path = doc.ref.path.split("/");
                let data = result.InformacionGuiaMov;
                // console.log("198 => ",data)
                if(!data.Mov) {
                  throw " Esta guía no manifiesta movimientos."
                }
                let movimientos = data.Mov[0].InformacionMov;
                // console.log(data);
                let upte_estado = await doc.ref.parent.parent.collection("guias")
                .doc(doc.id).update({
                  estado: data.EstAct[0],
                  ultima_actualizacion: d
                })
                .then(() => {
                  // console.log(doc.data());
                  return{
                    estado: "Est.A",
                    guia: doc.id + " / " + doc.data().numeroGuia
                  }
                  
                }).catch(err => {
                  return {
                    estado: "Est.N.A",
                    guia: doc.id + " / " + doc.data().numeroGuia
                  }
                });
                
                let upte_movs;
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
    
                  // console.log(data_to_fb);
    
                  upte_movs = await doc.ref.parent.parent.collection("estadoGuias")
                  .doc(doc.id)
                  // .get()
                  .set(data_to_fb)
                  .then(() => {
                    // console.log(doc.data());
                    return{
                      estado: "Mov.A",
                      guia: doc.id + " / " + doc.data().numeroGuia
                    }
    
                  }).catch(err => {
                    return {
                      estado: "Mov.N.A",
                      guia: doc.id + " / " + doc.data().numeroGuia
                    }
                  });
                } else {
                  upte_movs = {
                    estado: "Sn.Mov",
                    guia: doc.id + " / " + doc.data().numeroGuia
                  }
                }

                resolve([upte_estado, upte_movs]);
              } catch (e){
                console.log("error el actualizar guias");
                console.log(e)
                resolve([{
                  estado: "error",
                  guia: doc.id + " / " + doc.data().numeroGuia + e
                }]);
              }
  
            });
          })

          return respuesta;
        })
        .catch(err => {
          console.log("289 => ",err);
          return [{
            estado: "error",
            guia: doc.id + " / " + doc.data().numeroGuia + err.message
          }]
        });

        resultado_guias.push(guia)
      }
    })
    

    let guias_procesadas = await Promise.all(resultado_guias);
    for(let guia of guias_procesadas) {
        if(guia.length == 1) {
          consulta.guias_con_errores.push(guia[0].guia);
        } else {
          let modo_estado = guia[0], modo_movimientos = guia[1];
          if(modo_estado.estado == "Est.A") {
            consulta.guias_est_actualizado.push(guia[0].guia)
          } 

          if(modo_movimientos.estado == "Mov.A") {
            consulta.guias_mov_actualizado.push(modo_movimientos.guia);
          } else if (modo_movimientos.estado == "Sn.Mov") {
            consulta.guias_sin_mov.push(modo_movimientos.guia);
          }
        }
    }
    
    
    let final_func = new Date().getTime();
    consulta.tiempo_ejecucion  = (final_func - inicio_func) + "ms";

    consulta.mensaje = `Se han actualizado: los estados de ${consulta.guias_est_actualizado.length} Guias, 
    los movimientos de ${consulta.guias_mov_actualizado.length} Guias.
    Hubo errores en ${consulta.guias_con_errores.length} Guias.
    De un total de ${consulta.total_consulta} registradas cuyo estado son diferentes a 
    "Entregado" y "Entregado a Remitente" en ${consulta.usuarios.length} usuarios.
    Tiempo de ejecución: ${consulta.tiempo_ejecucion}`;

    // console.log("246",consulta);
    
    return consulta;
  }).catch(err => console.log(err))
  function mensaje(novedades, novedades_eliminadas, error, total, usuarios) {
    return `Se han actualizado ${novedades} novedades,
    eliminado ${novedades_eliminadas} y ${error} han sido fallidas,
    de un total de ${total} registradas cuyo estado es: "En procesamiento" en ${usuarios} usuarios.
    `
  }
}


function generarGuia(datos) {
  let auth_header;

  if(datos.type == "CONVENCIONAL") {
    auth_header = auth_header_convencional;
  } else {
    auth_header = auth_header_pagoContraentrega
  }

  if(datos.prueba) auth_header = auth_header_prueba;
  
  console.log(auth_header);

  let consulta = `<?xml version="1.0" encoding="UTF-8"?>
  <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/">
    <env:Header>
      ${auth_header}
    </env:Header>
    <env:Body>
      <CargueMasivoExterno xmlns="http://tempuri.org/">
        <envios>
          <CargueMasivoExternoDTO>
            <objEnvios>
              <EnviosExterno>
                <Num_Guia>0</Num_Guia>
                <Num_Sobreporte>0</Num_Sobreporte>
                <Num_SobreCajaPorte>0</Num_SobreCajaPorte>
                <Doc_Relacionado></Doc_Relacionado>
                <Num_Piezas>1</Num_Piezas>
                <Des_TipoTrayecto>1</Des_TipoTrayecto>
                <Ide_Producto>2</Ide_Producto><!--ENVÍO CON MERCACÍA PREMIER-->
                <Des_FormaPago>2</Des_FormaPago>
                <Ide_Num_Identific_Dest>${datos.identificacionD}</Ide_Num_Identific_Dest>
                <Tipo_Doc_Destinatario>${datos.tipo_doc_Dest == "1" ? "NIT" : "CC"}</Tipo_Doc_Destinatario>
                <Des_MedioTransporte>1</Des_MedioTransporte>
                <Num_PesoTotal>${datos.peso}</Num_PesoTotal>
                <Num_ValorDeclaradoTotal>${datos.seguro}</Num_ValorDeclaradoTotal>
                <Num_VolumenTotal>0</Num_VolumenTotal>
                <Num_BolsaSeguridad>0</Num_BolsaSeguridad>
                <Num_Precinto>0</Num_Precinto>
                <Des_TipoDuracionTrayecto>1</Des_TipoDuracionTrayecto>
                <Des_Telefono>${datos.telefonoD}</Des_Telefono>
                <Des_Ciudad>${datos.ciudadD}</Des_Ciudad><!--o codigo dane para ciudad destino-->
                <Des_Direccion>${datos.direccionD}</Des_Direccion>
                <Nom_Contacto>${datos.nombreD}</Nom_Contacto>
                <Des_VlrCampoPersonalizado1>${datos.id_heka}</Des_VlrCampoPersonalizado1>
                
                <Num_ValorLiquidado>0</Num_ValorLiquidado>
                <Des_DiceContener>${datos.dice_contener}</Des_DiceContener>
                <Des_TipoGuia>1</Des_TipoGuia>
                <Num_VlrSobreflete>0</Num_VlrSobreflete>
                <Num_VlrFlete>0</Num_VlrFlete>
                <Num_Descuento>0</Num_Descuento>
                <idePaisOrigen>1</idePaisOrigen>
                <idePaisDestino>1</idePaisDestino>
                <Des_IdArchivoOrigen></Des_IdArchivoOrigen>
                <Des_DireccionRemitente>${datos.direccionR}</Des_DireccionRemitente><!--Opcional-->
                <Num_PesoFacturado>0</Num_PesoFacturado>
                <Est_CanalMayorista>false</Est_CanalMayorista>
                <Num_IdentiRemitente />
                <Des_CiudadRemitente>${datos.ciudadR}</Des_CiudadRemitente>
                <Num_TelefonoRemitente>${datos.celularR}</Num_TelefonoRemitente>
                <Des_DiceContenerSobre>${datos.dice_contener}</Des_DiceContenerSobre>
                <Num_Alto>${datos.alto}</Num_Alto>
                <Num_Ancho>${datos.ancho}</Num_Ancho>
                <Num_Largo>${datos.largo}</Num_Largo>
                <Des_DepartamentoDestino>${datos.departamentoD}</Des_DepartamentoDestino>
                <Des_DepartamentoOrigen>${datos.departamentoR}</Des_DepartamentoOrigen>
                <Gen_Cajaporte>false</Gen_Cajaporte>
                <Gen_Sobreporte>false</Gen_Sobreporte>
                <Nom_UnidadEmpaque>GENERICA</Nom_UnidadEmpaque>
                <Nom_RemitenteCanal />
                <Des_UnidadLongitud>cm</Des_UnidadLongitud>
                <Des_UnidadPeso>kg</Des_UnidadPeso>
                <Num_ValorDeclaradoSobreTotal>0</Num_ValorDeclaradoSobreTotal>
                <Num_Factura>0</Num_Factura>
                <Des_CorreoElectronico>${datos.correoD}</Des_CorreoElectronico>
                <Num_Recaudo>${datos.prueba ? "0" : datos.valor}</Num_Recaudo>
              </EnviosExterno>
            </objEnvios>
          </CargueMasivoExternoDTO>
        </envios>
      </CargueMasivoExterno>
    </env:Body>
  </env:Envelope>`

  return consulta;
}

function crearGuiaSticker(numeroGuia, id_archivoCargar, type, prueba) {
  let auth_header, ide_codFacturacion;

  if(type == "CONVENCIONAL") {
    auth_header = auth_header_convencional;
    ide_codFacturacion = "SER122989";
  } else {
    auth_header = auth_header_pagoContraentrega
    ide_codFacturacion = "SER122990";
  }

  if(prueba) {
    auth_header = auth_header_prueba;
    ide_codFacturacion = "SER408"
  } 

  console.log("numero guia =>", numeroGuia);
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
  let auth_header;

  if(arrGuias[0].type == "CONVENCIONAL") {
    auth_header = auth_header_convencional;
  } else {
    auth_header = auth_header_pagoContraentrega
  }

  if(prueba) auth_header = auth_header_prueba;

  console.log(arrGuias);
  let guias = `<tem:Guias>`;
  for(let i = 0; i < arrGuias.length; i++) {
    guias += `<tem:ObjetoGuia>
      <tem:Numero_Guia>${arrGuias[i].numeroGuia}</tem:Numero_Guia>
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

function encriptarContrasena(str) {
  request.post({
    headers: {"Content-Type": "text/xml"},
    url: generacionGuias,
    body: `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <EncriptarContrasena xmlns="http://tempuri.org/">
          <strcontrasena>${str}</strcontrasena>
        </EncriptarContrasena>
      </soap:Body>
    </soap:Envelope>`
  }, (err, res, body) => {
    console.log(body);
  })
}

async function joinBase64WhitPdfDoc(arrBase64) {
  try {
    const pdfDoc = await PDFDocument.create();
    let manifestarGuias = new Array();
    let contador = 0;
    for(let base64 of arrBase64) {
      if(base64) {
        let buff = new Buffer.from(base64, "base64");
        let documen = await PDFDocument.load(buff);
        let [page] = await pdfDoc.copyPages(documen, [0]);
        pdfDoc.addPage(page);
        manifestarGuias.push(arrBase64[contador]);
      }
      contador ++
    }  
    let resultBase64 = await pdfDoc.saveAsBase64();
    if (contador) {
      return resultBase64;
    } else {
      return 0;
    }
    
  } catch (error){
    console.log(error);
  }
}

async function generarStickerManifiesto(arrGuias, prueba) {
  if(arrGuias) {
    let base64 = new Promise((resolve, reject) => {
      request.post({
        headers: {"Content-Type": "text/xml"},
        url: prueba ? genGuiasPrueba : generacionGuias,
        body: generarManifiesto(arrGuias, prueba)
      }, (error, response, body) => {
        if(error) {
          return console.dir(error);
        }
        console.log(response.statusCode);
    
        let xmlResponse = new DOMParser().parseFromString(body, "text/xml")
        // resolve(body);
        try {
          if(xmlResponse.documentElement.getElementsByTagName("GenerarManifiestoResult")[0].textContent == "true") {
            //------- Espacio para colocar la notificación a enviar a firebase 
            //
            resolve(xmlResponse.documentElement.getElementsByTagName("cadenaBytes")[0].textContent);
            // console.log(xmlResponse.documentElement.getElementsByTagName("cadenaBytes")[0].textContent)
          } else {
            let errorGeneradoPorGuia = xmlResponse.documentElement.getElementsByTagName("Des_Error")[0].childNodes;
            let guiasConErrores = new Array();
  
            console.log(errorGeneradoPorGuia);
            for(let i = 0; i < errorGeneradoPorGuia.length; i++) {
              
              let guia = errorGeneradoPorGuia[i].childNodes[0].textContent;
              let resErr = errorGeneradoPorGuia[i].childNodes[1].textContent;
  
              console.log("guia", guia);
              console.log("destalle", resErr);
              guiasConErrores.push(guia +" - "+ resErr);
            }
  
            let fecha = new Date()
            console.log("Guias con errores", guiasConErrores);
            
            if(arrGuias.length) {
              db.collection("notificaciones").add({
                fecha: fecha.getDate() +"/"+ (fecha.getMonth() + 1) + "/" + fecha.getFullYear() + " - " + fecha.getHours() + ":" + fecha.getMinutes(),
                visible_admin: true,
                mensaje: "Hubo un problema para crear el manifiesto de las guías " + arrGuias.map(v => v.id_heka).join(", "),
                guias: arrGuias.map(v => v.id_heka),
                timeline: new Date().getTime(),
                detalles: guiasConErrores
              }).catch((err) => {
                db.collection("errores").add({
                  err: err
                })
              });
            }
          
            
            resolve(0);
          }

        } catch (error) {
          console.log(error);
        }
      })
    })
    return await base64;
  } else {
    return 0;
  }

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
    url: req.body.prueba ? genGuiasPrueba : generacionGuias,
    body: generarGuia(req.body)
  }, (err, response, body) => {
    if(err) return console.error(err);

    console.log("Se está creando una guía");
    // console.log(body);
    res.send(JSON.stringify(body));
  })
})

router.post("/crearDocumentos", async (req, res) => {
  // console.log(req.body);
  let arr = [];
  let vinculo = req.body[1];
  let arrData = req.body[0].filter(d => d.prueba == vinculo.prueba && d.numeroGuia != "undefined");
  let manifestarGuias = new Array();
  let arrErroresUsuario = new Array();
  if(arrData.length < req.body[0].length) arrErroresUsuario.push("Algunas guías que no corresponden con el estado actual no fueron tomadas en cuenta.");
  for (let data of arrData) {
    let promiseBase64 = new Promise((resolve, reject) => {
      request.post({
        headers: { "Content-Type": "text/xml" },
        url: data.prueba ? genGuiasPrueba : generacionGuias,
        body: crearGuiaSticker(data.numeroGuia, data.id_archivoCargar, data.type, data.prueba)
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        console.log(response.statusCode);
        // console.log(JSON.stringify(body));
        
        let xmlResponse = new DOMParser().parseFromString(body, "text/xml")
        // console.info(xmlResponse.documentElement.getElementsByTagName("GenerarGuiaStickerResponse")[0].textContent);
        if(xmlResponse.documentElement.getElementsByTagName("GenerarGuiaStickerResult")[0].textContent == "true") {
          manifestarGuias.push(data);
          resolve(xmlResponse.documentElement.getElementsByTagName("bytesReport")[0].textContent);
        } else {
          resolve(0);
        }

        // resolve(body.slice(25, 50));
        
        // res.send(JSON.stringify(body));
      })
    }) 
    arr.push(promiseBase64);
  }

  let arrBase64 = await Promise.all(arr);
  // console.log(arrBase64);
  // console.log(manifestarGuias);
  if(arrData.length > manifestarGuias.length) arrErroresUsuario.push("Algunas guías presentaron errores para crear el Sticker, pruebe intentando de nuevo con las restantes, o clonarlas y eliminar las defectuosas");
  let base64Guias = await joinBase64WhitPdfDoc(arrBase64);
  let base64Manifiesto = await generarStickerManifiesto(manifestarGuias, vinculo.prueba);
  console.log("mustra de los primeros 10 datos de base64manifiesto => ",base64Manifiesto.toString().slice(0, 10));
  try {
    if(!base64Manifiesto && manifestarGuias.length) arrErroresUsuario.push("Ocurrió un Error inesperado al crear el manifiesto de las guías, el problema será tranferido a centro logístico, procuraremos atenderlo en la brevedad posible, disculpe las molestias causadas");
    
    if(arrErroresUsuario.length) {
      console.log("Hubo algún error mientras se creaban los documentos.");
      let fecha = new Date();
      console.log("Enviando Notificacion al usuario")
      db.collection("notificaciones").add({
        fecha: fecha.getDate() +"/"+ (fecha.getMonth() + 1) + "/" + fecha.getFullYear() + " - " + fecha.getHours() + ":" + fecha.getMinutes(),
        visible_user: true,
        timeline: new Date().getTime(),
        icon: ["exclamation", "danger"],
        mensaje: "Hemos registrado algún error al crear los documentos, revíselos para ver como resolverlos.",
        detalles: arrErroresUsuario,
        user_id: vinculo.id_user
      }).catch((error) => {
        console.log("error Al enviar la notificación al usuario => ", error);
      })
    }
  
    if(manifestarGuias.length) {
      console.log("empieza a configurar los documentos");
      let guias = manifestarGuias.map(v => v.id_heka).sort();
      console.log(guias,
        base64Guias.length,
        base64Manifiesto.length);
      
      console.log(base64Guias);
      await db.collection("documentos").doc(vinculo.id_doc).update({
        descargar_guias: base64Guias ? true : false,
        descargar_relacion_envio: base64Manifiesto ? true : false,
        guias,
        base64Guias,
        base64Manifiesto
      })
      .then(() => {
        console.log("Ya se configuró el documento correctamente")
        for (let guia of manifestarGuias) {
          console.log("Actualizando estado =>", guia.id_heka);
          db.collection("usuarios").doc(vinculo.id_user)
          .collection("guias").doc(guia.id_heka)
          .update({
            enviado: true,
            estado: "Enviado"
          }).catch((error) => {
            console.log("hubo un error Al actualizar el estado de la guia a \"Enviado\" => ", error)
          });
        }
        console.log("Se actualizaron todos los estados")
        let guias_respuesta = manifestarGuias.map(v => v.id_heka).sort();
        let respuesta = "Las Guías " + guias_respuesta + " Fueron creadas exitósamente.";
        if(arrErroresUsuario.length) respuesta += "\n Pero se presentó un error, revise las notificaciones para obtener más detalles";
        console.log(respuesta);
        res.json(respuesta);
      })
      .catch(error => {
        console.log("Hubo un error para configurar el documento");
        console.log(error)
        console.log(JSON.stringify(error))
        console.log(error.error)
        console.log(error.toString())
        console.log(error.message)

      })
  
    } else {
      db.collection("documentos").doc(vinculo.id_doc).delete();
      res.status(422).send(JSON.stringify({error: "no hubo guía que procesar"}))
    }
  } catch (error) {
    console.log(error);
  }

 
  // let ejemploGuias = new Buffer.from(base64Guias, "base64");
  // let ejemploManifiesto = new Buffer.from(base64Manifiesto, "base64");
  // fs.writeFileSync("ejemplo.pdf",ejemplo);
});

router.post("/generarManifiesto", (req, res) => {
  request.post({
    headers: {"Content-Type": "text/xml"},
    url: req.body.prueba ? genGuiasPrueba : generacionGuias,
    body: generarManifiesto(req.body.arrGuias, req.body.prueba)
  }, (error, response, body) => {
    if(error) {
      return console.dir(error);
    }
    console.log(response.statusCode);
    // console.log(JSON.stringify(body));
    res.send(JSON.stringify(body));
  })
})


let vinculo = {
  id_user: "nk58Yq6Y1GUFbaaRkdMFuwmDLxO2",
  prueba: true,
  id_doc: "0000"
}

let crearSticker = [];
for(let i = 0; i < 2; i++) {
    crearSticker[i] = {
        numeroGuia: 290136812 + i,
        id_archivoCargar: "",
        prueba: true,
        id_heka: 11111450 + i
    }
}

// generarStickerManifiesto(crearSticker, vinculo);

module.exports = router;