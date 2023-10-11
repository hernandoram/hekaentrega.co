const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {
  traducirMovimientoGuia,
  guiaEnNovedad,
} = require("../extends/manejadorMovimientosGuia");
const { actualizarMovimientosPorComparador } = require("./seguimientos");
const ciudades = require("../data/ciudades.js");
const busqueda = ciudades;

const _collEstadoGuia = "estadoGuias";
const _collGuia = "guias";

const tituloPorNovedad = {
  DIRECCION: "¿Te gustaría reparto?",
  REUSADO: "Nuevo intento.",
};

const referenciaNovedades = db
  .collection("infoHeka")
  .doc("novedadesMensajeria");

function cargarMensajeAleatorio() {
  const titulos = ["DIRECCION", "REUSADO"];
  const seleccionado = titulos[Math.floor(Math.random() * titulos.length)];

  return { tipo: seleccionado, titulo: tituloPorNovedad[seleccionado] };
}

exports.consultarGuia = async (req, res) => {
  const { n } = req.query;

  try {
    // if (!process.env.DEVELOPMENT)
    //   await actualizarMovimientosPorComparador("numeroGuia", "==", n);
    // console.log("REPORTE", reporte);

    const { lista, formularios } = await referenciaNovedades.get().then((d) => {
      if (d.exists) return d.data();

      return {};
    });

    const docMovimiento = await buscarGuia(n, _collEstadoGuia);

    if (!docMovimiento) return res.render("guias/guiaNoEncontrada", {
      layout: "general",
    });
    let movimientosEncontrado = docMovimiento.data();
    let ciudadOrigen = busqueda.find(
      (element) => element.dane_ciudad === movimientosEncontrado.daneOrigen
    );
    let ciudadDestino = busqueda.find(
      (element) => element.dane_ciudad === movimientosEncontrado.daneDestino
    );

    // console.log(ciudadOrigen.nombre)
    // console.log(ciudadDestino.nombre)

    const tradMov = traducirMovimientoGuia(
      movimientosEncontrado.transportadora
    );

    const traduccion = (mov) => {
      const titulos = Object.keys(tradMov);
      const res = {};
      titulos.forEach((t) => (res[t] = mov[tradMov[t]]));
      return res;
    };

    const traducirMovimientos = movimientosEncontrado.movimientos
      .map(traduccion)
      .reverse();

    const { novedad } = guiaEnNovedad(
      movimientosEncontrado.movimientos,
      movimientosEncontrado.transportadora
    );
    const novedadActual = novedad ? traduccion(novedad) : {};
    let novedadDireccion = false;

    let formularioNovedad;
    if (novedad) {
      const msjNovedad = novedadActual.novedad;
      const novedadLista = lista.find((l) => l.novedad === msjNovedad);

      // console.log(novedadActual, novedadLista);
      if (novedadLista && novedadLista.formulario)
        formularioNovedad = formularios[novedadLista.formulario];

      if (
        novedadActual.novedad.includes(
          "DIRECCION ERRADA" || "DIRECCION INCOMPLETA"
        )
      ) {
        novedadDireccion = true;
      }
    }

    console.log(novedadDireccion);

    const guia = {
      movimientos: traducirMovimientos,
      estado: movimientosEncontrado.estadoActual.toUpperCase(),
      numeroGuia: movimientosEncontrado.numeroGuia,
      fechaEnvio: movimientosEncontrado.fechaEnvio,
      enNovedad: movimientosEncontrado.enNovedad,
      novedadActual,
      formularioNovedad,
      ciudadDestino: ciudadOrigen.nombre,
      ciudadOrigen: ciudadDestino.nombre,
      formularioStr: JSON.stringify(formularioNovedad),
      novedadDireccion: novedadDireccion,
    };

    console.log("hola" + guia.novedadActual.novedad);

    // res.json(movimientosEncontrado);
    res.render("guias/historicoGuia", {
      guia,
      novedadActual,
      layout: "general",
    });

    // res.render("productos", {productos, tienda: req.params.storeInfo});
  } catch (e) {
    console.log(e.message);
    res.send(e.message);
  }
};

exports.plantearSolucion = async (req, res) => {
  console.log(req.body);
  const { numeroGuia, gestion, fechaMovimiento } = req.body;

  const doc = await buscarGuia(numeroGuia, _collGuia);
  if (!doc) return res.status(400).send("GUÍA NO ENCONTRADA");

  const gest = {
    gestion,
    fecha: new Date(),
    type: "EXTERNO",
    fechaMovimiento,
  };

  doc.ref
    .update({ seguimiento: firebase.firestore.FieldValue.arrayUnion(gest) })
    .then(() => {
      res.send("Información registrada correctamente");
    })
    .catch((e) => {
      console.log(e);
      res.status(400).send("Error registrando la información");
    });
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
