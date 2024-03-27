const { creacionGuia } = require("../controllers/inter");
const firebase = require("../keys/firebase");
const { estandarizarFecha } = require("./funciones");
const db = firebase.firestore();

const estadosCola = {
    enEspera: "ENQUEUE",
    error: "ERROR",
    exito: "SUCCESS",
    pendiente: "UPDATING",
    cancelada: "CANCELLED"
}

const refStatusGeneracionGuia = db.collection("infoHeka").doc("generacionGuias");
const refColaCreacionGuias = db.collection("colaCreacionGuias");
const refColaSolicitudCola = refColaCreacionGuias
.where("status", "==", estadosCola.enEspera)
.orderBy("timestamp", "desc");

const MAX_INTENTOS = 10;
const MAX_TIEMPO_DETENIDO = 36e5; // Una hora en milisegundos

//#region Estado de las actualizaciones
async function estadoCreacion() {
    return refStatusGeneracionGuia
    .get()
    .then(d => d.data()); 
}

async function availableCreation() {
    const creation = await estadoCreacion();

    // Se analiza y se restable el vigilante de la actualización en caso de que haya durado mucho timepo detenido
    restablecerActualizardor(creation);

    return creation.open;
}

function restablecerActualizardor(actualizador) {
    // Revisamos si tiene mucho tiempo sin estar
    const now = Date.now();
    const demoraUltimaVez = now - actualizador.ultimaActualizacion.toMillis();
    const limiteDetenidoExcedido = demoraUltimaVez > MAX_TIEMPO_DETENIDO;
    if(!actualizador.open && limiteDetenidoExcedido) {
        guardarEstadoCreacion({open: true});
    }
}

async function guardarEstadoCreacion(obj) {
    return refStatusGeneracionGuia
    .update(obj);
}
//#endregion

//#region Procesamiento de cola
async function obtenerGuiasPendientesPorCrear() {
    return refColaSolicitudCola
    .get()
    .then(q => {
        const guides = [];
        q.forEach(d => {
            guides.push(d.data());
        });

        return guides;
    });
}

//#endregion

//#region Control Guias
async function getGuideToCreate(id_user, id_heka) {
    return db.collection("usuarios")
    .doc(id_user)
    .collection("guias")
    .doc(id_heka)
    .get()
    .then(d => d.data());
}

async function actualizarGuia(id_user, id_heka, obj) {
    const {numeroGuia, has_sticker} = obj;
    
    return db.collection("usuarios")
    .doc(id_user)
    .collection("guias")
    .doc(id_heka)
    .update({numeroGuia, has_sticker});
}
//#endregion

async function crearGuiaTransportadora(guide) {
    switch(guide.transportadora) {
        case "INTERRAPIDISIMO": 
        return creacionGuia(guide)

        default:
            return {
                error: true,
                message: "Transportadora aún no disponible para procesar creación por cola"
            }
    }
}

// esta función me toma un arreglo de strings, junto con la refenrecia de FB, y lo guarda en una collectio indexada
async function guardarDocumentoSegmentado(base64Segmentada, referencia) {
    console.log(base64Segmentada);
    if (typeof base64Segmentada !== "object") return false;
  
    if (!base64Segmentada.length) return false;
  
    let guardado = true;
    for (let i = 0; i < base64Segmentada.length; i++) {
      const res = await referencia
        .doc(i.toString())
        .set({
          index: i,
          segmento: base64Segmentada[i],
        })
        .then(() => {
          return true;
        })
        .catch((error) => {
          console.log(
            "hubo un error al guardar una parte del documento segmentado => ",
            error
          );
          guardado = false;
          return false;
        });
  
      if (!res) break;
    }
  
    return guardado;
}

async function intentarCrearGuiaEnCola(queue) {
    const fechaActualizacion = new Date();
    
    const {id_user, id_heka, intentos} = queue;

    // Se obtiene la guía completa del usuario a la que se hace referencia en la cola
    const guideToCreate = await getGuideToCreate(id_user, id_heka);

    // Se procede a la creación de la guía
    const responseCreation = await crearGuiaTransportadora(guideToCreate);

    // Se instancia la información que se va a actualizar sobre el estado global del actualizador
    const controlBase = {
        ultimaGuiaActualizada: id_heka,
        ultimaActualizacion: fechaActualizacion
    }

    // Se instancia la información que se va a actualizar sobre el estado particular de la guía que se está procesando
    const controlBaseGuia = {
        // Si exece la máxima cantidad de reintento, se cambia el estado para que esta cola no pueda ser consultada más adelante
        status: intentos >= MAX_INTENTOS - 1 ? estadosCola.error : estadosCola.enEspera,
        // Se incrementan los intentos que se están efectuando
        intentos: firebase.firestore.FieldValue.increment(1),
        intentosTotales: firebase.firestore.FieldValue.increment(1),
        ultimaActualizacion: fechaActualizacion,
    };

    if(responseCreation.error) {
        // guardar el último error en cola y el mensaje en la guía encolada

        // Actualizamos la ultima guía con error y la fecha sobre el control principal
        controlBase.ultimaGuiaConError = id_heka;
        controlBase.ultimoError = fechaActualizacion;

        // Y se almacena sobre la cola el mensaje de respuesta por parte de la creación
        controlBaseGuia.messages = firebase.firestore.FieldValue.arrayUnion({
            message: responseCreation.message,
            fecha: estandarizarFecha(fechaActualizacion, "DD-MM-YYYY HH:mm"),
            timeline: fechaActualizacion.getTime()
        });
    } else {
        // actualizar la guía, guardar última satisfactoria, y el mensaje en cola de la creación satisfactoria
        await actualizarGuia(id_user, id_heka, {
            numeroGuia: responseCreation.numeroGuia,
            has_sticker: false // TODO: hay que arreglar para asignar también el sticker de la guía
        });

        // Actualizamos la ultima guía creada con éxito y la fecha sobre el control principal
        controlBase.ultimaGuiaCorrecta = id_heka;
        controlBase.ultimoExito = fechaActualizacion;

        // Se cambia el estado de proceso de creación para marcarlo como exitoso
        controlBaseGuia.status = estadosCola.exito;
        // Se almacena el mensaje que se va a actualizar
        controlBaseGuia.message = firebase.firestore.FieldValue.arrayUnion({
            message: "La guia número " + responseCreation.numeroGuia + " ha sido creada exitósamente",
            fecha: fechaActualizacion
        });
    }

    // Se guarda el objeto global de estados
    await guardarEstadoCreacion(controlBase);

    // Se actualiza el estado actual de la cola
    await refColaCreacionGuias.doc(id_heka).update(controlBaseGuia);
}

// esta función me toma un arreglo de strings, junto con la refenrecia de FB, y lo guarda en una collectio indexada
async function guardarDocumentoSegmentado(base64Segmentada, referencia) {
  console.log(base64Segmentada);
  if (typeof base64Segmentada !== "object") return false;

  if (!base64Segmentada.length) return false;

  let guardado = true;
  for (let i = 0; i < base64Segmentada.length; i++) {
    const res = await referencia
      .doc(i.toString())
      .set({
        index: i,
        segmento: base64Segmentada[i],
      })
      .then(() => {
        return true;
      })
      .catch((error) => {
        console.log(
          "hubo un error al guardar una parte del documento segmentado => ",
          error
        );
        guardado = false;
        return false;
      });

    if (!res) break;
  }

  return guardado;
}

async function processCreationGuides() {
    console.log("iniciando proceso de creación");
    const inicioProceso = new Date().getTime();
    const isAvailableCreation = await availableCreation();

    console.log("Disponible para crear", isAvailableCreation);
    if(!isAvailableCreation) return;

    try {
        // Se cierra el encolador para que cuando se consulte "availableCreation", no permita reprocesar la información
        await guardarEstadoCreacion({open: false});
    
        // Se obtiene la lista completa que están pendientes por crear
        const enqueueGuides = await obtenerGuiasPendientesPorCrear();
    
        for(let queue of enqueueGuides) {
            // Se ejecuta el proceso de creación individual, con seguimiento y demás
            await intentarCrearGuiaEnCola(queue);
        }
    
        // Cuando ya se procesan todas las guías, se abre nuevamente el procesador
        const finProceso = new Date().getTime();
        await guardarEstadoCreacion({open: true, duracionTotal: (finProceso - inicioProceso) / 1000});
    } catch (e) {
        await guardarEstadoCreacion({open: true, ultimaCausaFallo: e.message});
    }
}


module.exports = { processCreationGuides }
