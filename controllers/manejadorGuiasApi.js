const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {
  guiaEnNovedad,
} = require("../extends/manejadorMovimientosGuia");
const ciudades = require("../data/ciudades.js");
const { generarSegundaVersionMovimientoGuias } = require("../extends/funciones.js");
const busqueda = ciudades;
const referenciaNovedades = db
  .collection("infoHeka")
  .doc("novedadesMensajeria");

const _collEstadoGuia = "estadoGuias";

exports.consultarGuiaApi = async (req, res) => {
  const { n } = req.query;

  try {

    const { lista } = await referenciaNovedades.get().then((d) => {
      if (d.exists) return d.data();

      return {};
    });

    const docMovimiento = await buscarGuia(n, _collEstadoGuia);

    if (!docMovimiento) return res.status(500).send({});
    let movimientosEncontrado = docMovimiento.data();

    const docGuide = await searchCollection('guias', 'id_heka', movimientosEncontrado.id_heka);
    const dataGuide = docGuide.data();
    const dataUser = {
      cel: dataGuide.telefonoD,
      email: dataGuide.correoD,
      celSender: dataGuide.celularR
    }
    let ciudadOrigen = busqueda.find(
      (element) => element.dane_ciudad === movimientosEncontrado.daneOrigen
    );
    let ciudadDestino = busqueda.find(
      (element) => element.dane_ciudad === movimientosEncontrado.daneDestino
    );

    generarSegundaVersionMovimientoGuias(movimientosEncontrado);

    const { novedad } = guiaEnNovedad(
      movimientosEncontrado.movimientos,
      movimientosEncontrado.transportadora
    );

    const currentNovelty = novedad ? novedad : {};
    let novedadDireccion = false;

    let formularioNovedad;
    let tituloSolucion;
    if (novedad) {
      const msjNovedad = currentNovelty.novedad;
      const novedadLista = lista.find((l) => l.novedad === msjNovedad);

      if (
        currentNovelty.novedad.includes(
          "DIRECCION ERRADA" || "DIRECCION INCOMPLETA"
        )
      ) {
        novedadDireccion = true;
      }
    }

    const guide = {
      movimientos: movimientosEncontrado.movimientos.reverse(),
      estado: movimientosEncontrado.estadoActual.toUpperCase(),
      numeroGuia: movimientosEncontrado.numeroGuia,
      fechaEnvio: movimientosEncontrado.fechaEnvio,
      enNovedad: movimientosEncontrado.enNovedad,
      tituloSolucion,
      currentNovelty,
      formularioNovedad,
      ciudadDestino: ciudadOrigen.nombre,
      ciudadOrigen: ciudadDestino.nombre,
      formularioStr: JSON.stringify(formularioNovedad),
      novedadDireccion: novedadDireccion,
      dataUser
    };

    const followUp = [];
    if (dataGuide.seguimiento) {
      dataGuide.seguimiento.forEach(element => {
        followUp.push({
          label: element.gestion,
          date: formatTimestamp(element.fecha.seconds, element.fecha.nanoseconds),
        });
      });
    }

    res.status(200).send({
      guide,
      currentNovelty,
      followUp: followUp.reverse()
    });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

async function buscarGuia(numeroGuia, coll) {
  return await db
    .collectionGroup(coll)
    .where("numeroGuia", "==", numeroGuia)
    .limit(1)
    .get()
    .then((querySnapshot) => {
      const doc = querySnapshot.docs[0];

      return doc;
    });
}

async function searchCollection(collection, field, value) {
  return await db
    .collectionGroup(collection)
    .where(field, "==", value)
    .limit(1)
    .get()
    .then((querySnapshot) => {
      const doc = querySnapshot.docs[0];

      return doc;
    });
}

function formatTimestamp(timeseconds, nanoseconds) {
  // Convertir segundos y nanosegundos a milisegundos
  let milliseconds = timeseconds * 1000 + Math.floor(nanoseconds / 1000000);
  
  // Crear un objeto Date
  let date = new Date(milliseconds);
  
  // Formatear la fecha
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let day = String(date.getDate()).padStart(2, '0');
  let hours = String(date.getHours()).padStart(2, '0');
  let minutes = String(date.getMinutes()).padStart(2, '0');
  let seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
