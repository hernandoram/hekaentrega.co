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

const estadosLogisticos = {
    1: {
        id: 1,
        nombre: "Admitida",
        estadoActual: "Envío admitido",
        observacion: "El envío se encuentra creado en sistema sin la recepción en centro logístico.",
        mostrarObservacion: false
    },
    2: {
        id: 2,
        nombre: "Centro acopio",
        estadoActual: "Ingresado a bodega",
        observacion: "El envío ingresa a centro logístico bien sea de origen o de destino.",
        mostrarObservacion: false
    },
    3: {
        id: 3,
        nombre: "Tránsito nacional",
        estadoActual: "Viajando en ruta nacional",
        observacion: "El envío es despachado a destino dentro de un operativo nacional.",
        mostrarObservacion: false
    },
    4: {
        id: 4,
        nombre: "Tránsito regional",
        estadoActual: "Viajando en ruta regional",
        observacion: "El envío es despachado a un destino aledaño o al municipio de la misma RACOL.",
        mostrarObservacion: false
    },
    5: {
        id: 5,
        nombre: "Reclame en oficina",
        estadoActual: "Para Reclamar en Oficina",
        observacion: "El envío se encuentra listo para ser reclamado en un punto de venta autorizado.",
        mostrarObservacion: true
    },
    6: {
        id: 6,
        nombre: "Reparto",
        estadoActual: "En distribución urbana",
        observacion: "El envío se encuentra en estado de reparto dentro de la zona asignada.",
        mostrarObservacion: false
    },
    7: {
        id: 7,
        nombre: "Intento de entrega",
        estadoActual: "En Procesode Devolución",
        observacion: "Cuando el intento de entrega es fallido, y el envío se encuentra en retorno a centro logístico.",
        mostrarObservacion: false
    },
    8: {
        id: 8,
        nombre: "Telemercadeo",
        estadoActual: "En confirmación telefónica",
        observacion: "El envío se encuentra en telemercadeo para confirmación de información.",
        mostrarObservacion: true
    },
    9: {
        id: 9,
        nombre: "Custodia",
        estadoActual: "En bodega final/custodia",
        observacion: "Envíos se encuentra en bodega de custodia en estado de espera de reclamación o confirmación de datos.",
        mostrarObservacion: true
    },
    10: {
        id: 10,
        nombre: "Devolución ratificada",
        estadoActual: "Devuelto al remitente",
        observacion: "La entrega no es efectiva y el envío se encuentra en trayecto de devolución a su origen.",
        mostrarObservacion: true
    },
    11: {
        id: 11,
        nombre: "Entregada",
        estadoActual: "Entrega exitosa",
        observacion: "El envío es entregado.",
        mostrarObservacion: false
    },
    12: {
        id: 12,
        nombre: "Reenvio",
        estadoActual: "Para nuevo intento de entrega",
        observacion: "El envío es enviado nuevamente a distribución por intento fallido.",
        mostrarObservacion: true
    },
    13: {
        id: 13,
        nombre: "Digitalizada",
        estadoActual: "Prueba de Entrega",
        observacion: "Indica que el soporte de la entrega se encuentra habilitado en el sistema.",
        mostrarObservacion: false
    },
    14: {
        id: 14,
        nombre: "Indemnización",
        estadoActual: "En investigación",
        observacion: "El envío presenta un siniestro y se escala a nivel de investigación operacional.",
        mostrarObservacion: false
    },
    15: {
        id: 15,
        nombre: "Anulada",
        estadoActual: "Documento anulado",
        observacion: "La guía generada es anulada del sistema.",
        mostrarObservacion: true
    },
    16: {
        id: 16,
        nombre: "Archivada",
        estadoActual: "Prueba de Entrega Archivada",
        observacion: "La prueba de entrega está dentro del archivo central de operaciones como expediente de consulta.",
        mostrarObservacion: false
    },
    17: {
        id: 17,
        nombre: "Disposición final",
        estadoActual: "Disposición final",
        observacion: "El estado del envío que después de un tiempo no es reclamado por remitente y destinatario y procede a proceso de destrucción o donación.",
        mostrarObservacion: false
    },
    18: {
        id: 18,
        nombre: "Transito Urbano",
        estadoActual: "Despachado para bodega",
        observacion: "El envío se encuentra despachado del centro logístico al punto de venta solicitado.",
        mostrarObservacion: false
    },
    21: {
        id: 21,
        nombre: "Incautado",
        estadoActual: "Incautado por autoridades",
        observacion: "El envío ha sido retenido por las autoridades y se encuentra en proceso de inspección.",
        mostrarObservacion: false
    },
    22: {
        id: 22,
        nombre: "Pend Ing Custodia",
        estadoActual: "Para bodega final/custodia",
        observacion: "El envío que no se puede entregar en diferentes intentos de entrega o es rehusado por el destinatario debe pasar al área de custodia para su disposición.",
        mostrarObservacion: false
    },
    23: {
        id: 23,
        nombre: "Físico Faltante",
        estadoActual: "No Llegó el Envío Físico",
        observacion: "Estado del envío que impone el cliente corporativo cuando existe una discrepancia entre las guías generadas y el envío físico.",
        mostrarObservacion: false
    },
    24: {
        id: 24,
        nombre: "Caso Fortuito",
        estadoActual: "Caso fortuito",
        observacion: "Evento imprevisto que por su naturaleza no se puede resistir y puede generar avería parcial o total del envío.",
        mostrarObservacion: false
    },
    25: {
        id: 25,
        nombre: "Facturado",
        estadoActual: "Facturado",
        observacion: "El Estado aplica para aquellos envíos que, sin gestión de origen o destino pasado el corte de facturación es incluido dentro de la liquidación.",
        mostrarObservacion: false
    },
    26: {
        id: 26,
        nombre: "Nota crédito",
        estadoActual: "Nota crédito",
        observacion: "Estado que genera el proceso de control de cuentas cuando se debe realizar una reposición financiera al cliente por una desviación en la liquidación de su factura.",
        mostrarObservacion: false
    },
    29: {
        id: 29,
        nombre: "Auditoría",
        estadoActual: "En Auditoria en Terreno",
        observacion: "Estado que indica que el envío está asignado a un auditor en terreno que verifica la información errada por la cual no se entregó.",
        mostrarObservacion: false
    },
    30: {
        id: 30,
        nombre: "Devolución en espera confirmación cliente",
        estadoActual: "Devolución por Confirmación del Cliente",
        observacion: "Estado que indica que el cliente de origen confirma por telemercadeo que se debe hacer efectiva la devolución del envío.",
        mostrarObservacion: false
    },
    31: {
        id: 31,
        nombre: "Distribución",
        estadoActual: "En distribución urbana agencia",
        observacion: "El envío se encuentra asignado para reparto en municipio o ciudad aledaña.",
        mostrarObservacion: false
    },
    32: {
        id: 32,
        nombre: "Devolución Regional",
        estadoActual: "Para devolver al Remitente",
        observacion: "Estado del envío cuando se encuentra en centro logístico de destino y será próximo a despachar a origen.",
        mostrarObservacion: false
    },
    34: {
        id: 34,
        nombre: "PreAnulado",
        estadoActual: "Preanulado",
        observacion: "El envío se encuentra notificado por el punto o cliente para ser anulado, y se encuentra en espera de la autorización del estado definitivo de anulación.",
        mostrarObservacion: false
    },
    35: {
        id: 35,
        nombre: "En Inspección",
        estadoActual: "En inspección",
        observacion: "Envío en revisión por parte de las autoridades que por sospecha en su contenido no se puede movilizar.",
        mostrarObservacion: false
    },
    39: {
        id: 39,
        nombre: "Recertificar",
        estadoActual: "Recertificar",
        observacion: "La prueba de entrega no cargó bien en sistema y se encuentra en proceso de nuevo cargue del comprobante.",
        mostrarObservacion: false
    },
    40: {
        id: 40,
        nombre: "Envio Trocado",
        estadoActual: "Envío trocado",
        observacion: "El envío no corresponde al destino relacionado.",
        mostrarObservacion: false
    }
}


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

/** Función encargada de retornar lo que Heka considera como último estado de transportadora, para validar si se puede pagar o no, ignorando así estados que no sean relevantes como último estado
 * @param {*} movimientos - La lista de estados que obtiene la transportadora
 * @returns El último estado, procurando ignorar siempre los estados: "Archivada" y "Digitalizada" (16 y 13 respectivamente)
 */
function obtenerUltimoEstado(movimientos) {
    let ultimoEstado;
    let i = 1;
    
    do {
        ultimoEstado = movimientos[movimientos.length - i];
        i++;
    }
    while(ultimoEstado && [16, 13].includes(ultimoEstado.idEstadoGuia)); // Estos estado corresponden a "Archivada" y "Digitalizada", por lo que no serían tomados en cuenta internamente

    return ultimoEstado;
}

async function actualizarMovimientoIndividual(doc, respuesta) {
    try {
        const guia = doc.data();
        const estadosGuia = respuesta.estadosGuia ?? [];
        const estadosPreenvio = respuesta.estadosPreenvio ?? [];

        let entrega_oficina_notificada = guia.entrega_oficina_notificada || false;

        // Se utiliza el diccionario de estados provisto por interrapidísimo
        estadosGuia.forEach(est => {
            const estadoLogistico = estadosLogisticos[est.idEstadoGuia];
            est.estadoActual = estadoLogistico ? estadoLogistico.estadoActual : est.nombreEstado;
            est.novedad = ""; // Naturalmente no es un estado con novedad
            est.observacion = est.nombreEstado;

            const mostrarObservacionEstado = estadoLogistico && estadoLogistico.mostrarObservacion;
            
            if(mostrarObservacionEstado) {
                est.observacion += " - " + estadoLogistico.observacion
            }

            if(est.estadoActual === "Para Reclamar en Oficina" && !entrega_oficina_notificada) {
                extsFunc.notificarEntregaEnOficina(guia);
                entrega_oficina_notificada = true;
            }

            // Desde aquí es que se detecta la novedad particular de la transportadora
            if([26, 39, 40, 7, 32, 10, 30, 33].includes(est.idEstadoGuia)) {
                est.novedad = mostrarObservacionEstado 
                    ? estadoLogistico.observacion
                    : estadoLogistico.estadoActual;
            }

        });

        const movimientos = estadosPreenvio.concat(estadosGuia);
        let finalizar_seguimiento = guia.prueba ? true : false;

        const gTime = (fecha) => new Date(fecha).getTime();
        
        movimientos
        .sort((a,b) => {
            return gTime(a.fechaEstado) - gTime(b.fechaEstado);
        })
        .map(est => {
            est.fechaEstadoOriginal = est.fechaEstado;
            est.fechaEstado = extsFunc.estandarizarFecha(new Date(est.fechaEstado), "DD/MM/YYYY HH:mm");
            
            return est;
        });

        const primerEstado = movimientos[0];
        const ultimoEstado = obtenerUltimoEstado(movimientos);
    
        const estadoActual = ultimoEstado.estadoActual ?? ultimoEstado.nombreEstado;
    
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