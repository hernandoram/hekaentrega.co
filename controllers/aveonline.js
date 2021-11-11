const rq = require("request-promise");
const Cr = require("../keys/aveo");

const firebase = require("../keys/firebase");
const db = firebase.firestore();

// console.log(Cr);

exports.auth = async (req, res, next) => {
    const authentication = await rq.post(Cr.endpoint + "/comunes/v1.0/autenticarusuario.php", {
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            tipo: "auth",
            usuario: Cr.usuario,
            clave: Cr.clave
        })
    }).then(res => JSON.parse(res));

    req.params.token = authentication.token;
    next()
}

exports.cotizar = async (req, res) => {
    const {idasumecosto, contraentrega, recaudo} = revisarTipoEnvio(req.params.type, req.params.recaudo)
    req.params.recaudo = recaudo;
    

    try {
        const cotizacion = await rq.post(Cr.endpoint + "/nal/v1.0/generarGuiaTransporteNacional.php", {
            headers: {"Content-type": "Application/json"},
            body: JSON.stringify({
                "tipo":"cotizar",
                "token": req.params.token,
                "idempresa": Cr.idEmpresa,
                "unidades": 1,
                idasumecosto, contraentrega,
                "origen": req.params.origen,
                "destino": req.params.destino,
                "kilos": req.params.peso,
                "valorrecaudo": req.params.recaudo,
                "valordeclarado": req.params.valorDeclarado,
            })
        }).then(res => JSON.parse(res));
        res.json(cotizacion)
    } catch {
        res.json({status:"error", message:"Cotizaciones no encontradas.", cotizaciones:[]})
    }

    // console.log(res);
}

exports.crearGuia = async (req, res) => {
    const guia = req.body;
    const codTransp = req.body.transportadora === "TCC" ? Cr.codTcc : Cr.codEnvia;
    const {idasumecosto, contraentrega, recaudo} = revisarTipoEnvio(guia.type, guia.valor);

    let data = {
        "tipo":"generarGuia",
        "token": req.params.token,
        "idempresa": Cr.idEmpresa,
        "origen": guia.ave_ciudadR,
        "dsdirre": guia.direccionR,
        "dsbarrioo":"",
        "destino": guia.ave_ciudadD,
        "dsdir": guia.direccionD,
        "dsbarrio":"",
        "dsnitre": 1072497419-8,
        "dstelre": guia.celularR,
        "dscelularre": guia.celularR,
        "dscorreopre":"",
        "dsnit": guia.identificacionD,
        "dsnombre": guia.nombreR,
        "dsnombrecompleto": guia.nombreD,
        "dscorreop": guia.correoD,
        "dstel": guia.telefonoD,
        "dscelular": guia.celularD,
        "idtransportador": codTransp,
        "idalto": guia.alto,
        "idancho": guia.ancho,
        "idlargo":guia.largo,
        "unidades": 1,
        "kilos": guia.peso,
        "valordeclarado": guia.valor,
        "dscontenido": guia.dice_contener,
        "dscom": guia.detalles,
        "idasumecosto": idasumecosto,
        "contraentrega": contraentrega,
        "valorrecaudo": recaudo,
        "idagente":Cr.idAgente,
        "dsreferencia":"",
        "dsordendecompra":"",
        "bloquegenerarguia": 1,
        "relacion_envios": 0,
        "enviarcorreos": 1,
        "guiahija":"",
        "accesoila":"",
        "cartaporte":""  
    }

    try {
        const respuesta = await rq.post(Cr.endpoint + "/nal/v1.0/generarGuiaTransporteNacional.php", {
            headers: {"Content-Type": "Application/json"},
            body: JSON.stringify(data)
        }).then(res => JSON.parse(res));
    
        res.json(respuesta);
    } catch (e){
        console.log(e.message);
        res.json({message: "Error al conectar con la transportadora."})
    }
}

exports.generarRelacion = async (req, res) => {
    const guias = req.body.arrGuias;
    const numerosGuias = guias.map(v => parseInt(v.numeroGuia)).join();
    const identificadores = guias.map(v => v.id_heka).sort();

    try {
        const respuesta = await rq.get("https://aveonline.co/api/nal/v1.0/generarGuiaTransporteNacional.php", {
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                "tipo": "relacionEnvios",
                "token": req.params.token,
                "idempresa": Cr.idEmpresa,
                "transportadora": Cr.codEnvia,
                "guias": numerosGuias
            })
        }).then(res => {
            console.log(res);
            return JSON.parse(res);
        });

        let campos_actualizados = {
            guias: identificadores
        }
    
        if(!respuesta.relacionenvio) {
            campos_actualizados.descargar_relacion_envio = false;
            campos_actualizados.important = true;
            campos_actualizados.href = "documentos";
        } else {
            campos_actualizados.nro_manifiesto = respuesta.relacionenvio
        }

        await db.collection("documentos").doc(vinculo.id_doc).update(campos_actualizados)
        .then(() => {
        console.log("Ya se configuró el documento correctamente")
        for (let guia of guias) {
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
        console.log("Se están actualizando todos los estados");
      })
      .catch(error => {
        console.log("Hubo un error para configurar el documento");
  
      });
        
        res.json(respuesta);
    } catch {
        console.log("Hubo un error Al generar la relación de aveonline");
    }
}

exports.consultarRelacion = async (req, res) => {
    const html = rq.get("https://aveonline.co/app/modulos/relacion_envios/imprimir.codigobarras.php?dsconsec=&idagente=&idexp=11635&codagente=&idcliente=&idremitente=&idempresa=&idproveedoroc=&dscofigo=11635101020211103162336&id=")
    .then(data => {
        recibed = data.replace("AVE GROUP ", "");
        recibed = recibed.replace("aveonline", "Heka entrega");
        recibed = recibed.replace(/\.\.\/\.\./g, "https://aveonline.co/app");
        recibed = recibed.replace(/\.\.\//g, "https://aveonline.co/app/modulos/");

        res.send(recibed);
    })
}

function revisarTipoEnvio(type,recaudo) {
    let idasumecosto = 1, contraentrega = 0

    if(type === "CONVENCIONAL") {
        idasumecosto = 0
        recaudo = 0;
    } else if (type === "SUMAR ENVIO") {
        contraentrega = 1;
    }

    return {idasumecosto, contraentrega, recaudo}
}