const { transformarDatosDestinatario, segmentarString, estandarizarFecha } = require("../extends/funciones");
const { estadosFinalizacion, modificarEstadoGuia, actualizarReferidoPorGuiaEntregada, obtenerGuiaPorNumero, obtenerEstadosGuiaPorId, crearOActualizarEstados, actualizarInfoGuia, atributosAdicionalesEnActualizacion } = require("../extends/manejadorMovimientosGuia");
const fetch = require("node-fetch");

const firebase = require("../keys/firebase");
const db = firebase.firestore();

const apiEndPoint = "https://admin.hekaentrega.co/Api";
// const apiEndPoint = "http://localhost:6201/Api";

let ciudades = [];
exports.consultarCiudades = async (req, res) => {
    const parametro = req.query.search;

    if(!ciudades.length) await bringCiudades();

    if(parametro === "all") return res.send(ciudades.filter(c => !c.desactivada));

    const ciudadesFiltradas = ciudades.filter(c => 
        !c.desactivada 
        && new RegExp("^"+parametro.toUpperCase()).test(c.nombre.toUpperCase())
    );

    res.send(ciudadesFiltradas);
}

if(!process.env.DEVELOPMENT) {
    bringCiudades();
}

async function bringCiudades() {
    console.log("CONSULTANDO CIUDADES");
    const initial = new Date().getTime();

    ciudades = await db.collection("ciudades")
    .get().then(q => q.docs.map(d => d.data()));

    const final = new Date().getTime();

    console.log("TIEMPO DE CONSULTA => ", (final - initial) / 1000);

    return ciudades;
}

exports.estadosFinalizacion = (req, res) => {
    res.json(estadosFinalizacion);
}


exports.crearGuia = async (req, res) => {
    const guia = req.body;
    console.log(guia);
    const datos_destinatario = transformarDatosDestinatario(guia);

    const esConvencional = datos_destinatario.type === "CONVENCIONAL";
    
    // El valor de producto pasa a ser cero cuando la guía no es de pago contraentrega
    const valorProducto = esConvencional ? 0 : guia.valor;
   
    let tipoDocument = null;
    switch(parseInt(datos_destinatario.tipo_documento)) {
        case 1:
            tipoDocument = "NIT";
            break;
        case 2:
            tipoDocument = "CC";
            break;
        default:
            tipoDocument = null;
            break;
    }


    const data = {
        idDaneCiudadOrigen: guia.dane_ciudadR,
        idDaneCiudadDestino: guia.dane_ciudadD,
        tipo: datos_destinatario.type,
        dice_contener: guia.dice_contener,
        centro_de_costo: guia.centro_de_costo,
        id_user: guia.id_user ?? null,
        observaciones: guia.observaciones,
        valorSeguro: guia.seguro,
        valorRecaudo: valorProducto,
        largo: parseInt(guia.largo),
        ancho: parseInt(guia.ancho),
        alto: parseInt(guia.alto),
        peso: parseInt(guia.peso),
        info_origen: {
          nombre_completo: guia.nombreR,
          direccion: guia.direccionR,
          celular: parseInt(guia.celularR),
          numero_identificacion: "",
          tipo_identificacion: null
        },
        info_destino: {
          nombre_completo: datos_destinatario.nombre,
          direccion: datos_destinatario.direccion,
          celular: parseInt(datos_destinatario.celular),
          numero_identificacion: datos_destinatario.numero_documento.toString(),
          tipo_identificacion: tipoDocument
        }
    }

    try {
        const response = await fetch(apiEndPoint + "/Envios/Nuevo", {
            method: "POST",
            headers: {
                "Content-type": "Application/json"
            },
            body: JSON.stringify(data)
        })
        .then(d => d.json());
    
        console.log(response);
    
        res.send(response);
    } catch(e) {
        res.send({
            error: true,
            message: e.message
        })
    }

}

exports.obtenerStickerGuia = async (req, res) => {
    const { numeroGuia } = req.body;

    try {
        const response = await fetch(apiEndPoint + "/Pdf/Envio/" + numeroGuia)
        .then(d => d.json());
    
        if(response.error) {
            return res.json({
                error: true,
                message: response.body
            });
        }
    
        const base64Segmented = segmentarString(response.body, 500000);
        res.json({ base64GuiaSegmentada: base64Segmented });
    } catch (e) {
        res.json({
            error: true,
            message: e.message
        });
    }
}

exports.actualizarMovimientos = async (req, res) => {
    const { numeroGuia } = req.params;
    const nuevoEstado = req.body;

    try {
        const infoGuia = await obtenerGuiaPorNumero(numeroGuia);
        if(!infoGuia) return res.send({
            error: true,
            message: "No se encuentra la guía para la actualización de los estados."
        });
    
        const {id_user, id_heka} = infoGuia;
    
        const infoEstados = await obtenerEstadosGuiaPorId(id_user, id_heka);
    
        const movimiento = {
          novedad: nuevoEstado.esNovedad ? nuevoEstado.descripcion : "",
          fechaMov: nuevoEstado.fechaNatural,
          observacion: nuevoEstado.observaciones,
          descripcionMov: nuevoEstado.descripcion,
          ubicacion: nuevoEstado.ubicacion,
          urlEvidencia: nuevoEstado.urlEvidencia ?? null,
          tipoMotivo: null
        }
        
        const estadoBase = {
            numeroGuia: numeroGuia, //guia devuelta por la transportadora
            fechaEnvio: estandarizarFecha(infoGuia.timeline, "MM/DD/YYYY HH:mm:ss"), 
            ciudadD: infoGuia.ciudadD,
            nombreD: infoGuia.nombreD,
            direccionD:  infoGuia.direccionD,
            estadoActual: nuevoEstado.estado,
            fecha: estandarizarFecha(new Date(), "MM/DD/YYYY HH:mm:ss"), //fecha del estado
            id_heka: id_heka,
            transportadora: "HEKA",
            centro_de_costo: infoGuia.centro_de_costo,
            daneOrigen: infoGuia.dane_ciudadR || "NA",
            daneDestino: infoGuia.dane_ciudadD || "NA",
            fechaUltimaActualizacion: new Date(),
            mostrar_usuario: nuevoEstado.esNovedad,
            enNovedad: nuevoEstado.esNovedad,
            movimientos: firebase.firestore.FieldValue.arrayUnion(movimiento),
            version: 2
        };
    
        if(infoEstados) {
            await crearOActualizarEstados(id_user, id_heka, estadoBase, true);
        } else {
            await crearOActualizarEstados(id_user, id_heka, estadoBase, false);
        }
    
        infoGuia.estadoTransportadora = estadoBase.estadoActual;
        infoGuia.enNovedad = nuevoEstado.esNovedad;
                
        // Función encargada de actualizar el estado, como va el seguimiento, entre cosas base importantes
        const actualizaciones = modificarEstadoGuia(infoGuia);
        
        // Esto pasa una serie de argumentos, que detecta que haya alguna información para actualizar
        // en caso de que los valores del segundo parametros sean falsos, undefined o null, no los toma en cuenta para actualizar
        atributosAdicionalesEnActualizacion(actualizaciones, {
            seguimiento_finalizado: true
        });

        await actualizarReferidoPorGuiaEntregada(infoGuia, actualizaciones);
        await actualizarInfoGuia(id_user, id_heka, actualizaciones);
    
        res.send({
            error: false,
            message: "Información actualizada correctamente"
        });
    
    } catch (e) {
        console.log("Entro en error: ", e.message);
        res.send({
            error: true,
            message: e.message
        });
    }
    
}