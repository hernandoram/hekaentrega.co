import {
  searchAndRenderCities,
  ciudades,
  selectize,
} from "../consultarCiudades.js";

const db = firebase.firestore();

const bodegasEl = $("#list_bodegas-cotizador");
const plantillasEl = $("#list_plantillas-cotizador");
const inpCiudadR = $("#ciudadR");
const inpCiudadD = $("#ciudadD");
const CheckGuardar = $("#guardar_cotizacion-cotizador");
const configGuardado = $("#cont_config_save-cotizador");
const contNombrePlantilla = $("#cont_nom_plant-cotizador");
const formulario = $("#cotizar-envio");
const checkActivarDestinoPlantilla = $("#actv_ciudad_plantilla-cotizador");
const actionEliminarPlantilla = $("#boton_eliminar_plant");
const checkEditPlant = $("#actv_editar_plantilla-cotizador");
const contEditPlant = $("#cont_act_plant-cotizador");
const btnCotizar = $("#boton_cotizar_2");

const referenciaListaPlantillas = usuarioAltDoc().collection(
  "plantillasCotizador"
);

const listaPlantilla = new Map();

bodegasEl.change(cambiarBodegaCotizador);
plantillasEl.change(cambiarPlantillaCotizador);
CheckGuardar.change(mostrarOcultarNombrePlantilla);
actionEliminarPlantilla.click(eliminarPlantillaActual);
checkActivarDestinoPlantilla.change(() => plantillasEl.change());

const charger = new ChangeElementContenWhileLoading(btnCotizar);

export function llenarBodegasCotizador() {
  bodegasWtch.watchFromLast((info) => {
    if (!info) return;

    bodegasEl.html("");

    const opciones = info.map((bodega) => {
      //

      searchAndRenderCities(selectize.ciudadR, bodega.ciudad.split("(")[0]);
      const bodegaEl = `<option value="${bodega.ciudad}">${bodega.nombre}</option>`;
      return bodegaEl;
    });

    opciones.unshift(`<option value>Seleccione Bodega</option>`);

    bodegasEl.html(opciones.join(""));
  });
}

watcherPlantilla.watch(llenarProductos);
export function llenarProductos(num) {
  referenciaListaPlantillas.get().then((q) => {
    plantillasEl.html("");
    const opciones = [];

    q.forEach((d) => {
      const data = d.data();
      if (data.eliminada) return;

      const ciudadBusqueda = ciudades.find(
        (ciudad) => ciudad.dane_ciudad === data.ciudadD
      );

      if (!ciudadBusqueda) return;
      opciones.push(`<option value="${d.id}">${data.nombre}</option>`);
      listaPlantilla.set(d.id, { ...data, ciudad: ciudadBusqueda.nombreAveo });

      searchAndRenderCities(
        selectize.ciudadD,
        ciudadBusqueda.ciudad.split("(")[0]
      );
    });

    opciones.unshift(`<option value>Seleccione Plantilla</option>`);
    plantillasEl.html(opciones.join(""));
  });

  if (num) configGuardado.addClass("d-none");

  CheckGuardar.prop("checked", false);
}

const ciudadesTomadas = new Map();
function cambiarBodegaCotizador(e) {
  const val = e.target.value;

  console.warn(val);

  limpiarInputCiudad(inpCiudadR);

  const bodega = bodegasWtch.value.find((b) => b.ciudad == val);

  if (!bodega) return;

  buscarCiudad(inpCiudadR, bodega.ciudad);
}

function setearCiudad(inp, data) {
  if (!ciudadesTomadas.has(data.nombre)) ciudadesTomadas.set(data.nombre, data);
  if (data.desactivada) return;

  llenarInputCiudad(inp, data);
  charger.end();
}

function buscarCiudad(el, ciudad) {
  if (!ciudad) return;

  charger.init();
  if (ciudadesTomadas.has(ciudad)) {
    return setearCiudad(el, ciudadesTomadas.get(ciudad));
  }

  console.warn(ciudad);

  db.collection("ciudades")
    .where("nombre", "==", ciudad)
    .limit(3)
    .get()
    .then((q) => {
      q.forEach((doc) => {
        const data = doc.data();

        console.warn(data);
        if (data.desactivada) return;
        setearCiudad(el, data);
      });
    });
}

function cambiarPlantillaCotizador(e) {
  const val = e.target.value;

  // Limpiamos los campos donde se ingresa la ciudad del destinatario y remitente
  limpiarInputCiudad(inpCiudadR);
  limpiarInputCiudad(inpCiudadD);

  formulario[0].reset();
  buscarCiudad(inpCiudadR, bodegasEl.val());

  if (!val) {
    configGuardado.removeClass("d-none");
    contNombrePlantilla.addClass("d-none");
    actionEliminarPlantilla.addClass("d-none");
    contEditPlant.addClass("d-none");
  } else {
    actionEliminarPlantilla.removeClass("d-none");
    contEditPlant.removeClass("d-none");
    configGuardado.addClass("d-none");
  }

  const plantilla = listaPlantilla.get(val);

  if (!plantilla) return;

  const plant = Object.assign({}, plantilla);
  delete plant.ciudadD;
  delete plant.ciudadR;

  const keys = Object.keys(plant);

  keys.forEach((k) => {
    $(`[name="${k}"]`, formulario).val(plant[k]);
  });

  if (checkActivarDestinoPlantilla[0].checked)
    buscarCiudad(inpCiudadD, plantilla.ciudad);
}

function llenarInputCiudad(inp, data) {
  inp[0].selectize.setValue(data.dane_ciudad);
}

function limpiarInputCiudad(inp) {
  inp[0].selectize.clear();
  const atributos = [
    "id",
    "ciudad",
    "departamento",
    "dane_ciudad",
    "tipo_trayecto",
    "frecuencia",
    "tipo_distribucion",
  ];

  atributos.forEach((a) => inp.removeAttr("data-" + a));
}

function mostrarOcultarNombrePlantilla(e) {
  const checked = e.target.checked;
  const nombrePlantilla = $("#cont_nom_plant-cotizador");

  checked
    ? nombrePlantilla.removeClass("d-none")
    : nombrePlantilla.addClass("d-none");
}

function eliminarPlantillaActual() {
  const idPlantilla = plantillasEl.val();
  Swal.fire({
    icon: "question",
    title: "¿Seguro que seas eliminar esta plantilla?",
    customClass: {
      cancelButton: "btn btn-secondary m-2",
      confirmButton: "btn btn-primary m-2",
    },
    showCancelButton: true,
    showCloseButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Eliminar",
    buttonsStyling: false,
  }).then((result) => {
    if (result.isConfirmed) {
      referenciaListaPlantillas
        .doc(idPlantilla)
        .update({ eliminada: true })
        .then(() => {
          Toast.fire("Plantilla Eliminada.", "", "success");
          watcherPlantilla.change(1);
        });
    }
  });
}
