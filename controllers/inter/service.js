
const CredencialesEmpresa = require("../../keys/interCredentials").CredencialesEmpresa;
const request = require("request");
const FirebaseServiceConection = require("../../keys/firebase");
const firebaseService = new FirebaseServiceConection();
const db = firebaseService.dbFirebase();
const { Exception } = require("handlebars");
global.XMLHttpRequest = require("xhr2");

async function createDirectSporadicCollections(req, res) {
  const data = req.body;
  const query = req.query || null;
  const objetoEjemploLlegada = {
    ids_heka: [], // Lista de ids heka referenciados al usuario
    numerosGuia: [], // Lista de los número de guía provistos por la transportadora 
    id_user: "",  // Id del usuario que solicita recolección
    idSucursalCliente: 2901, // Código de sucursal de interrapidísimo
    fechaRecogida: "DateTime 2023-10-17 14:00" // Fecha en que se solicita la recolección
  }

  try {
    const build = buildDirectData(data);
    console.log(build);
    createBuild(build, query.mode)
      .then((response) => {
        
        db.collection("SolicitudRecolecciones").add({...data,
          fechaSolicitud: new Date(),
          transportadora: "INTERRAPIDISIMO",
          respuesta: response
        });
  
        res.status(200).send({
          'code': 200,
          'response': {
            'idRecogica': response.idRecogida
          }
        });
      })
      .catch(e => {
        res.status(400).send({
          'code': 400,
          'response': e
        });
      });      
  } catch (e) {
    return res.status(409).send({
      'code': 409,
      'response': {"message": e.message}
    })
  }
}

async function createSporadicCollections(req, res) {
  const data = req.body;
  const query = req.query || null;
  let isDiferent = validateSucursal(data);

  if(!Array.isArray(data)) {
    return res.status(400).send({
      'code': 400,
      'response': {"message": 'Debe ser un arreglo'}
    });
  }

  if(isDiferent) {
    res.status(400).send({
      'code': 400,
      'response': {"message": 'La sucursal no puede ser diferente'}
    });
  }
  else {
    const build = await buildData(data);
    createBuild(build, query.mode)
      .then((response) => {
        data.forEach(item => {
          db.collection("documentos")
          .doc(item.id)
          .update({idRecogida: response.idRecogida});
        });
        res.status(200).send({
          'code': 200,
          'response': {
            'idRecogica': response.idRecogida
          }
        });
      })
      .catch(e => {
        res.status(400).send({
          'code': 400,
          'response': e
        });
      })
  }
}

async function buildData(data) {
  let build =  {
    IdClienteCredito: CredencialesEmpresa.idCliente,
    listaNumPreenvios: []
  };
  for (const element of data) {
    build.IdSucursalCliente = element.branchCode;
    build.fechaRecogida = element.date;
    const queryDb = await db.collection("documentos").doc(element.id).get();
    const documentData = queryDb.data();

    for (const list of element.listGuides) {
      const queryList = await db.doc(`/usuarios/${documentData.id_user}/guias/${list}`).get();
      const userData = queryList.data();
      build.listaNumPreenvios.push(userData.numeroGuia);
    }
  }
  return build;
}

function buildDirectData(data) {
  const build =  {
    IdClienteCredito: CredencialesEmpresa.idCliente,
    listaNumPreenvios: data.numerosGuia,
    IdSucursalCliente: data.idSucursalCliente,
    fechaRecogida: data.fechaRecogida
  };

  return build;
  
}

function createBuild(build, mode) {
  return new Promise(async (resolve, reject) => {
    if(mode == 'test') {
      const resConstruct = testMode(build);
      return resolve(resConstruct);
    }

    request.post(CredencialesEmpresa.endpoint + "/Recogida/InsertarRecogidaCliente", {
      headers: {
          "x-app-signature": CredencialesEmpresa.x_app_signature,
          "x-app-security_token":  CredencialesEmpresa.x_app_security_token,
          "Content-type": "application/json"
      },
      body: JSON.stringify(build)
      }, (error, response, body) => {
        const bodyResponse = JSON.parse(response.body);
        if(bodyResponse.idRecogida) {
          return resolve(bodyResponse);
        }
        reject(bodyResponse); 
      }
    )
  });
}

function testMode(build) {
  let number = Math.floor(10000 + Math.random() * 90000);
  return {
    "idRecogida": "test"+number,
    "cantidadPreenvios": build.listaNumPreenvios.length,
    "fechaSolicitud": new Date().toLocaleString(),
    "pesoTotal": 2.0,
    "mensajePreenviosAsociados": "La recogida se generó Exitosamente.",
    "preenviosAsociados": build.listaNumPreenvios,
    "mensajePreenviosNoIncluidos": "",
    "preenviosNoIncluidos": [],
    "mensajeCantidaMaximaPreenvios": "",
    modoPruebaHeka: true
  }
}

function validateSucursal(data) {

  if(data.length == 1) return false;
  const sucursalIds = new Set();
  for (let i = 0; i < data.length; i++) {
      sucursalIds.add(data[i].branchCode);
  }
  return sucursalIds.size === data.length;
}

async function createSpreadsheet(req, res) {
  const data = req.body;
  const query = req.query || null;
  
  const queryDb = await db.collection("documentos").doc(data.id).get();
  const userData = queryDb.data();
  const fileNameGuias = "Relacion "+ data.listGuides.join('_') +".pdf";
  const pathUrl = userData.id_user + "/" + data.id + "/" + fileNameGuias;
  if(userData.nombre_relacion) {
    const urlFile = await storage.ref().child(pathUrl).getDownloadURL();
    return res.status(200).send({
      'code': 200,
      'response': {
        'urlDocument': urlFile
      }
    });
  }
  else {
    let build = {
      idCliente: CredencialesEmpresa.idCliente,
      idSucursal: data.branchCode,
      listaNumPreenvios: data.listGuides
    };

    try {
      sendSpreadsheetApi(build, query.mode).then((response) => {
        saveFileStorage(response.arregloBytesPlanilla, pathUrl).then(async reponseStorage => {
          db.collection("documentos")
          .doc(data.id)
          .update({
            nombre_relacion: fileNameGuias,
            descargar_relacion_envio: true
          });
          const urlFile = await storage.ref().child(pathUrl).getDownloadURL();
          return res.status(200).send({
            'code': 200,
            'response': {
              'urlDocument': urlFile
            }
          });
        }).catch(e => {
          res.status(400).send({
            'code': 400,
            'response': {"message": e.Message}
          });
        });
      }).catch(e => {
        res.status(400).send({
          'code': 400,
          'response': {"message": e.Message}
        });
      });
    } catch (error) {
      res.status(400).send({
        'code': 400,
        'response': {"message": 'Hubo un problema con el proceso, contacte el adminitrador para mas detalles'}
      });
    }

    
  } 
}

function sendSpreadsheetApi(build, mode) {
  return new Promise(async (resolve, reject) => {
    if(mode == 'test') {
      return resolve(testPlantilla());
    }
    request.post(CredencialesEmpresa.endpoint + "/Planilla/GenerarPlanillaRecoleccionPreenvios", {
      headers: {
          "x-app-signature": CredencialesEmpresa.x_app_signature,
          "x-app-security_token":  CredencialesEmpresa.x_app_security_token,
          "Content-type": "application/json"
      },
      body: JSON.stringify(build)
      }, (error, response, body) => {
        const bodyResponse = JSON.parse(response.body);
        if(bodyResponse.numeroPlanilla) {
          return resolve(bodyResponse);
        }
        reject(bodyResponse); 
      }
    )
  });
}

function testPlantilla() {
  return {
    "numeroPlanilla": 70910,
    "fechaCreacion": "2023-12-14T09:26:00.7596872-05:00",
    "cantidadPreenvios": 1,
    "mensajeCantidaMaximaPreenvios": "",
    "numerosPreenviosNoIncluidos": [],
    "mensajePreenviosInvalidos": "",
    "numerosPreenviosInvalidos": [],
    "arregloBytesPlanilla": ""
  };
}

async function saveFileStorage(base64, path) {
  return await storage
    .ref()
    .child(path)
    .putString(base64, "base64");
}

module.exports = {
  createDirectSporadicCollections,
  createSpreadsheet
}