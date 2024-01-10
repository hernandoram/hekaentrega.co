import { firestore } from "../config/firebase.js";
import CreateModal from "../utils/modal.js";
import { cardBodegaRecoleccion, formRecoleccion, cardBodegaRecoleccionSolicitada } from "./views.js";

const db = firestore;

const POSTURL = "/inter/recogidaesporadica?mode=test";

/*{
    id_sucusal1: {..., guias: []}
    id_sucusal2: {...}
}*/
let recoleccionesPendientes; // Lugar donde se almacena todo el conjunto de recolecciones

const elListaSucursales = $("#lista-recolecciones");
const elListaSucursalesRealizadas = $("#lista-recolecciones-realizadas");
const elRevisarRecolecciones = $("#revisar-recolecciones");
const elRevisarRecoleccionesRealizadas = $("#revisar-recolecciones-realizadas");

elRevisarRecolecciones.on("click", mostrarListaRecolecciones);
elRevisarRecoleccionesRealizadas.on(
  "click",
  mostrarListaRecoleccionesRealizadas
);

async function llenarRecoleccionesPendientes(solicitar) {
  await db
    .collectionGroup("guias")
    .where("recoleccion_esporadica", "==", 1)

    .where("recoleccion_solicitada", "==", solicitar)
    .where("transportadora", "==", "INTERRAPIDISIMO")
    .limit(200)
    .get()
    .then((querySnapshot) => {
      recoleccionesPendientes = {};
      console.log(querySnapshot.size);
      querySnapshot.forEach((doc) => {
        const guia = doc.data();

        if (recoleccionesPendientes[guia.codigo_sucursal]) {
          recoleccionesPendientes[guia.codigo_sucursal].guias.push(guia);
        } else {
          recoleccionesPendientes[guia.codigo_sucursal] = {
            codigo_sucursal: guia.codigo_sucursal,
            centro_de_costo: guia.centro_de_costo,
            id_user: guia.id_user,
            guias: [guia],
          };
        }
      });
    });
}

async function mostrarListaRecolecciones() {
  console.log("cargando recolecciones");
  await llenarRecoleccionesPendientes(false);
  const recolecciones = Object.values(recoleccionesPendientes);

  console.log(recolecciones);
  elListaSucursales.html("");

  recolecciones.forEach((r) => {
    elListaSucursales.append(() => cardBodegaRecoleccion(r));
  });

  activarAcciones(elListaSucursales);
}
async function mostrarListaRecoleccionesRealizadas() {
  console.log("cargando recolecciones realizadas");
  await llenarRecoleccionesPendientes(true);
  const recolecciones = Object.values(recoleccionesPendientes);

  console.log(recolecciones);
  elListaSucursalesRealizadas.html("");

  recolecciones.forEach((r) => {
    elListaSucursalesRealizadas.append(() => cardBodegaRecoleccionSolicitada(r));
  });

  activarAcciones(elListaSucursalesRealizadas);
}

function activarAcciones(container) {
  const els = $("[data-action]", container);
  const accion = els.attr("data-action");
  els.on("click", acciones[accion]);
}

function formSolicitarRecoleccion(e) {
  e.preventDefault();

  // Obtén una referencia al modal
  const modal = e.target.closest(".modal");

  // Oculta el modal
  $(modal).modal("hide");

  // Elimina el modal del DOM después de que se haya ocultado
  $(modal).on("hidden.bs.modal", function () {
    $(this).remove();
  });

  const target = e.target;
  const formData = new FormData(target);

  const consulta = {
    ids_heka: [], // Lista de ids heka referenciados al usuario
    numerosGuia: [], // Lista de los número de guía provistos por la transportadora
    id_user: "", // Id del usuario que solicita recolección
    idSucursalCliente: null, // Código de sucursal de interrapidísimo
    fechaRecogida: "", // Fecha en que se solicita la recolección
  };

  for (let key of formData.keys()) {
    consulta[key] = formData.get(key);
  }

  const recoleccionTramitada =
    recoleccionesPendientes[consulta.idSucursalCliente];
  consulta.id_user = recoleccionTramitada.id_user;

  const { ids_heka, numerosGuia } = recoleccionTramitada.guias.reduce(
    (a, b) => {
      a.numerosGuia.push(b.numeroGuia);
      a.ids_heka.push(b.id_heka);
      return a;
    },
    { ids_heka: [], numerosGuia: [] }
  );

  consulta.ids_heka = ids_heka;
  consulta.numerosGuia = numerosGuia;

  fetchRecoleccion(consulta).catch((error) => console.error(error));

  Swal.fire({
    title: "Recolección solicitada con exito!",
    text: `Las guias del han sido solicitadas para recolección!`,
    icon: "success",
  });

  mostrarListaRecolecciones();
}

const acciones = {
  solicitarRecoleccion: (e) => {
    const target = e.target;
    const { codigo_sucursal } = target.dataset;
    const datos_recoleccion = recoleccionesPendientes[codigo_sucursal];

    const m = new CreateModal({
      title:
        "Solicitud de recolección para: " + datos_recoleccion.centro_de_costo,
    });

    m.init = formRecoleccion(datos_recoleccion);
    const form = $("form", m.modal);
    const inputFecha = $("#fecha-recoleccion", form);
    const date = new Date();
    date.setUTCHours(15, 0, 0);
    const [dateStr] = date.toISOString().split(".");

    inputFecha.val(dateStr);

    form.on("submit", formSolicitarRecoleccion);
    m.onSubmit = () => form.submit();
  },
};

async function fetchRecoleccion(data) {
  const guias = data.numerosGuia;
  const response = await fetch(POSTURL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const body = await response.json();
  console.log(body, guias);

  await guiasSolicitadas(guias);

  return body;
}

async function guiasSolicitadas(data) {
  await db
    .collectionGroup("guias")
    .where("recoleccion_esporadica", "==", 1)
    .where("numeroGuia", "in", data)
    .where("transportadora", "==", "INTERRAPIDISIMO")
    .get()
    .then((querySnapshot) => {
      console.log(querySnapshot.size);
      querySnapshot.forEach((doc) => {
        const guia = doc.data();
        console.log(doc.id);
        guia.recoleccion_solicitada = true;
        doc.ref.update(guia);
      });
    });
}
