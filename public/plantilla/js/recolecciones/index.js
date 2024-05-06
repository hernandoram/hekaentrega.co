import { firestore } from "../config/firebase.js";
import CreateModal from "../utils/modal.js";
import {
  cardBodegaRecoleccion,
  formRecoleccion,
  recoleccionSolicitada,
  formEliminarGuiasRecoleccion
} from "./views.js";

const db = firestore;

const POSTURL = "/inter/recogidaesporadica"; // para activar el modo test: ?mode=test

const sellers = [
  "SellerWiland",
  "Seller1891tattoosupply",
  "SellerElectrovariedadesEYMce",
  "SellerNICE",
  "SellerMerakiJSLSAS"
];

/*{
    id_sucusal1: {..., guias: []}
    id_sucusal2: {...}
}*/
let recoleccionesPendientes; // Lugar donde se almacena todo el conjunto de recolecciones

const elListaSucursales = $("#lista-recolecciones");
const elListaSucursalesRealizadas = $("#lista-recolecciones-realizadas");
const elRevisarRecolecciones = $("#revisar-recolecciones");
const elRevisarRecoleccionesRealizadas = $("#revisar-recolecciones-realizadas");
const section = document.getElementById("mostrador-guias-solicitadas");
const inputField = document.getElementById("filtrar-guias-recolectadas");

elRevisarRecolecciones.on("click", mostrarListaRecolecciones);
elRevisarRecoleccionesRealizadas.on(
  "click",
  mostrarListaRecoleccionesRealizadas
);

inputField.addEventListener("input", function () {
  const filterValue = this.value.toLowerCase();

  const tableRows = document.querySelectorAll(
    "#lista-recolecciones-realizadas tr"
  );
  console.log(tableRows);
  tableRows.forEach((row) => {
    const rowText = row.textContent.toLowerCase();
    row.style.display = rowText.includes(filterValue) ? "" : "none";
  });
});

async function llenarRecoleccionesPendientes(solicitar) {
  await db
    .collectionGroup("guias")
    .where("recoleccion_esporadica", "==", 1)

    .where("recoleccion_solicitada", "==", solicitar)
    .where("transportadora", "==", "INTERRAPIDISIMO")
    .get()
    .then((querySnapshot) => {
      recoleccionesPendientes = {};
      console.log(querySnapshot.size);
      querySnapshot.forEach((doc) => {
        const guia = doc.data();

        if (guia.numeroGuia === undefined) return;
        if (recoleccionesPendientes[guia.codigo_sucursal]) {
          recoleccionesPendientes[guia.codigo_sucursal].guias.push(guia);
        } else {
          recoleccionesPendientes[guia.codigo_sucursal] = {
            codigo_sucursal: guia.codigo_sucursal,
            centro_de_costo: guia.centro_de_costo,
            id_user: guia.id_user,
            guias: [guia]
          };
        }
      });
    });
}

async function mostrarListaRecolecciones() {
  console.log("cargando recolecciones");
  await llenarRecoleccionesPendientes(false);
  let recolecciones = Object.values(recoleccionesPendientes);

  console.warn(recolecciones);
  elListaSucursales.html("");

  recolecciones.forEach((r) => {
    elListaSucursales.append(() => cardBodegaRecoleccion(r));
  });

  activarAcciones(elListaSucursales);
}

async function mostrarListaRecoleccionesRealizadas() {
  console.log("cargando recolecciones realizadas");
  section.classList.remove("d-none");
  await llenarRecoleccionesPendientes(true);
  const recolecciones = Object.values(recoleccionesPendientes);

  const recoleccionesSolicitadas = recolecciones.flatMap(({ guias }) =>
    guias.map(
      ({
        numeroGuia,
        centro_de_costo,
        codigo_sucursal,
        fecha_recoleccion,
        radicado_recoleccion
      }) => ({
        numeroGuia,
        centro_de_costo,
        codigo_sucursal,
        fecha_recoleccion,
        radicado_recoleccion
      })
    )
  );

  // console.log(recoleccionesSolicitadas);
  // console.log(recolecciones);

  elListaSucursalesRealizadas.html("");

  recoleccionesSolicitadas.forEach((r) => {
    r.fechaFormateada = formatearFecha(r.fecha_recoleccion); // Asume que r.fecha es la fecha que quieres formatear
    elListaSucursalesRealizadas.append(() => recoleccionSolicitada(r));
  });

  activarAcciones(elListaSucursalesRealizadas);
}

function activarAcciones(container) {
  const els = $("[data-action]", container);

  els.each(function () {
    const accion = $(this).attr("data-action");
    $(this).on("click", acciones[accion]);
  });
}

async function eliminarGuias(e, data) {
  e.preventDefault();

  console.log(data);
  // Obtén una referencia al modal
  const modal = e.target.closest(".modal");

  // Oculta el modal
  $(modal).modal("hide");

  // Elimina el modal del DOM después de que se haya ocultado
  $(modal).on("hidden.bs.modal", function () {
    $(this).remove();
  });

  // Muestra un mensaje de Swal que indica que la eliminación está en progreso
  Swal.fire({
    title: "Eliminando guías...",
    allowOutsideClick: false,
    showConfirmButton: false,
    html: '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>',
    onBeforeOpen: () => {
      Swal.showLoading();
    }
  });

  await guiasParaQuitarRecoleccion(data.guias);



  // Cierra el mensaje de Swal
  Swal.close();
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
    fechaRecogida: "" // Fecha en que se solicita la recolección
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
    icon: "success"
  });

  mostrarListaRecolecciones();
}

const acciones = {
  eliminarGuiasRecoleccion: (e) => {
    const target = e.target;
    const { codigo_sucursal } = target.dataset;
    const datos_recoleccion = recoleccionesPendientes[codigo_sucursal];

    const m = new CreateModal({
      title: `¿Desea eliminar?`,
      btnContinueText: "Eliminar",
      btnContinueColor: "red"
    });

    m.init = formEliminarGuiasRecoleccion(datos_recoleccion);
    const form = $("form", m.modal);

    form.on("submit", (e) => eliminarGuias(e, datos_recoleccion));
    m.onSubmit = () => form.submit();
  },
  solicitarRecoleccion: (e) => {
    const target = e.target;
    const { codigo_sucursal } = target.dataset;
    const datos_recoleccion = recoleccionesPendientes[codigo_sucursal];

    const m = new CreateModal({
      title: "Solicitud de recolección para: la sucursal " + codigo_sucursal
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
  }
};

async function fetchRecoleccion(data) {
  const guias = data.numerosGuia;
  const response = await fetch(POSTURL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });
  const body = await response.json();
  console.warn(body);
  const radicado = body.response.idRecogica;

  await guiasSolicitadas(guias, radicado);

  return body;
}

async function guiasSolicitadas(data, radicado) {
  for (const numeroGuia of data) {
    await db
      .collectionGroup("guias")
      .where("recoleccion_esporadica", "==", 1)
      .where("numeroGuia", "==", numeroGuia)
      .where("transportadora", "==", "INTERRAPIDISIMO")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const guia = doc.data();
          console.log(doc.id);
          guia.recoleccion_solicitada = true;
          guia.fecha_recoleccion = new Date().toISOString();
          guia.radicado_recoleccion = radicado;

          doc.ref.update(guia);
        });
      });
  }
}

async function guiasParaQuitarRecoleccion(data) {
  const guias = data.map((guia) => guia.numeroGuia);
  for (const numeroGuia of guias) {
    await db
      .collectionGroup("guias")
      .where("recoleccion_esporadica", "==", 1)
      .where("numeroGuia", "==", numeroGuia)
      .where("transportadora", "==", "INTERRAPIDISIMO")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const guia = doc.data();
          guia.recoleccion_esporadica = 0; // Cambia recoleccion_esporadica a 0
          doc.ref.update(guia);
        });
      });
  }
}

function formatearFecha(fecha) {
  const fechaObj = new Date(fecha);

  const dia = fechaObj.getDate().toString().padStart(2, "0");
  const mes = (fechaObj.getMonth() + 1).toString().padStart(2, "0"); // Los meses en JavaScript empiezan en 0
  const año = fechaObj.getFullYear();

  const hora = fechaObj.getHours().toString().padStart(2, "0");
  const minutos = fechaObj.getMinutes().toString().padStart(2, "0");

  return `${dia}/${mes}/${año} ${hora}:${minutos}`;
}
