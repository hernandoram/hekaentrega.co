const fetch = require("node-fetch");
const { estandarizarFecha } = require("../extends/funciones");

const Cr = require("../keys/siigo");

const auth = async (req, res, next) => {
    const {username, access_key} = Cr;
    
    const respuesta = await fetch(Cr.endpoint + "/auth", {
        method: "POST",
        "headers": {
            "content-type": "application/json"
        },
        "body": JSON.stringify({username, access_key})
    }).then(d => d.json())

    req.access_token = respuesta.access_token;

    next();
}


const crearFactura = async (req, res) => {
    const path = "/v1/invoices";

    const { comision_heka, numero_documento } = req.body;

    const token = req.access_token;

    const fecha = new Date();

    const data = {
        document: {
          id: Cr.document_id // se supone constante /document-types
        },
        date: estandarizarFecha(fecha, "YYYY-MM-DD"), // fecha del pago aaaa-mm-dd
        customer: {
          identification: numero_documento, // identificación del usuario
          branch_office: 0 // siempre cero
        },
        seller: Cr.id_vendedor, // id del vendedor (hram) /users
        observations: "Observaciones",
        items: [
          {
            code: "001", // siempre 001
            description: "Servicios Complementarios al Transporte", // contante
            quantity: 1,// contante
            price: comision_heka, // comision_heka
            discount: 0 // constante
          }
        ],
        payments: [
          {
            id: Cr.id_tipo_pago, // id tipo de pago /payment-types (tarjeta debito)
            value: comision_heka, // comision_heka
            due_date: estandarizarFecha(fecha, "YYYY-MM-DD") // Fecha del pago
          }
        ],
        retentions: [{id: Cr.idAutoRetencion}] // reviso en /taxes el de autoretención (pero por ahora queda quemado)
    }

    console.log(data);

    const respuesta = await fetch(Cr.endpoint + path, {
        method: "POST",
        "headers": {
            "content-type": "application/json",
            Authorization: token,
            "Partner-Id": Cr.partnerId
        },
        "body": JSON.stringify(data)
    }).then(d => d.json())

    res.send(respuesta);
}

const commonGet = async (path, token) => {
    console.log(Cr.endpoint + path);
    const respuesta = await fetch(Cr.endpoint + path, {
        method: "GET",
        "headers": {
            "Content-Type": "Application/json",
            Authorization: token
        }
    })
    .then(d => {
        console.log(d);
        return d.json()
    })
    .catch(d => {
        console.log(d);
        return {error: true, message: "Problemas al consultar"}
    })

    return respuesta;
}

const pdfFacturaVenta = async (req, res) => {
    const path = `/v1/invoices/${req.params.id_factura}/pdf`;
    
    const token = req.access_token;
    
    const respuesta = await commonGet(path, token);
    
    res.send(respuesta);
} 

const tipoDocumentos = async (req, res) => {
    const path = "/v1/document-types?type=FV";

    const token = req.access_token;

    const respuesta = await commonGet(path, token);

    res.send(respuesta);
}

const usuarios = async (req, res) => {
    const path = "/v1/users";

    const token = req.access_token;

    const respuesta = await commonGet(path, token);

    res.send(respuesta);
}

const tiposPago = async (req, res) => {
    const path = "/v1/payment-types?document_type=FV";

    const token = req.access_token;

    const respuesta = await commonGet(path, token);

    res.send(respuesta);
}

const impuestos = async (req, res) => {
    const path = "/v1/taxes";

    const token = req.access_token;

    const respuesta = await commonGet(path, token);

    res.send(respuesta);
}

module.exports = { auth, crearFactura, tipoDocumentos, usuarios, tiposPago, pdfFacturaVenta, impuestos }