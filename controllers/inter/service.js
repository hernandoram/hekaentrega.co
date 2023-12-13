
const {CredencialesEmpresa} = require("../../keys/interCredentials");
const request = require("request");
const firebase = require("../../keys/firebase");
const db = firebase.firestore();

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
    let build = {
      IdClienteCredito: CredencialesEmpresa.branchCode,
      listaNumPreenvios: []
    };

    let documents = [];

    data.forEach(element => {
      build.IdSucursalCliente = element.branchCode;
      build.fechaRecogida = element.date;
      element.listGuides.forEach(list => {
        build.listaNumPreenvios.push(list);
      });
      documents.push(element.id);
    });
    createBuild(build, query.mode)
      .then((response) => {
        documents.forEach(item => {
          db.collection("documentos")
          .doc(item)
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

function createBuild(build, mode) {
  return new Promise(async (resolve, reject) => {
    if(mode == 'test') {
      return resolve(testMode(build));
    }

    request.post(CredencialesEmpresa.endpointv2 + "/InsertarAdmision", {
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
    "mensajeCantidaMaximaPreenvios": ""
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
  res.status(400).send({
    'code': 400,
    'response': {"message": 'La sucursal no puede ser diferente'}
  });

  let build = {
    idCliente: CredencialesEmpresa.branchCode,
    idSucursal: data.branchCode,
    listaNumPreenvios: data.listGuides
  };

  
}

function sendSpreadsheetApi(build) {
  return new Promise(async (resolve, reject) => {
    request.post(CredencialesEmpresa.endpointv2 + "/Planilla/GenerarPlanillaRecoleccionPreenvios", {
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

module.exports = {
  createSporadicCollections,
  createSpreadsheet
}