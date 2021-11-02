const rq = require("request-promise");
const Cr = require("../keys/aveo");

// console.log(Cr);

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
    let idasumecosto = 1, contraentrega = 0
    
    if(req.params.type === "CONVENCIONAL") {
        idasumecosto = 0
        req.params.recaudo = 0;
    } else if (req.params.type === "SUMAR ENVIO") {
        contraentrega = 1;
    }

    try {
        const cotizacion = await rq.post(Cr.endpoint + "/nal/v1.0/generarGuiaTransporteNacional.php", {
            headers: {"Content-type": "Application/json"},
            body: JSON.stringify({
                "tipo":"cotizar",
                "token": req.params.token,
                "idempresa": Cr.idEmpresa,
                "unidades": 1,
                idasumecosto, contraentrega,
                "origen": req.params.origen,
                "destino": req.params.destino,
                "kilos": req.params.peso,
                "valorrecaudo": req.params.recaudo,
                "valordeclarado": req.params.valorDeclarado,
            })
        }).then(res => JSON.parse(res));
        res.json(cotizacion)
    } catch {
        res.json({status:"error", message:"Cotizaciones no encontradas.", cotizaciones:[]})
    }

    // console.log(res);
}