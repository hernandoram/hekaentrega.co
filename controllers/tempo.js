const firebase = require("../keys/firebase");
const db = firebase.firestore();

exports.cotizar = async (req, res) => {
    const {dane_ciudadR, dane_ciudadD, peso,
    alto, largo, ancho, recaudo, valorDeclarado} = req.query;
    const id = dane_ciudadR + dane_ciudadD;
    const type = req.params.type;
    const contraentrega = type !== "CONVENCIONAL";
    console.log(type);

    try {
        const ciudad = await db.collection("ciudadesTempoExpress")
        .doc(id).get();
    
        if(ciudad.exists) {
            const data = ciudad.data();
            const flete = data["tarifa"+Math.round(peso)];
            const iva = (n) => n * 0.19
            const pesoVol = (alto * largo * ancho) * 0.000222 || 0;
            const porcentaje_seguro = data.porcentaje_seguro || 0.02;
            const seguro_minimo = data.seguro_minimo || 362;

            if(peso > 5) throw new Error("El peso es mayor a cinco");
            const respuesta = {
                ok: true,
                flete: flete,
                seguro_mercancia: Math.max(valorDeclarado * porcentaje_seguro, seguro_minimo),
                sobreflete: contraentrega ? 
                    Math.max(data.minimo_recaudo, recaudo * data.porcentaje_recaudo) :
                    0,
                pesoVolumen: pesoVol,
                pesoKg: peso,
                peso: Math.max(peso, pesoVol),
                ciudadD: data.ciudadD,
                ciudadR: data.ciudadR,
                direccion_oficina: data.direccion_oficina,
                servicio_recogida: data.servicio_recogida,
                tiempoEntrega: data.tiempoEntrega,
                servicio_recaudo: data.tiene_servicion_recaudo
            }

            res.json(respuesta);
        } else {
            res.status(404).json({
                ok: false,
                message: "No hay cobertura"
            })
        }
    } catch (e) {
        res.status(500).json({
            ok: false,
            message: e.message
        })
    }
}