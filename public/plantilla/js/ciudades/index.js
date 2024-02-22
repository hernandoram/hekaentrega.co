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

const selectTransportadora = $("#transportadora-restricciones");

let restringirEnvioOficina = document.getElementById("restringirEnvioOficina");
let restringirEnvioDireccion = document.getElementById(
  "restringirEnvioDireccion"
);

const tipoUsuarioRestricciones = document.getElementById(
  "tipoUsuario-restricciones"
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
  const agregarRestricciones = document.querySelector("#agregar-restricciones");
  noCiudadEscogida.classList.add("d-none");
  agregarRestricciones.classList.remove("d-none");
  const nombreCiudad = document.querySelector("#nombre-ciudad-restricciones");
  nombreCiudad.textContent = `en ${ciudad.nombre}`;

  renderRestricciones(ciudad.dane_ciudad);
}

function renderRestricciones(dane_ciudad) {
  let restricciones = [];
  const listaRestricciones = document.querySelector("#lista-restricciones");
  const mensajenoRestriccion = document.querySelector("#mensaje-noRestriccion");

  const reference = db
    .collection("ciudades")
    .doc(dane_ciudad)
    .collection("restricciones");

  reference
    .get()
    .then((querySnapshot) => {
      restricciones = [];
      querySnapshot.forEach((doc) => {
        restricciones.push(doc.data());
      });
    })
    .then(() => {
      console.log(restricciones);
      if (restricciones.length > 0) {
        listaRestricciones.innerHTML = restricciones
          .map(
            (restriccion) => `
        <tr>
          <td>${restriccion.tipoUsuario}</td>
          <td>${restriccion.transportadora}</td>
          <td>${restriccion.oficina ? "Oficina" : "Dirección"}</td>
          <td><button class="btn btn-danger">Eliminar</button></td>
        </tr>
      `
          )
          .join("");
      } else {
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

botonAgregarRestriccion.on("click", agregarRestriccion);

function agregarRestriccion() {
  const reference = db
    .collection("ciudades")
    .doc(ciudadActual.dane_ciudad)
    .collection("restricciones");

  const restriccion = {
    tipoUsuario: tipoUsuarioRestricciones.value,
    transportadora: selectTransportadora.val(),
    oficina: restringirEnvioOficina.checked,
    direccion: restringirEnvioDireccion.checked,
  };

  reference
    .doc(`${restriccion.tipoUsuario}${restriccion.transportadora}`)
    .set(restriccion)
    .then(() => {
      console.log("Restricción agregada");
      swal.fire(
        "Restricción agregada",
        "La restricción ha sido agregada",
        "success"
      );
    })
    .catch((e) =>
      swal.fire(
        "Error al agregar restricción",
        "La restricción no ha sido agregada",
        "success"
      )
    );
}

export { renderListaCiudades };
