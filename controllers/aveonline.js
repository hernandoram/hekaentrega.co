const rq = require("request-promise");
const fetch = require("node-fetch");
const Cr = require("../keys/aveo");

const firebase = require("../keys/firebase");
const db = firebase.firestore();

const funct = require("../extends/funciones");
const guiasPorCrear = new Array();
const referenceListado = db.collection("listaGuiasAveo")

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
    const token = req.params.token
    const body = req.body;
    const {idasumecosto, contraentrega, recaudo} = revisarTipoEnvio(body);
    body.valorRecaudo = recaudo;
    const data = {
        "tipo": "cotizar2",
        token,
        "idempresa": Cr.idEmpresa,
        "origen": body.origen,
        "destino": body.destino,
        "valorrecaudo": recaudo,
        "productos": [
          {
            "alto": body.alto,
            "largo": body.largo,
            "ancho": body.ancho,
            "peso": body.peso,
            "unidades": 1,
            "nombre": "Nombre producto",
            "valorDeclarado": body.valorDeclarado
          }
        ],
        // "valorMinimo": 0,
        idasumecosto,
        contraentrega
    }

    try {
        const cotizacion = await rq.post(Cr.endpoint + "/nal/v1.0/generarGuiaTransporteNacional.php", {
            headers: {"Content-type": "Application/json"},
            body: JSON.stringify(data)
        }).then(res => JSON.parse(res));
        res.json(cotizacion)
    } catch {
        res.json({status:"error", message:"Cotizaciones no encontradas.", cotizaciones:[]})
    }

    // console.log(res);
}

exports.crearGuia = async (req, res) => {
    const guia = req.body;
    await referenceListado.doc(guia.id_heka).set(guia);
    res.send("Se guardó tu registro");
}

exports.generarRelacion = async (req, res) => {
    const guias = req.body.arrGuias;
    const vinculo = req.body.vinculo;
    const numerosGuias = guias.map(v => parseInt(v.numeroGuia)).join();
    const identificadores = guias.map(v => v.id_heka).sort();

    try {
        const respuesta = await rq.get("https://aveonline.co/api/nal/v1.0/generarGuiaTransporteNacional.php", {
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                "tipo": "relacionEnvios",
                "token": req.params.token,
                "idempresa": Cr.idEmpresa,
                "transportadora": guias[0].transportadora === "ENVIA" ? Cr.codEnvia : Cr.codTcc,
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
            if(guias.length) {
                db.collection("notificaciones").add({
                  fecha: fecha.getDate() +"/"+ (fecha.getMonth() + 1) + "/" + fecha.getFullYear() + " - " + fecha.getHours() + ":" + fecha.getMinutes(),
                  visible_admin: true,
                  mensaje: "Hubo un problema para crear el manifiesto de las guías " + guias.map(v => v.id_heka).join(", "),
                  guias: guias.map(v => v.id_heka),
                  timeline: new Date().getTime(),
                  detalles: [respuesta.message]
                }).catch((err) => {
                    console.log(err);
                });
            }
            campos_actualizados.descargar_relacion_envio = false;
            campos_actualizados.important = true;
            campos_actualizados.href = "documentos";
        } else {
            campos_actualizados.nro_manifiesto = respuesta.relacionenvio;
            campos_actualizados.idEmpresa = Cr.idEmpresa;
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
        res.json({
            status: "error",
            message: "Error al crear el manifiesto"
        })
    }
}

exports.consultarRelacion = async (req, res) => {
    const idExp = parseInt(req.query.idEmpresa) || Cr.idEmpresa;
    const dscofigo = req.params.nro_manifiesto;
    const html = rq.get("https://aveonline.co/app/modulos/relacion_envios/imprimir.codigobarras.php?dsconsec=&idagente=&idexp="+idExp+"&codagente=&idcliente=&idremitente=&idempresa=&idproveedoroc=&dscofigo="+dscofigo+"&id=")
    .then(data => {
        recibed = data.replace("AVE GROUP ", "");
        recibed = recibed.replace("aveonline", "Heka entrega");
        recibed = recibed.replace(/\.\.\/\.\./g, "https://aveonline.co/app");
        recibed = recibed.replace(/\.\.\//g, "https://aveonline.co/app/modulos/");

        res.send(recibed);
    })
}

exports.obtenerStickerGuia = async (req, res) => {
    console.log(" body => ",req.body);
    const base64 = await urlToPdfBase64(req.body.url);

    if(!base64.includes("JVBERi0xLjQKJ")) return res.json([]);

    const base64Segmented = funct.segmentarString(base64, 500000);
    res.json(base64Segmented);
}

exports.crearAgente = async (req,res) => {
    const datos = req.query;
    const newAgent = {
        "tipo": "crearAgente",
        "token": req.params.token,
        "nombre": datos.nombres + " " + datos.apellidos,
        "idnit": datos.numero_documento,
        "identificacion": Cr.idEmpresa,
        "telefono": datos.celular,
        "direccion": datos.direccion + " " + datos.barrio,
        "nombreContacto": datos.nombres + " " + datos.apellidos,
        "correo": datos.correo,
        "idvalorminimo": 2,
        "ciudad": datos.ciudad,
        "comentarios": "",
        "email1": datos.correo,
        "email2": datos.correo,
        // "email3": "alangarcia@aveonline.co",
        // "email4": "alangarcia@aveonline.co",
        "verRecaudos": 1,
        "rutaimgalterna": "https://www.aveonline.co/principales/img/logo.png",
        "agentePrincipal": 2
    }

    const respuesta = await rq.post("https://aveonline.co/api/comunes/v1.0/agentes.php", {
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(newAgent)
    });

    console.log(respuesta);
    res.json(JSON.parse(respuesta));
}

exports.listarAgentes = async (req, res) => {
    const data = {
        "tipo": "listarAgentesPorEmpresaAuth",
        "token": req.params.token,
        "idempresa": Cr.idEmpresa
    }
    const respuesta = await rq.post("https://aveonline.co/api/comunes/v1.0/agentes.php", {
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });


    res.json(JSON.parse(respuesta));
}

exports.actualizarMovimientos = async (doc) => {
    const auth = await internalAuth();
    const respuesta = await rq.post("https://aveonline.co/api/nal/v1.0/guia.php", {
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            "tipo":"obtenerEstadoAuth",
            "token": auth.token,
            "id": Cr.idEmpresa,
            "guia": doc.data().numeroGuia
        })
    })
    .then(res => JSON.parse(res))
    .catch(err => {
        return {
            status: "error",
            message: err.message
        }
    });

    if(respuesta.status === "error") {
        const finalizar_seguimiento = doc.data().prueba ? true : false;
        if(finalizar_seguimiento) {
            await funct.actualizarEstado(doc, {
                estado: "Finalizado",
                ultima_actualizacion: new Date(),
                seguimiento_finalizado: finalizar_seguimiento
            });
        }

        return [{
            estado: "Error",
            guia: doc.id + " / " + doc.data().numeroGuia + " " + respuesta.message
        }]
    }

    const estados_finalizacion = ["Documento Anulado", "Entrega Exitosa", "Devuelto al Remitente"];
    
    const detallesGuia = respuesta.guias[0];
    const movimientos = detallesGuia.historicos;
    
    const ultimo_estado = movimientos[movimientos.length - 1];
    let finalizar_seguimiento = doc.data().prueba ? true : false


    const estado = {
        numeroGuia: detallesGuia.dsconsec, //guia devuelta por la transportadora
        fechaEnvio: detallesGuia.dsfecha,
        ciudadD: detallesGuia.origen,
        nombreD: detallesGuia.destino,
        direccionD:  detallesGuia.direccion,
        estadoActual: detallesGuia.estado,
        fecha: ultimo_estado ? ultimo_estado.fechamostrar : detallesGuia.dsfecha, //fecha del estado
        id_heka: doc.id,
        movimientos
    };
    
    
    updte_estados = await funct.actualizarEstado(doc, {
        estado: detallesGuia.estado,
        ultima_actualizacion: new Date(),
        seguimiento_finalizado: estados_finalizacion.some(v => detallesGuia.estado === v)
            || finalizar_seguimiento
    });

    updte_movs = {
        estado: "Mov.N.A",
        guia: doc.id + " / " + doc.data().numeroGuia + " No contiene movimientos aún."
    }

    if(movimientos.length) {
        updte_movs = await funct.actualizarMovimientos(doc, estado);
    }
    return [updte_estados, updte_movs]
}

async function internalAuth() {
    const authentication = await rq.post(Cr.endpoint + "/comunes/v1.0/autenticarusuario.php", {
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            tipo: "auth",
            usuario: Cr.usuario,
            clave: Cr.clave
        })
    }).then(res => JSON.parse(res));

    return authentication;
}

fillGuiasPorCrear();
function fillGuiasPorCrear() {
    referenceListado.orderBy("timeline")
    .onSnapshot(querySnapShot => {
        querySnapShot.docChanges().forEach(change => {
            if(change.type === "added") {
                const preFilled = guiasPorCrear.length;
                guiasPorCrear.push(change.doc.data());
                if(!preFilled) inspectGuiasPorCrear();
            }
        })
    })
}

async function inspectGuiasPorCrear() {
    console.log(guiasPorCrear);
    if(!guiasPorCrear.length) return;
    const guia = guiasPorCrear.shift();
    guia.valor = guia.valorRecaudo;

    const codTransp = guia.transportadora === "TCC" ? Cr.codTcc : Cr.codEnvia;
    const {idasumecosto, contraentrega, recaudo} = revisarTipoEnvio(guia, "crear");
    const refGuia = db.collection("usuarios").doc(guia.id_user)
    .collection("guias").doc(guia.id_heka);
    
    try {
        const auth = await internalAuth();
        const token = auth.token;


        let data = {
            "tipo": "generarGuia2",
            "token": token,
            "idempresa": Cr.idEmpresa,
            "codigo": Cr.usuario,
            "dsclavex": Cr.clave,
            "origen": guia.ave_ciudadR,
            "dsdirre": guia.direccionR,
            "dsbarrioo":"",
            "destino": guia.ave_ciudadD,
            "dsdir": guia.direccionD,
            "dsbarrio":"",
            "dsnitre": 1072497419-8,
            "dstelre": guia.celularR,
            "dscelularre": guia.celularR,
            "dscorreopre": guia.correoR,
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
            "productos": [
              {
                "alto": guia.alto,
                "ancho": guia.ancho,
                "largo":guia.largo,
                "peso": guia.peso,
                "unidades": 1,
                "nombre": "Heka",
                "ref": guia.id_heka,
                "valorDeclarado": guia.seguro
              }
            ],
            "dscontenido": guia.dice_contener,
            "dscom": guia.observaciones,
            "idasumecosto": idasumecosto,
            "contraentrega": contraentrega,
            "valorrecaudo": recaudo,
            "idagente": guia.idAgente,
            "dsreferencia": "",
            "dsordendecompra": "",
            "bloquegenerarguia": "1",
            "relacion_envios": "1",
            "enviarcorreos": "1",
            "cartaporte": "",
            "valorMinimo": 0
          }

        console.log(data);

        const response = await rq.post(Cr.endpoint + "/nal/v1.0/generarGuiaTransporteNacional.php", {
            headers: {"Content-Type": "Application/json"},
            body: JSON.stringify(data)
        }).then(res => JSON.parse(res));

        if(response.status === "error") throw new Error(response.message);
        const resultado = response.resultado.guia
        console.log(resultado);

        const base64 = resultado.archivoguia;
        const isBase64 = base64.length > 100 && guia.type === "CONVENCIONAL" && guia.transportadora === "ENVIA";

        const numeroGuia = resultado.numguia.toString() || "Error";
        const estado = "Recibido";
        let urlGuia = resultado.rutaguia;
        urlGuia = urlGuia ? urlGuia.replace(/amp;/g, "") : false;

        const toSave = isBase64 ? base64.replace(/\s/g, "") : urlGuia;

        const has_sticker = await saveBase64Guia(guia.id_heka, toSave, isBase64);

        refGuia.update({numeroGuia, urlGuia, has_sticker, estado});
        referenceListado.doc(guia.id_heka).delete();
    } catch (e){
        console.log(e.message);
        refGuia.update({estado: e.message})
    }

    inspectGuiasPorCrear();
}

async function saveBase64Guia(id, toSave, isBase64) {
    if(!toSave) return false;
    const base64 = isBase64 ? toSave : await urlToPdfBase64(toSave);
    const base64Segmented = funct.segmentarString(base64, 500000);
    const comprobadorPdf = "JVBERi0xLjQKJ";
    const refToSave = db.collection("base64StickerGuias")
    .doc(id).collection("guiaSegmentada");

    if(!base64.includes(comprobadorPdf)) return false;

    if(typeof base64Segmented !== "object") return false;

    if(!base64Segmented.length) return false;

    let guardado = true;
    for (let i = 0; i < base64Segmented.length; i++) {
        const res = await refToSave.doc(i.toString()).set({
            index: i, segmento: base64Segmented[i]
        })
        .then(() => true)
        .catch((error) => {
            console.log("hubo un error al guardar una parte del documento segmentado => ", error)
            guardado = false;
            return false;
        });
        
        if(!res) break;
    };

    return guardado;

}

// urlToPdfBase64("https://aveonline.co/app/modulos/paqueteo/imprimir.guia.envia.php?pkid=2293858&idagente=6911&idexp=20283&codagente=&idcliente=119839&idremitente=0&imprimir=1&veces=2&idempresa=20283");
async function urlToPdfBase64(url) {
    console.log("Url =>", url);
    const res = await fetch(url).then(r => {
        // console.log(r)
        // console.log(r.arrayBuffer())
        return r.arrayBuffer();
    }).catch(e => console.log(e));

    // console.log(res);
    const buff = Buffer.from(res, "utf8");
    const base64 = buff.toString("base64");
    const comprobadorPdf = "JVBERi0xLjQKJ";

    // console.log("base64 => ", base64);
    return base64; 
}

function revisarTipoEnvio(guia, from) {
    let idasumecosto = 0, contraentrega = 0
    const type = guia.type;
    const detalles = guia.detalles
    let recaudo = detalles ? detalles.recaudo : guia.valorRecaudo;
    console.log(detalles);
    if(type === "CONVENCIONAL") {
        recaudo = 0;
    }

    console.log(recaudo);

    return {idasumecosto, contraentrega, recaudo}
}