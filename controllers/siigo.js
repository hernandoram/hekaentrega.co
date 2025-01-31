const fetch = require("node-fetch");
const { estandarizarFecha } = require("../extends/funciones");

const firebase = require("../keys/firebase");
const db = firebase.firestore();

const Cr = require("../keys/siigo");

const auth = async (req, res, next) => {
    const {username, access_key} = Cr;
    
    const respuesta = await fetch(Cr.endpoint + "/auth", {
        method: "POST",
        "headers": {
            "content-type": "application/json"
        },
        "body": JSON.stringify({username, access_key})
    }).then(d => d.json());

    req.access_token = respuesta.access_token;

    next();
}


const crearFactura = async (req, res) => {
    const path = "/v1/invoices";

    const { comision_heka, numero_documento, costo_transportadora } = req.body;

    // Redondeamos la comisión para que el cálculo sea valorado correctamente por siigo
    // const iva_comision_heka = Number((comision_heka * 0.19 / 1.19).toFixed(2));

    // Por defecto siempre se factura la comisión Heka
    const items = [
        {
          code: "001", // siempre 001 Que corresponde al producto equivalente a la comisión Heka
          description: "Servicios Complementarios al Transporte", // contante
          quantity: 1,// contante
          price: comision_heka, // comision_heka
          discount: 0, // constante,
        //   taxes: [{ // Este repreentará el IVA que se saca en Heka
        //     id: 28952 // id del impuesto /taxes (IVA EN SERVICIOS 19%)
        //   }]
        }
    ];

    console.log(items);

    let valorPago = comision_heka;

    if(costo_transportadora) {
        valorPago += costo_transportadora;
        items.push({
            code: "006", // siempre 006 Corresponderá al producto relacionado con los costos de transportadora
            description: "Ingresos Recibidos Para Terceros", // contante
            quantity: 1,// contante
            price: costo_transportadora, // costo_transportadora
            discount: 0, // constante
            taxes: [{ // Este repreentará el IVA que se saca en Heka
                id: 14254 // id del impuesto /taxes (IVA 0%)
            }]
        });
    }

    console.log(valorPago);
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
        mail: {
            send: true
        },
        observations: "Observaciones",
        items,
        payments: [
          {
            id: Cr.id_tipo_pago, // id tipo de pago /payment-types (tarjeta debito)
            value: valorPago, // la suma de todas las comisiones
            due_date: estandarizarFecha(fecha, "YYYY-MM-DD") // Fecha del pago
          }
        ],
        // retentions: [{id: Cr.idAutoRetencion}] // reviso en /taxes el de autoretención (pero por ahora queda quemado)
    }

    const respuesta = await fetch(Cr.endpoint + path, {
        method: "POST",
        "headers": {
            "content-type": "application/json",
            Authorization: token,
            "Partner-Id": Cr.partnerId
        },
        "body": JSON.stringify(data)
    }).then(d => d.json())


    await db.collection("seguimientoSiigo")
    .add({data, respuesta, fecha, numero_documento});

    res.send(respuesta);
}

const commonGet = async (path, token) => {
    console.log(Cr.endpoint + path);
    const respuesta = await fetch(Cr.endpoint + path, {
        method: "GET",
        "headers": {
            "Content-Type": "Application/json",
            Authorization: token,
            "Partner-Id": Cr.partnerId
        }
    })
    .then(d => {
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

const clientes = async (req, res) => {
    const path = "/v1/customers";

    const token = req.access_token;

    const respuesta = await commonGet(path, token);

    res.send(respuesta);
}

const verFactura = async (req, res) => {
    const path = "/v1/invoices" 
    +"/"+ req.params.idFactura;

    const token = req.access_token;
    console.log(token);

    const respuesta = await commonGet(path, token);

    res.send(respuesta);
}

const buscarfacturaPorNombre = async (req, res) => {
    console.log(req.body)
    const {created_start, name} = req.body;
    const path = "/v1/invoices" 
    // const queryParams = `?created_start=${created_start}&name=${name}`;
    const queryParams = `?created_start=${created_start}&name=${name}`;
    

    const token = req.access_token;

    const respuesta = await commonGet(path+queryParams, token);

    if(respuesta.Status === 400) {
        const erroresCompacto = respuesta.Errors.map(e => e.Message).join("\n");
        return res.status(400).send({
            error: true,
            message: erroresCompacto
        })
    }

    if(!respuesta.results) {
        return res.status(409).send(respuesta);
    }

    if(!respuesta.results.length) {
        return res.status(417).send({
            error: true,
            message: "El nombre ingresado no se encuentra en la lista de facturas de siigo."
        });
    }

    res.send(respuesta.results[0]); // Mandamos solo la primera información
}


module.exports = { auth, crearFactura, tipoDocumentos, usuarios, tiposPago, pdfFacturaVenta, impuestos, clientes, verFactura, buscarfacturaPorNombre }