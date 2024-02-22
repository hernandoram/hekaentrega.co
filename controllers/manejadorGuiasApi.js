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

    const { lista, formularios } = await referenciaNovedades.get().then((d) => {
      if (d.exists) return d.data();

      return {};
    });

    const docMovimiento = await buscarGuia(n, _collEstadoGuia);

    if (!docMovimiento) return res.send("GUIA NO ENCONTRADA");
    let movimientosEncontrado = docMovimiento.data();
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
    };

    res.status(200).send({
      guide,
      currentNovelty,
    });

    // res.render("productos", {productos, tienda: req.params.storeInfo});
  } catch (e) {
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
