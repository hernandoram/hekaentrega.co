import { firestore, storage } from "../config/firebase.js";
import { visualizarNotificacion } from "./views.js";

const slectImagenes = $("#imageUrl-centro_notificaciones");
const previsualizadorImagen = $("#preview-centro_notificaciones");
const cargadorImagen = $("#cargar_imagen-centro_notificaciones");
const rutaPorDefectoPrevisualizador = previsualizadorImagen.attr("src");
const formulario = $("#form-centro_notificaciones");
const seccionNotificaciones = $("#seccion-notificaciones");
const visorNotificaciones = $("#visor-centro_notificaciones");
const selectorNotificacion = document.querySelector("#selectorNotificacion");
const botonNotificacion = document.querySelector("#generar-notificacion");
const notificacionGlobal = document.querySelector("#notificacionGlobal");
const inputs = document.querySelectorAll(
  "#form-centro_notificaciones input, #form-centro_notificaciones select"
);

const mostradorUsuariosNoti = document.querySelector("#mostradorUsuariosNoti");
const mostradorUsuariosNotiUsers = document.querySelector(
  "#mostradorUsuariosNotiUsers"
);
const inputBuscador = document.getElementById("inputMostradorUserNoti");
selectorNotificacion.onchange = cambioNotificacion;
slectImagenes.on("change", seleccionarImagen);
cargadorImagen.on("change", cargarNuevaImagen);

formulario.on("submit", generarNotificacion);

const storageRef = storage.ref("centro_notificaciones");
const fireRef = firestore.collection("centro_notificaciones");

let notificaciones = [];

const summernoteOptions = {
  fontNames: [
    "Arial",
    "Arial Black",
    "Comic Sans MS",
    "Courier New",
    "Times New Roman",
    "Helvetica",
    "Impact",
  ],
  styleTags: [
    "p",
    // {title: 'pequeña', tag: 'h6', value: 'h6'},
    { title: "Título", tag: "h4", value: "h4" },
    { title: "Sub-título", tag: "h5", value: "h5" },
  ],
  toolbar: [
    ["style", ["style"]],
    [
      "config",
      [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "superscript",
        "subscript",
      ],
    ],
    ["font", ["fontsize", "fontname"]],
    ["color", ["color"]],
    ["paragraph", ["ul", "ol", "paragraph", "height", "fullscreen"]],
    ["insert", ["link"]], // Agregado aquí
  ],
  lang: "es-ES",
};

$("#mensaje-centro_notificaciones").summernote(summernoteOptions);

listarImagenes();
function listarImagenes() {
  storageRef.listAll().then((res) => {
    slectImagenes.html("<option value>-- Lista imágenes --</option>");
    res.items.forEach(async (item) => {
      const name = item.name;
      const path = await item.getDownloadURL();
      slectImagenes.append(`<option value="${path}">${name}</option>`);
    });
  });
}

function cambioNotificacion(e) {
  const val = e.target.value;
  console.log(val);

  //cambio botones

  if (val !== "nueva") {
    botonNotificacion.innerHTML = "Editar notificación";
    const notificacion =
      notificaciones.find((notificacion) => notificacion.id === val) || null;
    console.log(notificacion);

    idsCheckboxMarcados = notificacion.usuarios || [];

    if (notificacion == null) {
      mostradorUsuariosNoti.classList.add("d-none");
      botonesInputUserNoti.classList.add("d-none");
      mostradorUsuariosNoti.classList.remove("d-flex");

      for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
      }

      $("#mensaje-centro_notificaciones").summernote("code", "");

      return;
    }

    inputs.forEach((input) => {
      if (input.type == "file") {
        input.value = null;
      } else {
        input.value = notificacion[input.name];
      }
    });

    $("#mensaje-centro_notificaciones").summernote(
      "code",
      notificacion.mensaje
    );

    if (!notificacion.isGlobal) {
      console.log(mostradorUsuariosNoti);
      mostradorUsuariosNoti.classList.add("d-flex");
      mostradorUsuariosNoti.classList.remove("d-none");
      inputBuscador.classList.remove("d-none");
      mostradorUsuariosNotiUsers.innerHTML = "";
      if (mostradorUsuariosNotiUsers.innerHTML == "") {
        crearCheckboxes(centros);
      }
      botonesInputUserNoti.classList.remove("d-none");
    } else {
      mostradorUsuariosNoti.classList.add("d-none");
      botonesInputUserNoti.classList.add("d-none");
      mostradorUsuariosNoti.classList.remove("d-flex");
    }
  } else {
    mostradorUsuariosNoti.classList.add("d-none");
    botonesInputUserNoti.classList.add("d-none");
    mostradorUsuariosNoti.classList.remove("d-flex");
    $("#mensaje-centro_notificaciones").summernote("code", "");
    botonNotificacion.innerHTML = "Generar notificación";
    inputs.forEach((input) => {
      input.value = "";
    });
  }
}

function seleccionarImagen() {
  const val = slectImagenes.val();
  renderizarImagen();
}

function renderizarImagen() {
  previsualizadorImagen.attr(
    "src",
    slectImagenes.val() || rutaPorDefectoPrevisualizador
  );
}

async function cargarNuevaImagen(e) {
  const target = e.target;
  const file = target.files[0];

  await storageRef.child(file.name).put(file);
  listarImagenes();
}

async function generarNotificacion(e) {
  e.preventDefault();

  console.log(e.target);
  const formData = new FormData(e.target);

  const notificacion = {
    icon: ["info", "warning"],
    timeline: new Date().getTime(),
    isGlobal: true,
    active: true,
    allowDelete: true,
  };

  formData.delete("files");
  for (let entrie of formData) {
    const [key, val] = entrie;
    if (["startDate", "endDate"].includes(key)) {
      notificacion[key] = new Date(val + "T00:00:00").getTime();
    } else {
      notificacion[key] = val;
    }
  }

  notificacion.isGlobal = notificacion.isGlobal === "true";
  notificacion.active = notificacion.active === "true";
  notificacion.allowDelete = notificacion.allowDelete === "true";
  notificacion.usuarios = idsCheckboxMarcados;

  if (!notificacion.isGlobal) {
    notificacion.usuarios = obtenerCheckboxesMarcados(centros);
  } else {
    notificacion.usuarios = [];
  }

  console.log(notificacion);

  console.log(selectorNotificacion.value);

  if (selectorNotificacion.value === "nueva") {
    try {
      await fireRef.add(notificacion);
      Toast.fire("Notificación agregada correctamente", "", "success");
      seccionNotificaciones.removeClass("d-none");

      e.target.reset();
      renderizarImagen();
      mostrarNotificaciones();
    } catch (e) {
      Toast.fire("Error", e.message, "error");
    }
  } else {
    try {
      await fireRef
        .doc(selectorNotificacion.value)
        .update(notificacion)
        .then(() => {
          Toast.fire("Notificación actualizada correctamente", "", "success");
          e.target.reset();
          renderizarImagen();
          mostrarNotificaciones();
        });
    } catch (e) {
      Toast.fire("Error", e.message, "error");
    }
  }

  mostradorUsuariosNoti.classList.add("d-none");
  botonesInputUserNoti.classList.add("d-none");
  mostradorUsuariosNoti.classList.remove("d-flex");
  $("#mensaje-centro_notificaciones").summernote("code", "");
  botonNotificacion.innerHTML = "Generar notificación";
  inputs.forEach((input) => {
    input.value = "";
  });
}

const reference = firebase.firestore().collection("usuarios");
let centros = [];

reference
  // .limit(10)
  .get()
  .then((querySnapshot) => {
    console.log(querySnapshot.size);
    querySnapshot.forEach((doc) => {
      centros.push({ id: doc.id, centro_de_costo: doc.data().centro_de_costo });
    });
  })
  .then(() => {
    console.log(centros);
  });

const botonesInputUserNoti = document.querySelector("#botones-inputusernoti");

notificacionGlobal.addEventListener("change", (e) => {
  let valor = e.target.value;
  if (valor == "false") {
    mostradorUsuariosNoti.classList.add("d-flex");
    mostradorUsuariosNoti.classList.remove("d-none");
    inputBuscador.classList.remove("d-none");
    mostradorUsuariosNotiUsers.innerHTML = "";
    if (mostradorUsuariosNotiUsers.innerHTML == "") {
      crearCheckboxes(centros);
    }
    botonesInputUserNoti.classList.remove("d-none");
  } else {
    mostradorUsuariosNoti.classList.add("d-none");
    botonesInputUserNoti.classList.add("d-none");
    mostradorUsuariosNoti.classList.remove("d-flex");
  }
});
mostrarNotificaciones();

console.log(inputBuscador);

let idsCheckboxMarcados = [];

const botonesInputUserNotiAll = document.querySelectorAll(
  "#botones-inputusernoti button"
);

let textoBuscador = "";
let elementosPorPagina = 50;
let paginaActual = 1;

function crearCheckboxes(arreglo) {
  inputBuscador.value = "";

  inputBuscador.addEventListener("input", (e) => {
    obtenerCheckboxesMarcados(centros);

    if (e.target.value.length > 3) {
      elementosPorPagina = arreglo.length;
      mostrarPagina(paginaActual);
    } else {
      elementosPorPagina = 50;
      mostrarPagina(paginaActual);
    }
    textoBuscador = inputBuscador.value.toLowerCase();
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((checkbox) => {
      const etiqueta = checkbox.parentNode;
      const textoEtiqueta = etiqueta.textContent.toLowerCase();
      if (textoEtiqueta.includes(textoBuscador)) {
        etiqueta.style.display = "flex";
      } else {
        etiqueta.style.display = "none";
      }
    });
  });

  botonesInputUserNotiAll[0].addEventListener("click", (e) => {
    e.preventDefault();
    obtenerCheckboxesMarcados(centros);
    paginaActual--;
    mostrarPagina(paginaActual);
  });

  botonesInputUserNotiAll[1].addEventListener("click", (e) => {
    e.preventDefault();
    obtenerCheckboxesMarcados(centros);
    paginaActual++;
    mostrarPagina(paginaActual);
  });

  mostrarPagina(paginaActual);
}

function mostrarPagina(pagina) {
  const inicio = (pagina - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const elementos = centros.slice(inicio, fin);

  mostradorUsuariosNotiUsers.innerHTML = "";
  elementos.forEach((objeto) => {
    const centroDeCosto = objeto.centro_de_costo;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "centrosDeCosto";
    checkbox.value = objeto.id;
    checkbox.checked = idsCheckboxMarcados.includes(objeto.id);
    const etiqueta = document.createElement("label");
    etiqueta.textContent = centroDeCosto;
    etiqueta.style.display = "flex";
    etiqueta.style.flexDirection = "row-reverse";
    etiqueta.style.margin = "10px";
    etiqueta.appendChild(checkbox);
    mostradorUsuariosNotiUsers.appendChild(etiqueta);
  });

  const checkboxes = document.querySelectorAll("input[type='checkbox']");

  checkboxes.forEach((checkbox) => {
    const etiqueta = checkbox.parentNode;
    const textoEtiqueta = etiqueta.textContent.toLowerCase();
    if (textoEtiqueta.includes(textoBuscador)) {
      etiqueta.style.display = "flex";
    } else {
      etiqueta.style.display = "none";
    }
  });

  botonesInputUserNotiAll[0].disabled = pagina === 1;
  botonesInputUserNotiAll[1].disabled = fin >= centros.length;
}

function obtenerCheckboxesMarcados(arreglo) {
  const checkboxes = document.querySelectorAll("input[name='centrosDeCosto']");

  const noMarcados = Array.from(checkboxes)
    .filter((objeto) => !objeto.checked)
    .map((objeto) => objeto.value);

  const idsMarcados = Array.from(checkboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  const idsObjetosMarcados = arreglo
    .filter((objeto) => idsMarcados.includes(objeto.id))
    .map((objeto) => objeto.id);

  idsCheckboxMarcados.push(...idsObjetosMarcados);
  idsCheckboxMarcados = idsCheckboxMarcados.filter(
    (value) => !noMarcados.includes(value)
  );
  idsCheckboxMarcados = idsCheckboxMarcados.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });

  console.log(idsCheckboxMarcados);
  return idsCheckboxMarcados;
}

function mostrarNotificaciones() {
  fireRef
    .get()
    .then((q) => {
      visorNotificaciones.html("");
      
      if (q.size === 0) {
        return;
      }

      q.forEach((d) => {
        const data = d.data();

        if (data.endDate < new Date().getTime()) {
          alertarVencimientoNotificacion(data);
        }

        data.id = d.id;
        data.startDate = convertirFecha(data.startDate);
        data.endDate = convertirFecha(data.endDate);
        visorNotificaciones.append(visualizarNotificacion(data));


        seccionNotificaciones.removeClass("d-none");

        if (
          notificaciones.find((notificacion) => notificacion.id === data.id)
        ) {
          const index = notificaciones.findIndex(
            (notificacion) => notificacion.id === data.id
          );
          notificaciones[index] = data;
        } else {
          notificaciones.push(data);
        }
      });
      console.log(notificaciones);
      activarAccion($("[data-action]", visorNotificaciones));
    })
    .then(() => selectorNotificaciones(notificaciones));
}


function convertirFecha(inputfecha) {
  const fecha = new Date(inputfecha);
  const fechaFormateada = fecha.toISOString().substring(0, 10);
  return fechaFormateada;
}

function selectorNotificaciones(notificaciones) {
  selectorNotificacion.innerHTML = "";
  let opciones = notificaciones
    .map((notificacion) => {
      return `<option value="${notificacion.id}">${notificacion.name}</option>`;
    })
    .join("");
  selectorNotificacion.innerHTML = opciones;

  // Crear una nueva opción
  const opcionPorDefecto = document.createElement("option");
  opcionPorDefecto.text = "--Nueva notificación--";
  opcionPorDefecto.value = "nueva";

  // Insertar la nueva opción al principio del elemento select
  selectorNotificacion.insertBefore(
    opcionPorDefecto,
    selectorNotificacion.firstChild
  );
  selectorNotificacion.selectedIndex = 0;
}

function alertarVencimientoNotificacion(notificacion) {
  const {name, endDate} = notificacion;
  const strFecha = convertirFecha(endDate);

  const message = `La notificación "${name}" ya se encuentra vencida desde la fecha ${strFecha}, por favor, elimínela o extienda la fecha de vencimiento.`;
  
  Swal.fire("Notificación vencida", message, "warning");
}

function activarAccion(els) {
  els.each((i, el) => {
    const accion = el.getAttribute("data-action");
    el.addEventListener("click", acciones[accion]);
  });
}

const acciones = {
  eliminarNotificacion: (e) => {
    const target = e.target;
    const id = target.parentNode.id;

    fireRef
      .doc(id)
      .delete()
      .then(() => mostrarNotificaciones())
      .catch((e) => Toast.fire("Error al eliminar", e.message, "error"));
  },
  vistaPrevia: (e) => {
    const target = e.target;
    const id = target.parentNode.id;

    fireRef
    .doc(id)
    .get()
    .then(d => {
      const data = d.data();
      switch(data.type) {
        case "alerta":
          mostrarNotificacionAlertaUsuario(data, d.id);
        break;
        
        case "estatica":
          data.ubicacion = "visor-notificaciones_estaticas";
          mostrarNotificacionEstaticaUsuario(data, d.id);
          setTimeout(() => {
            $(".mostrador-notificacion-estatica").remove();
          }, 5000);
        break;

        default:
          Swal.fire("No contemplado", "Tipo de alerta no contemplada para vista previa en admin", "warning");
        break;
      }
    });
  },
};
