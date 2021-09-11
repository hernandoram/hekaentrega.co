const request = require("request");
const extsFunc = require("../extends/funciones");
const puppeteer = require("puppeteer");


const urlPrueba = "https://stgwww3.interrapidisimo.com/ApiVentaCreditoStg/api/Admision";
const usuario_prueba = "userHernandoStg";
const token = "Bearer bd50xQS4eKLa20KiR0fXEMwPjcZQIIze44u9NYaXWaTzHYly0cdwx6tdVT1fA-hbrXRP7gYrSOCgdEgtlP3dmZomBEzG-ONW9Mx0UXCVRd48sVQp45yuzmwwa5IxzAg5e0pqUK83e9MxODrFH9M1FZWI0kr7syv8d61tBP49u7AWZOnXlvJkud371yeH-lPk6kOY09CUyuED3P6P7ECIyPrCBP5cHXl-B-Q2RvjM5tVeC3vMvY-Y0yIb-uAQOFzR";

//FUNCIONES REGULARES
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

    const browser = await puppeteer.launch();
        const page = await browser.newPage();
        console.log("accediendo a la página");
        await page.goto(url);
    
        console.log("Escribiendo el numero de guia");
        await page.type("#tbxNumeroGuia", numeroGuia);
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

    
        console.log("Cerrando navegador")
        await browser.close();
       
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
}

const actualizarMovimientos = async function(doc) {
    console.log("consultando inter")
    const consulta = await scrapEstados(doc.data().numeroGuia);
    let updte_estados, updte_movs;
    try {
        const estados_finalizacion = ["Documento Anulado", "Entrega Exitosa", "Devuelto al Remitente"];
        const ultimo_estado = consulta.flujo[consulta.flujo.length - 1];
        const movimientos = {
            numeroGuia: doc.data().numeroGuia, //guia devuelta por la transportadora
            fechaEnvio: consulta.estado["Fecha Asignación"], 
            // ciudadD: consulta.estado.CiuDes[0],
            // nombreD: consulta.estado.NomDes[0],
            // direccionD: consulta.estado.DirDes[0],
            estadoActual: consulta.estado['Ultimo Estado'],
            fecha: ultimo_estado["Fecha Cambio Estado"], //fecha del estado
            id_heka: doc.id,
            transportadora: doc.data().transportadora,
            movimientos: consulta.flujo // movimientos registrados por la transportadora
        };

        updte_estados = await extsFunc.actualizarEstado(doc, {
            estado: consulta.estado['Ultimo Estado'],
            ultima_actualizacion: new Date(),
            seguimiento_finalizado: estados_finalizacion.some(v => consulta.estado["Gestion del Envio"] === v)
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

// FUNCIONES A EXPORTAR 
exports.crearGuia = (req, res) => {
    const guia = req.body;
    let data = {
        "IdClienteCredito":4276, //Codigo cliente
        "CodigoConvenioRemitente": 18836, //Codigo sucursal
        "IdTipoEntrega":"1",
        "AplicaContrapago": guia.type !== "CONVENCIONAL",
        "IdServicio":3, 
        "Peso": guia.peso, //En kilogramos
        "Largo":guia.largo, //En centimetros
        "Ancho":guia.ancho,
        "Alto":guia.alto, 
        "DiceContener": guia.dice_contener,
        "ValorDeclarado": guia.seguro,
        "IdTipoEnvio":1,
        "IdFormaPago":2,
        "NumeroPieza":1,
        "Destinatario":{
            "tipoDocumento": guia.tipo_doc_dest === 1 ? "NIT" : "CC",
            "numeroDocumento": guia.identificacionD,
            "nombre": guia.nombreD.split(" ")[0],
            "primerApellido":  guia.nombreD.split(" ")[1] ||  guia.nombreD.split(" ")[0], //Si se debe enviar si es un cliente persona natural, es obligatorio
            "segundoApellido":null,
            "telefono": guia.telefonoD,
            "direccion": guia.direccionD,
            "idDestinatario":0, "idRemitente":0, //Campos opcionales. Dejarlos en 0
            "idLocalidad": guia.dane_ciudadD, //Codigo DANE ciudad destinatario
            "CodigoConvenio":0, //Enviar valor 0 si no es cliente convenio
            "ConvenioDestinatario":0, //Enviar valor 0 si no es cliente convenio
            "correo": guia.correoD //Obligatorio si es cliente convenio
        },
        "DescripcionTipoEntrega":"",
        "NombreTipoEnvio":"CAJA",
        "CodigoConvenio":0, //Enviar valor 0 si no es cliente convenio
        "IdSucursal":0, //Enviar valor 0 si no es cliente convenio
        "IdCliente":0, //Enviar valor 0 si no es cliente convenio
        "Notificacion":null,
        "RapiRadicado":{
        }, //Enviar solo si el servicio es id 16 RapiRadicado
        "Observaciones": guia.id_heka
    }

    request.post(urlPrueba + "/InsertarAdmision", {
        headers: {
            "x-app-signature": usuario_prueba,
            "x-app-security_token": token,
            "Content-type": "application/json"
        },
        body: JSON.stringify(data)
    }, (error, response, body) => {
        if(error) res.send("Hubo un error => "+error);

        res.json(body);
    })
};

exports.crearStickerGuia = (req, res) => {
    request.get(urlPrueba + "/ObtenerBase64PdfPreGuia/" + req.params.id, {
        headers: {
            "x-app-signature": usuario_prueba,
            "x-app-security_token": token
        }
    }, (error, response, body) => {
        if(error) res.send("Hubo un error => "+error);

        let base64 = JSON.parse(body);
        
        let segmentar = parseInt(req.query.segmentar);
        if(segmentar) {
            const segementado = Math.min(segmentar, 1000000)
            res.json(extsFunc.segmentarString(base64, segementado))
        } else {
            res.send(base64);
        }
    })
};

exports.consultarGuia = async (req, res) => {   
    const respuesta = await scrapEstados(req.query.guia, req.query.type);
    
    res.json(respuesta);

}

exports.actualizarMovimientos = actualizarMovimientos;