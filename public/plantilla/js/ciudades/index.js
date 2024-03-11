import {
  pathCiudadDane,
  pathCiudadesLista,
  pathEstadisticasCiudad,
} from "../config/api.js";
import CreateModal from "../utils/modal.js";
import { estadisticasTempl, transportadoraTempl } from "./views.js";

const db = firebase.firestore();

const dtListCiudades = $("#list_buscador-ciudades");
const inpBuscadorCiudades = $("#buscador-ciudades");
const form = $("#form-ciudades");
const htmlEstadisticas = $("#estadisticas-ciudades");

const botonAgregarRestriccion = $("#boton-agregar-restriccion");

const detallesTransp = $(".detalles-transp-ciudades");

const selectTransportadora = $("#transportadora-configuraciones");

let restringirEnvioOficina = document.getElementById("restringirEnvioOficina");
let restringirEnvioDireccion = document.getElementById(
  "restringirEnvioDireccion"
);

const tipoUsuarioRestricciones = document.getElementById(
  "tipoUsuario-configuraciones"
);

const tipoEnvioRestricciones = document.getElementById(
  "tipoEnvio-configuraciones"
);

//#region EVENTOS
inpBuscadorCiudades.on("input", seleccionarCiudad);
form.on("submit", actualizarCiudad);
detallesTransp.on("click", detallesTransportadora);

botonAgregarRestriccion.on("click", agregarRestriccion);

//#endregion

let listaciudades = [],
  ciudadActual;

async function obtenerCiudades() {
  if (!listaciudades.length)
    listaciudades = await fetch(pathCiudadesLista)
      .then((d) => d.json())
      .then((d) => d.body);

  return listaciudades;
}

async function renderListaCiudades() {
  const ciudades = await obtenerCiudades();

  ciudades.forEach((c) => {
    dtListCiudades.append(
      `<option value=${c.dane_ciudad}>${c.nombre}</option>`
    );
  });
}

async function seleccionarCiudad(e) {
  const dane = e.target.value;
  if (!dane) return;
  restringirEnvioOficina.checked = false;
  restringirEnvioDireccion.checked = false;
  // Recodar arreglar la estructura del API
  const ciudad = await fetch(pathCiudadDane + "/" + dane)
    .then((d) => d.json())
    .catch((e) => false);

  ciudadActual = ciudad.body;
  if (!ciudad) return;

  console.log(ciudad.body);
  estadisticasCiudad(dane);
  restriccionesCiudad(ciudad.body);

  renderFormValues(ciudad.body, form);
}

async function estadisticasCiudad(dane) {
  const resEst = await fetch(pathEstadisticasCiudad + "/" + dane).then((d) =>
    d.json()
  );

  if (resEst.error) return;

  mostrarEstadisticas(resEst.body);
}

async function restriccionesCiudad(ciudad) {
  // Render
  const noCiudadEscogida = document.querySelector("#noCiudadEscogida");
  const agregarRestricciones = document.querySelector("#agregar-configuraciones");
  noCiudadEscogida.classList.add("d-none");
  agregarRestricciones.classList.remove("d-none");
  const nombreCiudad = document.querySelector("#nombre-ciudad-configuraciones");
  nombreCiudad.textContent = `en ${ciudad.nombre}`;

  renderRestricciones(ciudad.dane_ciudad);
}

const tipos_distribucion = [null, "Entrega en dirección", "Entrega en oficina"]

function renderRestricciones() {
  let configuraciones = [];
  const listaRestricciones = document.querySelector("#lista-configuraciones");
  const mensajenoRestriccion = document.querySelector("#mensaje-noRestriccion");
  const tablaRestricciones = document.querySelector("#tabla-configuraciones");

  const reference = db
    .collection("ciudades")
    .doc(ciudadActual.dane_ciudad)
    .collection("config_ciudad");

  reference
    .get()
    .then((querySnapshot) => {
      configuraciones = [];
      querySnapshot.forEach((doc) => {
        let restriccion = doc.data();
        restriccion.id = doc.id;
        configuraciones.push(restriccion);
      });
    })
    .then(() => {
      console.log(configuraciones);
      if (configuraciones.length > 0) {
        mensajenoRestriccion.classList.add("d-none");
        tablaRestricciones.classList.remove("d-none");

        listaRestricciones.innerHTML = configuraciones
          .map(
            (restriccion) => `
        <tr>
          <td>${restriccion.tipoUsuario}</td>
          <td>${restriccion.transportadora}</td>
          <td>${restriccion.tipoEnvio}</td>
          <td>${
            restriccion.tipo_distribucion.length 
            ? restriccion.tipo_distribucion.map(d => tipos_distribucion[d]).join(", ")
            : "SIN TIPO DISTRIBUCIÓN (BLOQUEADA)"  
          }
          </td>
          <td>${restriccion.descripcion}</td>
          <td><button class="btn btn-danger" data-id="${
            restriccion.id
          }">Eliminar</button></td>
        </tr>
      `
          )
          .join("");

        document.querySelectorAll(".btn-danger").forEach((button) => {
          button.addEventListener("click", function (event) {
            const id = event.target.getAttribute("data-id");
            console.log(id);
            db.collection("ciudades")
              .doc(ciudadActual.dane_ciudad)
              .collection("config_ciudad")
              .doc(id)
              .delete()
              .then(() => {
                swal.fire("Documento eliminado con éxito!");
                renderRestricciones();
              })
              .catch((error) => {
                swal.fire("Error eliminando el documento: ", error);
              });
          });
        });
      } else {
        tablaRestricciones.classList.add("d-none");
        mensajenoRestriccion.classList.remove("d-none");
      }
    });
}

function renderFormValues(data, form) {
  renderInputValues(data, form);
}

function mostrarEstadisticas(estadisticas) {
  htmlEstadisticas.html(estadisticas.map(estadisticasTempl));
}

function renderInputValues(data, form) {
  $("[name]", form).each((i, el) => {
    const { type, name, value } = el;
    const info = data[name];

    if (type == "checkbox") {
      if (typeof info === "object" && info.length && info.includes(value))
        el.checked = true;

      return;
    }

    el.value = info;
  });
}

function detallesTransportadora(e) {
  const m = new CreateModal({
    title: "Detalles de transportadora",
  });

  m.init = transportadoraTempl({});

  const formulario = $("form", m.modal);
  console.log(ciudadActual);
  renderFormValues(ciudadActual.transportadoras["SERVIENTREGA"], formulario);
}

function actualizarCiudad(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const structure = {};

  for (let data of formData) {
    const [key, value] = data;
    if (structure[key]) {
      if (typeof structure[key] !== "object") structure[key] = [structure[key]];

      structure[key].push(value);
    } else {
      structure[key] = value;
    }
  }

  console.log(structure);
}

selectTransportadora.on("change", (e) => {
  restringirEnvioOficina.checked = false;
  restringirEnvioDireccion.checked = false;
});


function agregarRestriccion() {
  const reference = db
    .collection("ciudades")
    .doc(ciudadActual.dane_ciudad)
    .collection("config_ciudad");

  const restriccionV1 = {
    tipoUsuario: tipoUsuarioRestricciones.value,
    tipoEnvio: tipoEnvioRestricciones.value,
    transportadora: selectTransportadora.val(),
    oficina: restringirEnvioOficina.checked,
    direccion: restringirEnvioDireccion.checked,
  };

  const restriccion = dataFromForm(document.getElementById("form_agregar-configuraciones"));

  reference
    .doc(
      `${restriccion.tipoUsuario}-${restriccion.transportadora}-${
        restriccion.tipoEnvio.split(" ").join("_")
      }`
    )
    .set(restriccion)
    .then(() => {
      console.log("Restricción agregada");
      swal.fire(
        "Restricción agregada",
        "La restricción ha sido agregada",
        "success"
      );
      renderRestricciones();
    })
    .catch((e) =>
      swal.fire(
        "Error al agregar restricción",
        "La restricción no ha sido agregada",
        "success"
      )
    );
}

function dataFromForm(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  // Asiganmos los tipos de distribución
  data.tipo_distribucion = formData.getAll("tipo_distribucion");

  // Convertimos el check "activa" a booleano
  data.activa = Boolean(data.activa);

  return data;
}

export { renderListaCiudades };
