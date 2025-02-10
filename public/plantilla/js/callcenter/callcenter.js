// MANEJADOR DE FILTROS
const choices = new Choices("#activador_busq_callcenter", {
  removeItemButton: true,
});

$("#filtrado-callcenter").on("change", function () {
  // $("#input-filtrado-callcenter").prop("disabled", true);
  if ($("#filtrado-callcenter").val() == "CENTRO-COSTO") {
    $("#input-filtrado-callcenter").prop(
      "placeholder",
      "Escriba los centros de costo separados por comas (,)"
    );
    $("#input-filtrado-callcenter").prop("disabled", false);
    $("#input-filtrado-callcenter").val("");
    choices.enable();
  } else if ($("#filtrado-callcenter").val() == "GUIAS") {
    $("#input-filtrado-callcenter").prop(
      "placeholder",
      "Escriba las guias separados por comas (,)"
    );
    $("#input-filtrado-callcenter").prop("disabled", false);
    $("#input-filtrado-callcenter").val("");
    choices.disable();
  } else {
    $("#input-filtrado-callcenter").prop("placeholder", "");
    $("#input-filtrado-callcenter").prop("disabled", true);
    $("#input-filtrado-callcenter").val("");
    choices.enable();
  }
});

// genFecha()
// console.log(Date.parse('2024-01-08'.replace(/\-/g, '/')))

/////////////////////////////////

let diasEntreFechas = function (inicio, final) {
  let dia_actual = inicio;
  let fechas = [];
  while (dia_actual.isSameOrBefore(final)) {
    fechas.push(dia_actual.format("YYYY-MM-DD"));
    dia_actual.add(1, "days");
  }
  return fechas;
};

async function GuardarDatosInforme(dataInforme) {
  // SE REVISA SI EL DOC EXISTE
  if (dataInforme.resTransportadora == "") {
    return false;
  }
  const id = Date.parse(genFecha().replace(/\-/g, "/"));
  let docRef = firebase
    .firestore()
    .collection("informesHeka")
    .doc(id.toString());
  docRef.get().then(async (doc) => {
    // SI NO EXISTE EL DOCUMENTO LO CREA
    if (!doc.exists) {
      let startData = {
        timedate: id,
        fecha: genFecha(),
        callcenter: [],
      };
      await docRef.set(startData).then(console.log("se creo correctamente"));
    }
    // UNA VEZ CREADO SUBE LA DATA DEL MOVIMIENTO PARA POSTERIORMENTE SER USADO DESCARGANDO EL EXCEL
    await docRef
      .update({
        callcenter: firebase.firestore.FieldValue.arrayUnion(dataInforme),
      })
      .then(console.log("se actualizo correctamente"));
  });
}

async function DescargarInformeCallcenter() {
  const transportadoraFiltrada = $("#filtro-transportadoras-informe").val();
  const sellersFiltrada = $("#filtro-seller-informe").val().split(",");
  console.log(sellersFiltrada);
  const checkboxInformeGestionadas = document.getElementById(
    "checkboxInformeGestionadas"
  ).checked;
  let desde = moment(value("informe-callcenter-fecha-inicio"));
  let hasta = moment(value("informe-callcenter-fecha-final"));
  let results = diasEntreFechas(desde, hasta);
  let dataExcel = [];
  let ultimaConsulta = results.length - 1;

  await results.forEach(async (date, i) => {
    const id = Date.parse(date.replace(/\-/g, "/"));
    // Obtenemos la referencia del doc en Firebase
    let docRef = firebase
      .firestore()
      .collection("informesHeka")
      .doc(id.toString());
    // Actualizamos el doc en Firebase
    await docRef
      .get()
      .then(function (doc) {
        if (doc.exists) {
          let arrayUpdated = doc.data().callcenter.filter((data) => {
            if (
              sellersFiltrada.includes(data.centro_de_costo) &&
              data.descargada == checkboxInformeGestionadas
            ) {
              dataExcel.push(data);
              data.descargada = true;
            } else if (
              data.transportadora == transportadoraFiltrada &&
              data.descargada == checkboxInformeGestionadas
            ) {
              dataExcel.push(data);
              data.descargada = true;
            } else if (
              transportadoraFiltrada == "" &&
              sellersFiltrada == "" &&
              data.descargada == checkboxInformeGestionadas
            ) {
              dataExcel.push(data);
              data.descargada = true;
            }
            return data;
          });
          if (arrayUpdated.length) {
            docRef
              .update({ callcenter: arrayUpdated })
              .then(console.log("se actualizo correctamente"));
          }
        } else {
          console.log("No se encontró el documento");
        }
      })
      .then(() => {
        if (ultimaConsulta === i) {
          if (!dataExcel.length) {
            Toast.fire(
              "No hay informacion para descargar",
              "Intenta consultar otra fecha o transportadora",
              "error"
            );
            return false;
          }
          let arrData =
            typeof dataExcel != "object" ? JSON.parse(dataExcel) : dataExcel;

          let encabezado = [
            ["NUMERO GUIA", "_numGuia"],
            ["TRANSPORTADORA", "_Transportadora"],
            ["CENTRO DE COSTO", "_CentroCosto"],
            ["SOLICITUD", "_solicitud"],
          ];

          let newDoc = arrData.map((dat, i) => {
            let d = new Object();

            encabezado.forEach(([headExcel, fromData]) => {
              if (fromData === "_numGuia") {
                fromData = dat.guia;
              }

              if (fromData === "_CentroCosto") {
                fromData = dat.centro_de_costo;
              }

              if (fromData === "_solicitud") {
                fromData = dat.resTransportadora;
              }

              if (fromData === "_Transportadora") {
                fromData = dat.transportadora;
              }

              d[headExcel] = dat[fromData] || fromData;
            });
            return d;
          });

          crearExcel(
            newDoc,
            "Informe Callcenter " +
              value("informe-callcenter-fecha-inicio") +
              " hasta " +
              value("informe-callcenter-fecha-final")
          );
        }
      });
  });
}

$("#descargarInformeCallcenter").click(() => {
  DescargarInformeCallcenter();
});

document
  .getElementById("btn-revisar-callcenter")
  .addEventListener("click", (e) => {
    e.preventDefault();
    const novedades_transportadora = $("#activador_busq_callcenter").val();
    const filtro_callcenter = $("#filtrado-callcenter").val();
    if (
      administracion &&
      novedades_transportadora &&
      filtro_callcenter === ""
    ) {
      revisarNovedadesCallcenter(novedades_transportadora);
    } else {
      if (administracion && !$("#filtrado-callcenter").val()) {
        swal.fire(
          "No permitido",
          "Recuerda por favor filtrar por guía o por usuario para esta opción",
          "error"
        );
        return;
      }
      revisarMovimientosGuiasCallcenter(administracion);
    }
  });

function revisarNovedadesCallcenter(transportadora) {
  novedadesExcelData = [];

  const cargadorClass = document.getElementById(
    "cargador-callcenter"
  ).classList;
  cargadorClass.remove("d-none");
  const transportadoraSi = false;
  const usuarios = new Set();
  firebase
    .firestore()
    .collectionGroup("estadoGuias")
    .where("enNovedad", "==", true)
    .where("transportadora", "in", transportadora)
    .get()
    .then((q) => {
      let contador = 0;
      let size = q.size;
      console.log(size);

      if (!size) cargadorClass.add("d-none");

      q.forEach((d) => {
        console.log(d.data());
        let path = d.ref.path.split("/");
        let dato = d.data();
        contador++;

        usuarios.add(path[1]);

        consultarGuiaFbCallcenter(
          path[1],
          d.id,
          dato,
          dato.centro_de_costo,
          contador,
          size
        );
      });

      if (revisarTiempoGuiasActualizadas()) return;

      //   usuarios.forEach(actualizarEstadosEnNovedadUsuario);

      localStorage.last_update_novedad = new Date();
    });
}

function revisarMovimientosGuiasCallcenter(admin, seguimiento, id_heka, guia) {
  novedadesExcelData = [];

  let filtro = true,
    toggle = "==",
    buscador = "enNovedad";
  const cargadorClass = document.getElementById(
    "cargador-callcenter"
  ).classList;
  cargadorClass.remove("d-none");

  if ($("#filtrado-callcenter").val() === "GUIAS" && admin) {
    let filtrado = $("#input-filtrado-callcenter").val().split(",");
    filtrado.forEach((v, i) => {
      firebase
        .firestore()
        .collectionGroup("estadoGuias")
        .where("numeroGuia", "==", v.trim())
        .get()
        .then((querySnapshot) => {
          querySnapshot.size == 0
            ? $("#cargador-callcenter").addClass("d-none")
            : "";
          querySnapshot.forEach((doc) => {
            let path = doc.ref.path.split("/");
            let data = doc.data();
            consultarGuiaFbCallcenter(
              path[1],
              doc.id,
              data,
              "Consulta Personalizada",
              i + 1,
              filtrado.length
            );
          });
        });
    });
  } else if (
    $("#filtrado-callcenter").val() === "CENTRO-COSTO" &&
    $("#activador_busq_callcenter").val().length &&
    admin
  ) {
    console.log("entre al que no era");
    filtro = $("#input-filtrado-callcenter").val().split(",");
    toggle = "==";
    buscador = "centro_de_costo";
    transportadora = $("#activador_busq_callcenter").val();
    filtro.forEach((v, i) => {
      firebase
        .firestore()
        .collectionGroup("estadoGuias")
        .where(buscador, toggle, v)
        .where("enNovedad", "==", true)
        .where("transportadora", "in", transportadora)
        .get()
        .then((querySnapshot) => {
          querySnapshot.size == 0
            ? $("#cargador-callcenter").addClass("d-none")
            : "";
          let size = querySnapshot.size;
          querySnapshot.forEach((doc) => {
            let path = doc.ref.path.split("/");
            let dato = doc.data();
            consultarGuiaFbCallcenter(
              path[1],
              doc.id,
              dato,
              dato.centro_de_costo,
              i + 1,
              size
            );
            // console.log(doc.data());
          });
        });
    });
  } else {
    console.log("entre al que era");
    filtro = $("#input-filtrado-callcenter").val().split(",");
    filtro.forEach((v, i) => {
      firebase
        .firestore()
        .collectionGroup("estadoGuias")
        .where("centro_de_costo", "==", v.trim())
        .where("enNovedad", "==", true)
        .get()
        .then((querySnapshot) => {
          let size = querySnapshot.size;
          querySnapshot.forEach((doc) => {
            let path = doc.ref.path.split("/");
            let dato = doc.data();
            console.log(dato);
            consultarGuiaFbCallcenter(
              path[1],
              doc.id,
              dato,
              dato.centro_de_costo,
              i + 1,
              size
            );
          });
        })
        .finally(() => {
          $("#cargador-callcenter").addClass("d-none");
        });
    });
  }
}

function consultarGuiaFbCallcenter(
  id_user,
  id,
  data,
  usuario = "Movimientos",
  contador,
  total_consulta
) {
  //Cuando Id_user existe, id corresponde a el id_heka, cuando no, corresponde al número de gíia
  if (id_user) {
    firebase
      .firestore()
      .collection("usuarios")
      .doc(id_user)
      .collection("guias")
      .doc(id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          tablaCallcenter(data, doc.data(), usuario, id, id_user);
        }
      })
      .then(() => {
        if (contador == total_consulta) {
          $("#cargador-callcenter").addClass("d-none");
          let table = $(
            "#tabla-estadoGuiasCallcenter-" + usuario.replace(/\s/g, "")
          );

          table = table.DataTable();
        }
      });
  } else {
    firebase
      .firestore()
      .collectionGroup("guias")
      .where("numeroGuia", "==", id)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          let path = doc.ref.path.split("/");
          tablaCallcenter(data, doc.data(), usuario, path[3], path[1]);
        });
      })
      .then(() => {
        if (contador == total_consulta) {
          $("#cargador-callcenter").addClass("d-none");
        }
      });
  }
}

$("#btn-vaciar-consulta-callcenter").click(() => {
  $("#visor_callcenter").html("");
});

function tablaCallcenter(data, extraData, usuario, id_heka, id_user) {
  generarSegundaVersionMovimientoGuias(data);
  const ultimo_movimiento = data.movimientos[data.movimientos.length - 1];

  novedadesExcelData.push({ extraData, data });

  //Preparon los componentes necesarios
  let card = document.createElement("div"),
    encabezado = document.createElement("a"),
    cuerpo = document.createElement("div"),
    table = document.createElement("table"),
    thead = document.createElement("thead"),
    tbody = document.createElement("tbody"),
    tr = document.createElement("tr"),
    ul = document.createElement("ul");

  card.classList.add("card", "mt-5");
  ul.classList.add("list-group", "list-group-flush");

  encabezado.setAttribute(
    "class",
    "card-header d-flex justify-content-between"
  );
  encabezado.setAttribute("data-toggle", "collapse");
  encabezado.setAttribute("role", "button");
  encabezado.setAttribute("aria-expanded", "true");

  cuerpo.setAttribute("class", "card-body collapse table-responsive");

  //

  table.classList.add("table");
  table.setAttribute(
    "id",
    "tabla-estadoGuiasCallcenter-" + usuario.replace(/\s/g, "")
  );
  thead.classList.add("text-light", "bg-primary");
  const classHead = "text-nowrap";
  thead.innerHTML = `<tr>
            
            <th class="${classHead}">Guía</th>
            <th class="${classHead}">Acción</th>
            <th class="${classHead}">Novedad</th>
            <th class="${classHead}">Transportadora</th>
            <th class="${classHead}">Fecha de novedad</th>
            <th class="${classHead}">Tiempo</th>
            <th class="${classHead}">Tiempo en Gestión</th>
            <th class="${classHead}">Fecha de envío</th>
            <th class="${classHead}">Estado</th>
            <th class="${classHead}">Nombre</th>
            <th class="${classHead}">Dirección</th>
            <th class="${classHead}">Números</th>
            <th class="${classHead}">Destino</th>
            <th class="${classHead}">Movimiento</th>
            <th class="${classHead}">Gestión</th>
            <th class="${classHead}">Fech. Ult. Gestión</th>
            
        </tr>`;

  encabezado.setAttribute(
    "href",
    "#estadoGuiasCallcenter-" + usuario.replace(/\s/g, "")
  );
  encabezado.setAttribute(
    "aria-controls",
    "estadoGuiasCallcenter-" + usuario.replace(/\s/g, "")
  );
  encabezado.textContent = usuario;
  cuerpo.setAttribute(
    "id",
    "estadoGuiasCallcenter-" + usuario.replace(/\s/g, "")
  );
  cuerpo.setAttribute("data-usuario", usuario.replace(/\s/g, ""));

  tr.setAttribute("id", "estadoGuiaCallcenter" + data.numeroGuia);

  //Si parece una novedad, el texto lo pinta de rojo
  const momento_novedad = buscarMomentoNovedad(
    data.movimientos,
    data.transportadora
  );
  const ultimo_seguimiento = extraData.seguimiento
    ? extraData.seguimiento[extraData.seguimiento.length - 1]
    : "";
  const millis_ultimo_seguimiento =
    ultimo_seguimiento && extraData.novedad_solucionada
      ? ultimo_seguimiento.fecha.toMillis()
      : new Date();

  const tiempo_en_novedad = diferenciaDeTiempo(
    momento_novedad.fechaMov || new Date(),
    new Date()
  );
  if (
    tiempo_en_novedad > 3 &&
    data.transportadora == "INTERRAPIDISIMO" &&
    !administracion
  )
    return;

  let btnGestionar,
    btn_solucionar = "";
  //Según el tipo de usuario, cambia el botón que realiza la gestión
  btnGestionar = "Revisar";
  btn_solucionar = `
                <button class="btn btn-${
                  extraData.novedad_solucionada ? "secondary" : "success"
                } m-2" 
                id="solucionar-guia-callcenter-${data.numeroGuia}">
                    ${
                      extraData.novedad_solucionada
                        ? "Solucionada"
                        : "Solucionar"
                    }
                </button>
            `;

  tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    ${data.numeroGuia}
                    <i id="actualizar-guia-callcenter-${
                      data.numeroGuia
                    }" class="fa fa-sync ml-1 text-primary" title="Actualizar guía ${
    data.numeroGuia
  }" style="cursor: pointer"></i>
                </div>
            </td>

            <td class="row justify-content-center">
                <button class="btn btn-${
                  extraData.novedad_solucionada ? "secondary" : "primary"
                } m-2 " 
                id="gestionar-guia-callcenter-${data.numeroGuia}"
                data-toggle="modal" data-target="#modal-gestionarNovedad"}>
                    ${btnGestionar}
                </button>
                ${btn_solucionar}
            </td>

            <td class="text-danger">${ultimo_movimiento.novedad}</td>
            <td>${data.transportadora || "Servientrega"}</td>
            <td>${
              momento_novedad.fechaMov ? momento_novedad.fechaMov : "No aplica"
            }</td>

            <td class="text-center">
                <span class="badge badge-danger p-2 my-auto">
                    ${tiempo_en_novedad} días
                </span>
            </td>

            <td class="text-center">
                <span class="badge badge-danger p-2 my-auto">
                    ${diferenciaDeTiempo(
                      millis_ultimo_seguimiento,
                      new Date()
                    )} días
                </span>
            </td>

            <td>${data.fechaEnvio}</td>
            <td>${data.estadoActual}</td>
            <td style="min-width:200px; max-width:250px">${
              extraData.nombreD
            }</td>

            <!-- Dirección del destinatario-->
            <td style="min-width:250px; max-width:300px">
                <p>${extraData.direccionD}</p>
            </td>
            
            <td>    
                <a href="https://api.whatsapp.com/send?phone=57${extraData.telefonoD
                  .toString()
                  .replace(/\s/g, "")}" target="_blank">${
    extraData.telefonoD
  }</a>, 
                <a href="https://api.whatsapp.com/send?phone=57${extraData.celularD
                  .toString()
                  .replace(/\s/g, "")}" target="_blank">${
    extraData.celularD
  }</a>
            </td>
            
            <td>${extraData.ciudadD} / ${extraData.departamentoD}</td>
            
            <td>
                ${ultimo_movimiento.descripcionMov}
            </td>
            
            <td style="min-width:250px; max-width:300px">
                ${ultimo_seguimiento.gestion || "No aplica"}
            </td>
            <td>${
              ultimo_seguimiento.fecha
                ? genFecha("LR", ultimo_seguimiento.fecha.toMillis()) +
                  " " +
                  ultimo_seguimiento.fecha
                    .toDate()
                    .toString()
                    .match(/\d\d:\d\d/)[0]
                : "No aplica"
            }</td>
            
        `;

  //si existe la guía en la ventana mostrada la sustituye
  if (document.querySelector("#estadoGuiaCallcenter" + data.numeroGuia)) {
    document.querySelector(
      "#estadoGuiaCallcenter" + data.numeroGuia
    ).innerHTML = "";
    document.querySelector(
      "#estadoGuiaCallcenter" + data.numeroGuia
    ).innerHTML = tr.innerHTML;
  } else if (
    document.querySelector(
      "#estadoGuiasCallcenter-" + usuario.replace(/\s/g, "")
    )
  ) {
    // console.log(document.querySelector("#estadoGuias-" + usuario.replace(/\s/g, "")).querySelector("tbody"))
    $("#tabla-estadoGuiasCallcenter-" + usuario.replace(/\s/g, ""))
      .DataTable()
      .destroy();
    document
      .querySelector("#estadoGuiasCallcenter-" + usuario.replace(/\s/g, ""))
      .querySelector("tbody")
      .appendChild(tr);
  } else {
    tbody.appendChild(tr);
    table.append(thead, tbody);
    let mensaje = document.createElement("p");

    mensaje.classList.add("text-center", "text-danger");
    mensaje.innerHTML = "Tiempo óptimo de solución: 24 horas";
    cuerpo.append(mensaje, table);
    card.append(encabezado, cuerpo);
    console.log(card);
    document.getElementById("visor_callcenter").appendChild(card);

    //logica para borrar los elementos del localstorage

    let localStorageItems = localStorage;

    const keys = Object.keys(localStorageItems);

    const filteredItems = keys.filter((key) => key.startsWith("tiempoguia"));

    console.log(filteredItems);

    filteredItems.forEach((key) => {
      const value = localStorageItems.getItem(key);
      const fecha = new Date(value);
      const fechamil = fecha.getTime();
      const fechaactual = new Date();
      console.log(fechaactual.getTime() - fechamil);

      if (21600000 - fechaactual.getTime() - fechamil >= 1) {
        localStorage.removeItem(key);
      }
    });
  }

  const boton_solucion = $("#solucionar-guia-callcenter-" + data.numeroGuia);

  $("#gestionar-guia-callcenter-" + data.numeroGuia).click((e) => {
    const id = e.target.id;

    const match = id.match(/gestionar-guia-.*-(\d+)$/);

    if (match) {
      const numeroFinal = match[1];
      window.location.href = `https://prod.hekaentrega.co/rastrea-tu-envio?guide=${numeroFinal}&admin=true`;
    } else {
      console.log("No se encontró un número en el ID");
    }
    return;
    extraData.id_heka = id_heka;
    gestionarNovedadModal(data, extraData, boton_solucion);
  });

  const boton_actualizar = $("#actualizar-guia-callcenter-" + data.numeroGuia);

  boton_actualizar.click(async (e) => {
    const resp = await actualizarEstadoGuia(data.numeroGuia, id_user, true);
    console.log(resp);
    if (resp.guias_est_actualizado === 1 && resp.guias_con_errores === 0) {
      Toast.fire(
        "Guía actualizada",
        "La guía Número " + data.numeroGuia + " ha sido actualizada",
        "success"
      );
    } else if (
      resp.guias_est_actualizado === 0 &&
      resp.guias_con_errores === 1
    ) {
      Toast.fire(
        "Guía no actualizada",
        "La guía Número " + data.numeroGuia + " no ha sido actualizada",
        "error"
      );
    }

    revisarMovimientosGuias(true, null, null, data.numeroGuia);
  });

  boton_solucion.click(async () => {
    await gestionarRespuestaCallCenter(
      boton_solucion,
      data,
      extraData,
      id_heka,
      id_user
    );
  });
}

async function gestionarRespuestaCallCenter(
  boton_solucion,
  data,
  extraData,
  id_heka,
  id_user
) {
  $("#modal-gestionarNovedad").modal("hide");

  const html_btn = boton_solucion.html();
  boton_solucion.html(`
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Cargando...
          `);

  let { value: respuestaSeller } = await Swal.fire({
    title: "Respuesta llamada",
    input: "textarea",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: `Cancelar`,
  });
  let text;
  let resTransportadora;
  if (respuestaSeller) {
    let { value: res } = await Swal.fire({
      title: "Respuesta",
      html: `
                    <textarea placeholder="Escribe tu mensaje" id="respuesta-novedad" class="form-control"></textarea>
                    <div id="posibles-respuestas"></div>
                `,
      inputPlaceholder: "Escribe tu mensaje",
      inputAttributes: {
        "aria-label": "Escribe tu respuesta",
      },
      didOpen: respondiendoNovedad,
      preConfirm: () => document.getElementById("respuesta-novedad").value,
      showCancelButton: true,
    });

    text = res;
    if (text) {
      let { value: resT } = await Swal.fire({
        title: "Gestion para transportadora",
        input: "textarea",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: `Cancelar`,
      });
      resTransportadora = resT;
    }
  }

  if (text == undefined || respuestaSeller == undefined) {
    boton_solucion.html(html_btn);
  } else if (text) {
    text = text.trim();
    const dataInforme = {
      centro_de_costo: extraData.centro_de_costo,
      guia: extraData.numeroGuia,
      transportadora: data.transportadora,
      fecha: new Date(),
      resTransportadora: resTransportadora.trim(),
      descargada: false,
    };
    const solucion = {
      gestion:
        '<b>La transportadora "' +
        data.transportadora +
        '" responde lo siguiente:</b> ' +
        text.trim(),
      respuestaSeller:
        "<b>El destinatario responde lo siguiente: </b> " +
        respuestaSeller.trim(),
      fecha: new Date(),
      gestionada: "Callcenter",
      admin: true,
      type: "Individual",
    };
    Toast.fire("Se enviará mensaje al usuario", text, "info");
    if (extraData.seguimiento) {
      extraData.seguimiento.push(solucion);
    } else {
      extraData.seguimiento = new Array(solucion);
    }

    const mensajePreguardado = listaRespuestasNovedad.findIndex(
      (l) => l.mensaje.toLowerCase() == text.toLowerCase()
    );

    if (mensajePreguardado == -1) {
      listaRespuestasNovedad.push({
        cantidad: 1,
        mensaje: text,
      });
    } else {
      listaRespuestasNovedad[mensajePreguardado].cantidad++;
    }

    const referenciaGuia = firebase
      .firestore()
      .collection("usuarios")
      .doc(id_user)
      .collection("guias")
      .doc(id_heka);

    // Para guardar una nueva estructura de mensaje
    db.collection("infoHeka")
      .doc("respuestasNovedad")
      .update({ respuestas: listaRespuestasNovedad });

    referenciaGuia
      .update({
        seguimiento: extraData.seguimiento,
        novedad_solucionada: true,
      })
      .then(() => {
        firebase.firestore().collection("notificaciones").doc(id_heka).delete();

        enviarNotificacion({
          visible_user: true,
          user_id: id_user,
          id_heka: extraData.id_heka,
          mensaje:
            "Respuesta a Solución de la guía número " +
            extraData.numeroGuia +
            ": " +
            text.trim(),
          href: "novedades",
        });
        console.log("debe entrar a informe");
        GuardarDatosInforme(dataInforme);

        boton_solucion.html("Solucionada");
      });
  } else {
    console.log("No se envió mensaje");
    // return
    referenciaGuia
      .update({
        novedad_solucionada: true,
      })
      .then(() => {
        firebase.firestore().collection("notificaciones").doc(id_heka).delete();
        boton_solucion.html("Solucionada");
        Toast.fire(
          "Guía Gestionada",
          "La guía " +
            data.numeroGuia +
            " ha sido actualizada exitósamente como solucionada",
          "success"
        );
      });
  }
}
