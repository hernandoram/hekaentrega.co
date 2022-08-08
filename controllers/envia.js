
const fetch = require("node-fetch");
const { urlToPdfBase64, segmentarString } = require("../extends/funciones");
const credentials = require("../keys/envia");

exports.cotizar = async (req, res) => {
    const {type} = req.params;
    const body = req.body;
    console.log("CREDENCIALES => ", credentials);

    const data = {
        "ciudad_origen": body.ciudad_origen,
        "ciudad_destino": body.ciudad_destino,
        "cod_formapago": 4, // crédito = 4, contraentrega = 7
        "cod_servicio": body.peso >= 9 ? 3 : 12, // 3 (mercacía terrestre) si supera los 9 kilos, 12 (paquete terrestre) si el peso 1-8kg
        "cod_regional_cta": 1,
        "cod_oficina_cta": 1,
        "cod_cuenta": type === "CONVENCIONAL" ? credentials.cod_cuenta : credentials.cod_cuenta_rec,
        "info_cubicacion": [
            {
                "cantidad": 1,
                "largo": body.largo,
                "ancho": body.ancho,
                "alto": body.alto,
                "peso": body.peso,
                "declarado": body.declarado
            }
        ],
        "mca_docinternacional": 0,
        "con_cartaporte": "0",
        "info_contenido": {
            // "num_documentos": "12345-67890",
            "valorproducto": type === "CONVENCIONAL" ? 0 : body.valorproducto // si aplica pago contraentrega, aquí va
        }
    }

    console.log(data);

    const response = await fetch(credentials.endpoint + "/Liquidacion", {
        method: "POST",
        headers: {
            "authorization": credentials.authentication
        },
        body: JSON.stringify(data)
    })
    .then(d => d.json());

    console.log(response);

    res.send(response);
}

exports.crearGuia = async (req, res) => {
    const guia = req.body;
    console.log(guia);
    
    const data = {
        "ciudad_origen": "1",
        "ciudad_destino": "1",
        "cod_formapago": 4,
        "cod_servicio": guia.peso > 9 ? 3 : 12,
        "info_cubicacion": [{
            "cantidad": 1,
            "largo": guia.largo,
            "ancho": guia.ancho,
            "alto": guia.alto,
            "peso": guia.peso,
            "declarado": guia.seguro
        }],
        "mca_nosabado": 1, //Indica si el sabado el destinatario podrá recibir el pedido
        "mca_docinternacional": 0, //Para exterior
        "cod_regional_cta": 1, 
        "cod_oficina_cta": 1,
        "cod_cuenta": guia.type === "CONVENCIONAL" ? credentials.cod_cuenta : credentials.cod_cuenta,
        "con_cartaporte": 0,
        "info_origen": {
            "nom_remitente": guia.nombreR,
            "dir_remitente": guia.direccionR,
            "tel_remitente": guia.celularR,
            "ced_remitente": 1072497419
        },
        "info_destino": {
            "nom_destinatario": guia.nombreD,
            "dir_destinatario": guia.direccionD,
            "tel_destinatario": guia.telefonoD,
            "ced_destinatario": guia.identificacionD
        },
        "info_contenido": {
            "dice_contener": guia.dice_contener,
            "texto_guia": "",
            "accion_notaguia": "",
            "num_documentos": "12345-67890",
            "centrocosto": ""
        },
        "numero_guia": "",
        "generar_os": "N" // Para solicitar recolección S/N => Si/No
    }

    const response = await fetch(credentials.endpoint + "/Generacion", {
        method: "POST",
        headers: {
            "authorization": credentials.authentication
        },
        body: JSON.stringify(data)
    })
    .then(d => d.json());

    console.log(response);

    res.send(response);

}

exports.obtenerStickerGuia = async (req, res) => {
    const {numeroGuia, url} = req.body;

    const rutaBase = `http://200.69.100.66/2impresionGuiaspruebas/Guia3.aspx?Usuario=${credentials.usuario}&Guia=${numeroGuia}`;

    const ruta = url ? url : rutaBase;
    const base64 = await urlToPdfBase64(ruta);

    if(!base64.includes("JVBERi0xLjQKJ")) return res.json([]);

    const base64Segmented = segmentarString(base64, 500000);
    res.json(base64Segmented);
}