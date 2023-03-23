const fetch = require("node-fetch");
const MaquetadorXML = require("../extends/maquetadorXML");
const credentials = require("../keys/coordinadora");
const xml2js = require("xml2js");
const {DOMParser} = require("xmldom");

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
        cuenta: type === "CONVENCIONAL" ? 1 : 3 // Codigo de la cuenta, 1 = Cuenta Corriente, 2 = Acuerdo semanal, 3 = Flete Pago
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
    const {v16, nit, div} = credentials;
    const peticion = Object.assign({
        nit: nit,
        div: div,
        usuario: v16.usuario,
        clave: v16.clave
    }, {
        dane_ciudadR: 76001000,
        dane_cuidadD: 76001000,
        seguro: 80000,
        alto: 10,
        ancho: 15,
        largo: 16,
        peso: 1,
        unidades: 1,
        ubl: 0
    },
    body);

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
    
        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const resCotizar = xmlResponse.documentElement.getElementsByTagName("Cotizador_cotizarResult");
        
        let responseJson = await xml2js.parseStringPromise(resCotizar, {
            explicitArray: false,
            ignoreAttrs: true
        });
    
        if(responseJson) {
            responseJson = responseJson.Cotizador_cotizarResult;
        }
    
        console.log(response);
    
        res.send(responseJson || {
            error: true,
            message: "Problemas de comunicación"
        });
    
        console.log(response);
    
        res.send(response);
    } catch (e) {
        res.send({
            error: true,
            message: e.message
        })
    }


}