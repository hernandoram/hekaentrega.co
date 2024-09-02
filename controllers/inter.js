const request = require("request");
const requestP = require("request-promise")
const extsFunc = require("../extends/funciones");
const puppeteer = require("puppeteer");
// const Handlebars = require("express-handlebars");
const {Credenciales, UsuarioPrueba, CredencialesEmpresa} = require("../keys/interCredentials");
const urlEstados = "https://www3.interrapidisimo.com/ApiservInter/api/Mensajeria/ObtenerRastreoGuias?guias=";

const firebase = require("../keys/firebase");
const { notificarNovedadEncontrada } = require("../extends/notificaciones");
const { estadosGuia, detectaNovedadEnElHistorialDeEstados, modificarEstadoGuia, atributosAdicionalesEnActualizacion } = require("../extends/manejadorMovimientosGuia");
const db = firebase.firestore();

//FUNCIONES REGULARES
// Estas funciones actualmente no están siendo utilizadas
function retornarEstado() {
    let info = new Object();
    const tds = document.querySelectorAll("#TabContainer2_TabPanel8 table table td");
    tds.forEach(td => {
        const label = td.firstElementChild.textContent;
        const input = td.getElementsByTagName("input")[0].value;
        info[label] = input;
    })
    return info;
};

function retornarDetalles(idTablaPanel) {
    let info = new Array();
    const rows = document.querySelectorAll(idTablaPanel + " tr");
    if(!rows.length) return "Empty Data";

    const titles = new Array();
    const headTab = rows[0].children;

    for(let i = 0; i < headTab.length; i++) {
        titles.push(headTab[i].textContent);
    }



    for(let i = 1; i < rows.length; i++) {
        let mov = new Object()
        const bodyTab = rows[i].children;

        for(let j = 0; j < bodyTab.length; j++) {
            const value = bodyTab[j].textContent;
            mov[titles[j]] = value.trim();
        };

        info.push(mov);
    }

    return info;
};

async function scrapEstados(numeroGuia, tipoconsulta) {
    const url = "http://reportes.interrapidisimo.com/Reportes/ExploradorEnvios/ExploradorEnvios.aspx?keyInter=1)";

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disabled-setuid-sandbox"]
    });

    try {
        const page = await browser.newPage();
        console.log("accediendo a la página");
        await page.goto(url, {
            waitUntil: "load"
        });

        await page.waitForSelector("#tbxNumeroGuia");
        
        console.log("Escribiendo el numero de guia");
        await page.type("#tbxNumeroGuia", numeroGuia.toString());
        console.log("presionando el botón de buscar");
        await page.click("#btnShow");

        const tab = "#TabContainer2_body"
        await page.waitForSelector(tab);
        await page.waitForTimeout(1000);
        page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

        const estado = await page.evaluate(retornarEstado);
        const flujo = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel7_gvFlujoGuia");
        const novedades = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel18_gvNovedadesGuia");
        const caja = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel21_GridViewAfectCaja")


        await browser.close();
        console.log("Navegador cerrado")
        
        let respuesta = {
            estado, flujo, novedades, caja
        };

        switch(tipoconsulta) {
            case "estado":
                respuesta = estado
                break;
            case "flujo":
                respuesta = flujo
                break;
            case "novedades":
                respuesta = novedades
                break;
            case "caja":
                respuesta = caja
                break;
            default: 
                break;

        }

        return respuesta;
    } catch (e) {
        await browser.close();
        
        console.log("Hubo un error con puppeteer")
        console.log(numeroGuia)
        console.log(e);

        return false;
    }  
}

const actualizarMovimientosScrapp = async function(doc) {
    console.log("consultando inter")
    const consulta = await scrapEstados(doc.data().numeroGuia);
    let updte_estados, updte_movs;
    try {
        if(!consulta) throw " Hubo un error en el scrap de estados"
        if(consulta.flujo === "Empty Data") throw " No presenta movimientos aún."
        const estados_finalizacion = ["Documento Anulado", "Entrega Exitosa", "Devuelto al Remitente"];
        const ultimo_estado = consulta.flujo[consulta.flujo.length - 1];
        const movimientos = {
            numeroGuia: doc.data().numeroGuia, //guia devuelta por la transportadora
            fechaEnvio: consulta.estado["Fecha Asignación"], 
            ciudadD: doc.data().ciudadD,
            nombreD: doc.data().nombreD,
            direccionD: doc.data().direccionD,
            estadoActual: consulta.estado['Ultimo Estado'],
            fecha: ultimo_estado["Fecha Cambio Estado"], //fecha del estado
            id_heka: doc.id,
            movimientos: consulta.flujo // movimientos registrados por la transportadora
        };

        let finalizar_seguimiento = doc.data().prueba ? true : false
        const seguimiento_finalizado = estados_finalizacion.some(v => consulta.estado["Gestion del Envio"] === v)
        || finalizar_seguimiento;
        updte_estados = await extsFunc.actualizarEstado(doc, {
            estado: consulta.estado["Gestion del Envio"] || consulta.estado['Ultimo Estado'],
            ultima_actualizacion: new Date(),
            seguimiento_finalizado,
            estadoActual: seguimiento_finalizado ? estadosGuia.finalizada : estadosGuia.proceso
        });
        
        updte_movs = await extsFunc.actualizarMovimientos(doc, movimientos);

        return [updte_estados, updte_movs]
    } catch (e) {
        return [{
            estado: "error",
            guia: doc.id + " / " + doc.data().numeroGuia + e
          }]
    }
}
// Fin de las funciones inutilizadas

const actualizarMovimientos = async function(docs) {

    try {
        const credentials = getCredentials("EMPRESA", false); // Para la actualidad todas las guía deben estar bajo las credenciales de empresa y esta funcionalidad, no estaría disponible para guías de usuarios de prueba

        const numerosGuia = docs.map(d => d.data().numeroGuia || undefined).filter(Boolean);
    
        const resEstados = await requestP(credentials.endpoint + "/ClientesCredito/ConsultarEstadosGuiasCliente", {
            method: "POST",
            headers: {
                "x-app-signature": credentials.x_app_signature,
                "x-app-security_token":  credentials.x_app_security_token,
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                IdCliente: credentials.idCliente,
                numeroGuias: numerosGuia
            })
        })
        .then(d => JSON.parse(d));

        if(!resEstados.listadoGuias) throw new Error("La solicitud no devolvió ningún estado de las guías.");

        if(resEstados.Message) throw new Error(resEstados.Message);

        const resultadoActualizacion = [{
            estado: "Est.M",
            actualizadas: 0,
            errores: 0,
            causas: []
        }, {
            estado: "Mov.M",
            actualizadas: 0,
        }];

        for await (const d of docs) {
            const numeroGuia = d.data().numeroGuia;
            const reporte = resEstados.listadoGuias.find(rep => rep.numeroGuia == numeroGuia);

            if(!reporte) continue;

            const [est, mov, error] = await actualizarMovimientoIndividual(d, reporte);

            if(est) resultadoActualizacion[0].actualizadas++;
            if(mov) resultadoActualizacion[1].actualizadas++;

            if(error) {
                resultadoActualizacion[0].errores++;
                resultadoActualizacion[0].causas.push(error);
            }

        }

        return resultadoActualizacion;


    } catch (error) {
        console.log(error);
        return [{
            estado: "Error",
            guia: "Segmento de guías: " + error.message,
            causa: error.message || "Error desconocido INTERRAPIDISIMO"
        }]
    }
  
}


async function actualizarMovimientoIndividual(doc, respuesta) {
    try {
        const guia = doc.data();
        const estadosGuia = respuesta.estadosGuia ?? [];
        const estadosPreenvio = respuesta.estadosPreenvio ?? [];

        const movimientos = estadosPreenvio.concat(estadosGuia);
        let finalizar_seguimiento = guia.prueba ? true : false;
        let entrega_oficina_notificada = guia.entrega_oficina_notificada || false;

        const gTime = (fecha) => new Date(fecha).getTime();
        
        movimientos
        .sort((a,b) => {
            return gTime(a.fechaEstado) - gTime(b.fechaEstado);
        })
        .map(est => {
            if(est.nombreEstado === "Para Reclamar en Oficina" && !entrega_oficina_notificada) {
                extsFunc.notificarEntregaEnOficina(guia);
                entrega_oficina_notificada = true;
            }

            est.novedad = [26, 39, 40, 7, 32, 10, 30, 33].includes(est.idEstadoGuia) ? est.nombreEstado : "";
            est.fechaEstado = extsFunc.estandarizarFecha(new Date(est.fechaEstado), "DD/MM/YYYY HH:mm");
            
            return est;
        });

        const primerEstado = movimientos[0];
        const ultimoEstado = movimientos[movimientos.length - 1];
    
        const estadoActual = ultimoEstado.nombreEstado;
    
        const estado = {
            numeroGuia: respuesta.numeroGuia.toString(), //guia devuelta por la transportadora
            fechaEnvio: primerEstado.fechaEstado,
            ciudadD: primerEstado.nombreCiudadDestino,
            nombreD: guia.nombreD,
            direccionD:  guia.direccionD,
            estadoActual,
            fecha: ultimoEstado.fechaEstado,
            id_heka: doc.id,
            movimientos
        };
    
        updte_movs = await extsFunc.actualizarMovimientos(doc, estado);

        guia.estadoTransportadora = estadoActual;

        // Función encargada de actualizar el estado, como va el seguimiento, entre cosas base importantes
        const actualizaciones = modificarEstadoGuia(guia);
        actualizaciones.enNovedad = detectaNovedadEnElHistorialDeEstados(updte_movs);

        // Esto me llena un arreglo de todas las novedades que han sido notificadas, para consultarlo y evitar duplicar notificaciones
        actualizaciones.novedadesNotificadas = await notificarNovedadEncontrada(guia, estado.movimientos);
    
        // Esto pasa una serie de argumentos, que detecta que haya alguna información para actualizar
        // en caso de que los valores del segundo parametros sean falsos, undefined o null, no los toma en cuenta para actualizar
        atributosAdicionalesEnActualizacion(actualizaciones, {
            seguimiento_finalizado: finalizar_seguimiento, entrega_oficina_notificada
        });
    
        const updte_estados = await extsFunc.actualizarEstado(doc, actualizaciones);
    
        return [updte_estados.estado === "Est.A", updte_movs.estado === "Mov.A"];
    } catch (e) {
        console.log(e.message);
        return [null, null, e.message];
    }
}

const encontrarId_heka = async function(numeroGuia) {
    const respuesta = await requestP.get(urlEstados + numeroGuia)
    .then(res => JSON.parse(res));
    const id_heka = respuesta[0].Guia.Observaciones
    console.log(respuesta[0].Guia.Observaciones);
    return id_heka.toString().trim();
}

function getCredentials(cuenta_responsable, prueba) {
    if(prueba) return UsuarioPrueba;

    switch(cuenta_responsable) {
        case "EMPRESA":
            return CredencialesEmpresa;
        default:
            return Credenciales;
    }
}

async function creacionGuia(guia) {
    const credentials = getCredentials(guia.cuenta_responsable, guia.prueba);
    const url =  credentials.endpoint;
    const nombreTipoEnvio = guia.peso < 3 ? "PAQUETE PEQUEÑO" : "PAQUETE";
    const idTipoEnvio = guia.peso < 3 ? 3 : 9;
    const idServicio = guia.peso < 6 ? 3 : 6;
    const tiempoInicial = Date.now();

    const dest = extsFunc.transformarDatosDestinatario(guia);

    let data = {
        "IdClienteCredito": credentials.idCliente, //Codigo cliente
        "CodigoConvenioRemitente": guia.codigo_sucursal, //Codigo sucursal
        "IdTipoEntrega": guia.id_tipo_entrega || 1, // 1 ENTREGA EN DIRECCIÓN; 2: RECLAMO EN OFICINA
        "AplicaContrapago": dest.type !== "CONVENCIONAL",
        "IdServicio": idServicio, 
        "Peso": guia.peso, //En kilogramos
        "Largo":guia.largo, //En centimetros
        "Ancho":guia.ancho,
        "Alto":guia.alto, 
        "DiceContener": guia.dice_contener,
        "ValorDeclarado": guia.seguro,
        "IdTipoEnvio": idTipoEnvio,
        "IdFormaPago":2,
        "NumeroPieza":1,
        "Destinatario":{
            "tipoDocumento": dest.tipo_documento === 1 ? "NIT" : "CC",
            "numeroDocumento": dest.numero_documento,
            "nombre": dest.nombre,
            "primerApellido":  " ", //Si se debe enviar si es un cliente persona natural, es obligatorio
            "segundoApellido": "",
            "telefono": dest.telefono,
            "direccion": dest.direccion,
            "idDestinatario":0, "idRemitente":0, //Campos opcionales. Dejarlos en 0
            "idLocalidad": guia.dane_ciudadD, //Codigo DANE ciudad destinatario
            "CodigoConvenio":0, //Enviar valor 0 si no es cliente convenio
            "ConvenioDestinatario":0, //Enviar valor 0 si no es cliente convenio
            "correo": dest.correo //Obligatorio si es cliente convenio
        },
        "DescripcionTipoEntrega":"",
        "NombreTipoEnvio": nombreTipoEnvio,
        "CodigoConvenio":0, //Enviar valor 0 si no es cliente convenio
        "IdSucursal":0, //Enviar valor 0 si no es cliente convenio
        "IdCliente":0, //Enviar valor 0 si no es cliente convenio
        "Notificacion":null,
        "RapiRadicado":{
        }, //Enviar solo si el servicio es id 16 RapiRadicado
        "Observaciones": guia.id_heka + " - " + guia.dice_contener
    }

    const body = await requestP(url + "/Admision/InsertarAdmision", {
        method: "POST",
        headers: {
            "x-app-signature": credentials.x_app_signature,
            "x-app-security_token":  credentials.x_app_security_token,
            "Content-type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(d => JSON.parse(d))
    .catch(e => ({error: true, message: e.message}));
    
    if(typeof body === "string") {
        try {
            const respuesta = JSON.parse(body);
            if(!respuesta.idPreenvio) {
                console.log("error");
                db.collection("errores")
                .add({type: "INTER", data, respuesta})
            }

            body = respuesta;

        } catch (e) {
            console.log("Error al comprobar => ", e);
            
            // en caso de que no se pueda converir a JSON, se devuelve el texto directo al front
            body = {
                error: true,
                message: body
            }
        }
    }



    return body;
}

function comprimirCentroSerivciosInter(data) {
    const centrosServicio = data.reduce((a,b) => {
        const ref = a[b.CentroServicio.IdCentroServicio];
        
        if(ref) {
            ref.Horario.push(b.Horario);
        } else {
            a[b.CentroServicio.IdCentroServicio] = b;
            a[b.CentroServicio.IdCentroServicio].Horario = [b.Horario];
        }

        return a;
    }, {});
    
    const res = Object.values(centrosServicio);

    return res;
}

// FUNCIONES A EXPORTAR 
exports.creacionGuia = creacionGuia;

exports.cotizar = async (req, res) => {
    const {dane_ciudadD, dane_ciudadR, peso, seguro, pagoContraentrega} = req.body;
    const fecha = extsFunc.estandarizarFecha(new Date(), "DD-MM-YYYY");

    const urlRequest = CredencialesEmpresa.endpointcotizar
        + CredencialesEmpresa.idCliente 
        + "/" 
        + dane_ciudadR 
        + "/" 
        + dane_ciudadD 
        + "/" 
        + peso 
        + "/" 
        + seguro 
        + "/1/" 
        + fecha
        + "/" + pagoContraentrega;

    console.log(urlRequest);

    let cotizacion = await requestP(urlRequest)
    .then(d => {
        console.log("Result Cotización Inter: ", d);
        return JSON.parse(d)
    })
    .catch(err => err);

    console.log(cotizacion);

    res.json(cotizacion);
}

exports.crearGuia = (req, res) => {
    const guia = req.body;
    
    creacionGuia(guia)
    .then(d => res.send(d))
    .catch(e => res.send({error: true, message: e.message}));
};

exports.crearStickerGuia = (req, res) => {
    const prueba = req.query.prueba;
    const cuenta_responsable = req.query.cuenta_responsable;
    const credentials = getCredentials(cuenta_responsable, prueba);
    const url = credentials.endpoint;
    request.get(url + "/Admision/ObtenerBase64PdfPreGuia/" + req.params.id, {
        headers: {
            "x-app-signature": credentials.x_app_signature,
            "x-app-security_token": credentials.x_app_security_token
        }
    }, (error, response, body) => {
        if(error) {
            res.send("Hubo un error => "+error);
            return;
        }

        try {
            let base64 = JSON.parse(body);
            
            let segmentar = parseInt(req.query.segmentar);
            if(segmentar) {
                const segementado = Math.min(segmentar, 1000000)
                res.json(extsFunc.segmentarString(base64, segementado))
            } else {
                res.send(base64);
            }
        } catch (e) {
            console.error("No se pudo generar el Pdf de la guía: " + req.params.id, body);
            res.send(body);
        }
    })
};

exports.consultarGuia = async (req, res) => {   
    const respuesta = await scrapEstados(req.query.guia, req.query.type);
    
    res.json(respuesta);

}

exports.imprimirManifiesto = (req, res) => {
    const guiasPerPage = 20;
    const guias = req.params.guias.split(",");
    
    const numberOfPages = Math.ceil(guias.length / guiasPerPage);

    
    let organizatorGuias = new Array();
    let pageNumber = 1;

    while(pageNumber <= numberOfPages) {
        const guiaInicial = (pageNumber - 1) * guiasPerPage;
        const guiaFinal = pageNumber * guiasPerPage;
        const page = guias.slice(guiaInicial, guiaFinal);
        organizatorGuias.push(page);

        pageNumber++
    }

    res.render("printManifiestoInter", {organizatorGuias, layout:"printer"});
}

exports.consultarCentroServicios = async (req, res) => {
    const {dane_ciudad} = req.params;
    const urlRequest = `${CredencialesEmpresa.endpointOficinas}/${dane_ciudad}`;
    
    const centroServicios = await requestP(urlRequest, {
        headers: {
            usuario: "admin"
        },
        json: true
    })
    .then(d => {
        return d;
    })
    .catch(err => req.status(400).json({error: true, message: err.message}));

    res.json(comprimirCentroSerivciosInter(centroServicios));
}

exports.utilidades = async (req, res) => {
    const numeroGuia = req.params.numeroGuia.toString();
    try {
        const id_heka = await encontrarId_heka(numeroGuia);
    
        res.json({
            ok: true,
            message: "Proceso finalizado",
            id_heka,
            numeroGuia
        })
    } catch (e) {
        res.json({
            ok: false,
            message: e.message,
            numeroGuia
        })
    }
}

exports.actualizarMovimientos = actualizarMovimientos;