const request = require("request");

const urlPrueba = "http://stgwww3.interrapidisimo.com/ApiVentaCreditoStg/api/Admision/InsertarAdmision/";
const usuario_prueba = "userHernandoStg";
const token = "Bearer jmulmNkpR_dKYIv_pnuUMh-mOeXMW-wjyXe1iISalHlrlBQJhkCWHzdoYfmedHqv2I66dYminzaWCtkTL-0GCSHoeOZDANwsgQWylFRm5FtAaz7PhzVdJaQ9wrDmYc3h92O5KumsguBx-REgQkQcFD0xtVptWpSI8FaW4gjn4iE7kSwK5m_9KoS_gV2G-crJ9Hp3Cv6mCdfUywH2my2ARKVzWbhlob_QKNiC285efws-S68d4_gZ-fEbFdqmpTjb";

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

    request.post(urlPrueba, {
        headers: {
            "x-app-signature": usuario_prueba,
            "x-app-security_token": token,
            "Content-type": "application/json"
        },
        body: JSON.stringify(data)
    }, (error, response, body) => {
        if(error) res.send(error);

        res.json(body);
    })
}