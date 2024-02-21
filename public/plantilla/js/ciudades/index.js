import {
  pathCiudadDane,
  pathCiudadesLista,
  pathEstadisticasCiudad,
} from "../config/api.js";
import CreateModal from "../utils/modal.js";
import { estadisticasTempl, transportadoraTempl } from "./views.js";
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

//#region EVENTOS
inpBuscadorCiudades.on("input", seleccionarCiudad);
form.on("submit", actualizarCiudad);
detallesTransp.on("click", detallesTransportadora);
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
  const nombreCiudad = document.querySelector("#nombre-ciudad-restricciones");

  nombreCiudad.textContent = `en ${ciudad.nombre}`;
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
  const reference = "";

  console.log(restringirEnvioOficina.checked, restringirEnvioDireccion.checked);

  console.log(selectTransportadora.val());
  console.log(ciudadActual);
}

export { renderListaCiudades };
