const fetch = require("node-fetch");
const MaquetadorXML = require("../extends/maquetadorXML");
const credentials = require("../keys/coordinadora");
const xml2js = require("xml2js");
const {DOMParser} = require("xmldom");
const { transformarDatosDestinatario, segmentarString } = require("../extends/funciones");

function normalizarValoresNumericos(valores) {
    const ks = Object.keys(valores);
    const expInt = /^-?\d+$/;
    const expDbl = /^-?\d+(\.\d+)?$/;

    ks.forEach(k => {
        if(expInt.test(valores[k])) valores[k] = parseInt(valores[k]);
        if(expDbl.test(valores[k])) valores[k] = parseFloat(valores[k]);
    });

    return valores
}

exports.cotizar = async (req, res) => {
    const {type} = req.params;
    const body = req.body;
    console.log("CREDENCIALES => ", credentials);
    const maquetador = new MaquetadorXML("./estructura/cotizar.cord.xml");

    const {v15, nit, div} = credentials;
    const peticion = Object.assign({
        nit: nit,
        div: div,
        apikey: v15.apikey,
        clave: v15.clave,
        unidades: 1,
        ubl: 0,
        cuenta: 2 // Codigo de la cuenta, 1 = Cuenta Corriente, 2 = Acuerdo semanal, 3 = Flete Pago
    }, body)

    const itemXml = maquetador.maqueta("ITEMS").fill(peticion);

    peticion.items = itemXml;

    const structure = maquetador.maqueta("COTIZADOR").fill(peticion);


    try {
        const response = await fetch(v15.endpoint, {
            method: "POST",
            Headers: {"Content-Type": "text/xml"},
            body: structure
        })
        .then(d => {
            console.log("status => ", d.status);
            // if(d.status >= 400) return {respuesta: "Error de servidor"}
            return d.text();
        })
        .catch(e => {
            console.log(e.message);
        })
    
        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resCotizar = xmlResponse.documentElement.getElementsByTagName("Cotizador_cotizarResult");
        
        let responseJson = await xml2js.parseStringPromise(resCotizar, {
            explicitArray: false,
            ignoreAttrs: true
        });

        if(responseJson) {
            responseJson = normalizarValoresNumericos(responseJson.Cotizador_cotizarResult);
        }
    
        console.log(response);
    
        res.send(responseJson || {
            error: true,
            message: "Problemas de comunicación"
        });
    } catch (e){
        res.send({
            error: true,
            message: e.message
        })
    }
}

exports.crearGuia = async (req, res) => {
    const guia = req.body;
    const maquetador = new MaquetadorXML("./estructura/crearGuia.cord.xml");
    const datos_destinatario = transformarDatosDestinatario(guia);

    const esConvencional = guia.type === "CONVENCIONAL";
    if(esConvencional) {
        guia.referencia = undefined;
        guia.valor = undefined;
    } else {
        guia.forma_pago = 1;
    }

    const {v16, nit, div} = credentials;
    const peticion = Object.assign({
        nit: nit,
        div: div,
        usuario: v16.usuario,
        clave: v16.clave,
        id_cliente: v16.id_cliente,
        codigo_cuenta: 2 // Codigo de la cuenta, 1 = Cuenta Corriente, 2 = Acuerdo semanal (siempre), 3 = Flete Pago
    }, guia, datos_destinatario);

    const structure = maquetador
    .maqueta("CREADOR")
    .fill(peticion);

    console.log(structure);
    try {
        const response = await fetch(v16.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml"
            },
            body: structure
        })
        .then(d => d.text());

        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resCrearGuia = xmlResponse.documentElement.getElementsByTagName("return");
        const resError = xmlResponse.documentElement.getElementsByTagName("faultstring");
        
        const conv = async xml => await xml2js.parseStringPromise(xml, {
            explicitArray: false,
            ignoreAttrs: true
        });

        let responseJson = await conv(resCrearGuia);
    
        if(responseJson) {
            responseJson = responseJson.return;
            const base64 = responseJson.pdf_guia;
            // if(!base64.startsWith("JVBERi0xLjQKJ")) return res.json([]);

            const base64Segmented = segmentarString(base64, 500000);
            responseJson.base64GuiaSegmentada = base64Segmented;
        } else {
            responseJson = await conv(resError);
            if(responseJson) {
                responseJson.error = true;
                responseJson.message = responseJson.faultstring;
            }
        }
    
        console.log(response, responseJson);
    
        res.send(responseJson || {
            error: true,
            message: "Problemas de comunicación"
        });

    } catch (e) {
        res.send({
            error: true,
            message: e.message
        })
    }


}

exports.crearStickerGuia = async (req, res) => {
    const guia = req.body;
    const maquetador = new MaquetadorXML("./estructura/crearSticker.coord.xml");

    const {v16} = credentials;
    const peticion = Object.assign({
        usuario: v16.usuario,
        clave: v16.clave,
    }, guia);

    const structure = maquetador.fill(peticion);

    try {
        const response = await fetch(v16.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml"
            },
            body: structure
        })
        .then(d => d.text());

        const valorRetorno = "return";
        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resCrearSticker = xmlResponse.documentElement.getElementsByTagName(valorRetorno);
        const resError = xmlResponse.documentElement.getElementsByTagName("faultstring");
        
        const conv = async xml => await xml2js.parseStringPromise(xml, {
            explicitArray: false,
            ignoreAttrs: true
        });

        let responseJson = await conv(resCrearSticker);
    
        if(responseJson) {
            responseJson = responseJson[valorRetorno];
            const base64 = responseJson.pdf;
            // if(!base64.startsWith("JVBERi0xLjQKJ")) return res.json([]);

            const base64Segmented = segmentarString(base64, 500000);
            responseJson.base64GuiaSegmentada = base64Segmented;
        } else {
            responseJson = await conv(resError);
            if(responseJson) {
                responseJson.error = true;
                responseJson.message = responseJson.faultstring;
            }
        }
    
        console.log(response, responseJson);
    
        res.send(responseJson || {
            error: true,
            message: "Problemas de comunicación"
        });

    } catch (e) {
        res.send({
            error: true,
            message: e.message
        })
    }
}