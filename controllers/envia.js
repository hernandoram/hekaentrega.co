
const fetch = require("node-fetch");
const {usuarioPrueba} = require("../keys/envia");

exports.cotizar = async (req, res) => {
    const {type} = req.params;
    const response = await fetch(usuarioPrueba.endpoint + "/Liquidacion", {
        method: "POST",
        body: JSON.stringify({
            "ciudad_origen": "11001000",
            "ciudad_destino": "11001000",
            "cod_formapago": 4, // crédito = 4
            "cod_servicio": 12, // 3 (mercacía terrestre) si supera los 9 kilos, 12 (paquete terrestre) si el peso 1-8kg
            "cod_regional_cta": 1,
            "cod_oficina_cta": 1,
            "cod_cuenta": type === "CONVENCIONAL" ? usuarioPrueba.cod_cuenta : usuarioPrueba.cod_cuenta_rec,
            "info_cubicacion": [
                {
                    "cantidad": 1,
                    "largo": 10.0,
                    "ancho": 10.0,
                    "alto": 10.0,
                    "peso": 5,
                    "declarado": 10000
                }
            ],
            "mca_docinternacional": 0,
            "con_cartaporte": "0",
            "info_contenido": {
                "num_documentos": "12345-67890",
                "valorproducto": "0" // si aplica pago contraentrega, aquí va
            }
        })
    });

    const data = await response.json();
    console.log(data);

    res.send(data);
}