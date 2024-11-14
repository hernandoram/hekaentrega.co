import { v0, v1 } from "../config/api.js";
import { firestore } from "../config/firebase.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { estadosRecepcion, estadoValidado } from "./constantes.js";
import { actualizarEstadoEnvioHeka } from "./crearPedido.js";
import { table as htmlTable, containerQuoterResponse } from "./views.js";


const columns = [
  {
    data: "centro_de_costo",
    title: "Usuario",
    defaultContent: ""
  },
  {
    data: "numeroGuia",
    title: "Envío",
    defaultContent: ""
  },
  {
    data: "peso",
    title: "Peso",
    defaultContent: ""
  },
  {
    data: "alto",
    title: "Alto",
    defaultContent: ""
  },
  {
    data: "ancho",
    title: "Ancho",
    defaultContent: ""
  },
  {
    data: "largo",
    title: "Largo",
    defaultContent: ""
  },
  {
    data: "valorSeguro",
    title: "Seguro de mercancía",
    defaultContent: ""
  },
  {
    data: "valorRecaudo",
    title: "Valor a recaudar",
    defaultContent: ""
  },
  {
    data: "idDaneCiudadDestino",
    title: "Ciudad destino",
    defaultContent: ""
  },
];

const config = {
  destroy: true,
  data: null,
  rowId: "row_id",
  order: [[2, "desc"]],
  columns,
  language: {
    url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
  },
  dom: "Bfrtip",
  buttons: [],
  scrollY: "60vh",
  scrollX: true,
  scrollCollapse: true
}

export default class TablaEnvios {
  dataSelected = [];
  ciudadDestino = null;
  filtrador = null;
  filtradas = [];
  guias = [];
  selectionCityChange = new Watcher(null);
  searchInFilter = [estadosRecepcion.recibido, estadosRecepcion.validado];

  constructor(selectorContainer) {
    const container = $(selectorContainer);
    container.append(htmlTable);

    this.table = $("table", container).DataTable(config);

    this.table.on('click', 'tbody tr', e => {
      if(this.filtrador === estadosRecepcion.recibido) return;

      const currentRowData = this.table.row(e.currentTarget).data();
      if(!this.ciudadDestino) this.ciudadDestino = currentRowData.idDaneCiudadDestino;

      if(currentRowData.idDaneCiudadDestino !== this.ciudadDestino) {
        Toast.fire("", "Debe seleccionar guías hacia la misma ciudad destino", "error");
      } else {
        $(e.currentTarget).toggleClass('selected bg-gray-300');
      }

      if(this.selectionCityChange.value !== this.ciudadDestino) {
        this.selectionCityChange.change(this.ciudadDestino);
      }

      const dataSelected = this.table.rows(".selected").data().toArray();
      
      if(!dataSelected.length) this.ciudadDestino = null;

      this.dataSelected = dataSelected;
      actualizarCotizador(this.dataSelected);
    });
  }

  add(guia) {
    const guias = this.table.data().toArray();
    const gIdx = guias.findIndex((g) => g.id === guia.id);

    if (gIdx === -1) {
      this.table.row.add(guia).draw(false);
    } else {
      const row = this.table.row(gIdx);
      row.data(guia).draw(false);
    }

    if(this.filtrador)
      this.filter(this.filtrador);

  }

  delete(id) {
    const index = this.guias.findIndex((g) => g.id === id);

    if (index !== -1) {
      this.guias.splice(index, 1);
      this.renderTable = true;
    };
  }

  //Según el tipo de filtrado muestra los botones necesarios
  defineButtons(filt) {
    const table = this.table;
    
    table.buttons().remove();
    let indexBtn = 0;

    // Acceptar pedido
    if (filt === estadosRecepcion.recibido) {
      table.button().add(indexBtn, {
        action: generarRelacion.bind(this),
        className: "btn-primary",
        text: "Enviar relación",
      });
      indexBtn++;
      
      table.button().add(indexBtn, {
        action: validarEnvios.bind(this),
        className: "btn-success",
        text: "Validar envíos",
      });
      indexBtn++;
    }
  }

  defineColumns() {
    // No está funcionando como debería (error desconocido)
    const renderizar = () => {
      this.table.columns().every((nCol) => {
        const col = this.table.column(nCol);

        const ver = columnas.includes(nCol);
        const visibilidadPrev = col.visible();

        if (visibilidadPrev != ver) {
          col.visible(ver);
        }
      });
    };

    try {
      renderizar();
    } catch {
      setTimeout(() => {
        renderizar();
      }, 500);
    }
  }

  generalFilter(filt) {
    if(filt === estadosRecepcion.neutro) return this.guias;

    return this.guias.filter((g) => g.estado_recepcion === filt);
  }

  filter(filt) {
    this.filtrador = filt;
    this.filtradas = this.generalFilter(filt);
    this.render(true);

    return this.filtradas;
  }

  render(clear) {
    if (!this.renderTable && !clear) return;

    this.defineButtons(this.filtrador);
    if (clear) {
      this.table.clear();

      this.table.rows.add(this.filtradas);

      // this.defineColumns();
    }

    this.table.draw();

    this.renderTable = false;
  }

  clean(avoid) {
    this.filtradas = [];
    this.guiasNeutras.clear();
    this.guias = respaldo;

    this.render(true);
  }

  async reloadData() {
    await db.collection("envios")
    .where("id_punto", "==", user_id)
    .where("estado_recepcion", "in", this.searchInFilter)
    .get()
    .then(q => {
      this.table.clear().draw(false);
      this.guias = [];
      q.forEach(d => {
        const data = d.data();
        data.id = d.id;
        this.guias.push(data); // Primero hacemos el push global, en caso de que halla un filtrado el "this.add" pueda capturarlo
        this.add(data);
      });
    });
  }
}

async function generarRelacion(e, dt, node, config) {
  const api = dt;

  
  const envios = api.rows().data().toArray();
  
  if(!envios.length) {
    return Swal.fire({
      icon: "warning",
      title: "No hay envíos para relacionar"
    });
  }
  
  const primerEnvio = envios[0]; // De aquí tomamos toda la info base del remitente, ya que en teoría siempre debería ser el mismo
  const {id_user} = primerEnvio;
  
  const l = new ChangeElementContenWhileLoading(e.target);
  l.init();
  
  const relacion = await obtenerRelacion(envios);

  if(relacion.error) {
    l.end();

    return Swal.fire({
      icon: "error",
      title: "Error al generar la relación.",
      text: relacion.body
    });
  }

  const defaultSwalValue = {
    showCancelButton: true,
    confirmButtonText: "Ver Relación",
    cancelButtonText: "Cerrar"
  }

  const actionAfterSwal = res => {if(res.isConfirmed) openPdfFromBase64(relacion.body)};

  const usuario = await findUserById(id_user);

  if(!usuario) {
    l.end();
    const swalData = Object.assign(defaultSwalValue, {
      icon: "info",
      title: "No se puede enviar el correo",
      text: "No se han encontrado los datos del usuario relacionado con los envíos, por lo tanto, no se puede enviar la relación. Se recomienda descargar la información de la relación manualmente"
    });

    return Swal.fire(swalData)
    .then(actionAfterSwal);
  }

  const {contacto, correo} = usuario;


  const dataPdfToSend = JSON.stringify({
    type: "document",
    name_file: "Relación de Envíos.pdf",
    content_file: relacion.body,
    number: contacto.toString(),
    email: correo
  });

  const resPdfSent = await enviarRelacion(dataPdfToSend);

  if(resPdfSent.code === 200) {
    const swalData = Object.assign(defaultSwalValue, {
      icon: "success",
      title: "La relación ha sido enviada correctamente",
      text: resPdfSent.response?.message || ""
    });

    Swal.fire(swalData)
    .then(actionAfterSwal);

  } else {
    const swalData = Object.assign(defaultSwalValue, {
      icon: "error",
      title: "No se ha podido enviar la relación"
    });

    const {message} = resPdfSent;
    if(message && typeof message === "object") {
      swalData.html = `
        <ul>${message.map(m => `<li>${m.message}</li>`).join("")}</ul>
      `;
    } else if (message) {
      swalData.text = message;
    } else {
      swalData.text = "Error desconocido";
    }

    Swal.fire(swalData)
    .then(actionAfterSwal);

  }

  l.end();
}

async function findUserById(id_user) {
  try {
    const usuario = await firestore.collection("usuarios").doc(id_user)
    .get().then(d => d.exists ? d.data() : null);

    return usuario;
  } catch (e) {
    console.error("Error al encontrar usuario: ", e);

    return null;
  }
}

async function obtenerRelacion(envios) {
  const relacion = await fetch(v0.pdfRelacionEnvio, {
    method: "POST",
    headers: {
      "Content-Type": "Application/json"
    },
    body: JSON.stringify({
      ids: envios.map(e => e.id),
      fecha: genFecha(),
      receptor: datos_usuario.centro_de_costo
    })
  })
  .then(d => d.json())
  .catch(e => ({error: true, body: e.message}));

  return relacion;
}

async function enviarRelacion(dataPdfToSend) {
  return fetch(v1.sendDocument, {
    method: "POST",
    headers: {
      "Content-Type": "Application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: dataPdfToSend
  })
  .then(d => d.json())
  .catch(e => console.log("ERROR ENVIANDO PDF: ", e));
}

async function validarEnvios(e, dt, node, config) {
  const api = dt;

  const l = new ChangeElementContenWhileLoading(e.target);
  l.init();

  const envios = api.rows().data().toArray();
  for (let envio of envios) {
    await db.collection("envios")
    .doc(envio.id)
    .update({estado_recepcion: estadosRecepcion.validado});

    await actualizarEstadoEnvioHeka(envio.id, estadoValidado);
  }

  await this.reloadData();

  l.end();
}

const formularioCotizacion = document.getElementById("cotizador-flexii_guia");
formularioCotizacion.addEventListener("change", () => {
  containerQuoterResponse.html("");
})
function actualizarCotizador(envios) {
  containerQuoterResponse.html("");

  if (!envios.length) return formularioCotizacion.reset();
  const totales = {
    weight: 0,
    height: 0,
    width: 0,
    long: 0,
    declaredValue: 0
  }

  envios.forEach((val) => {
    totales.weight += val.peso;
    totales.height += val.alto;
    totales.width += val.ancho;
    totales.long += val.largo;
    totales.declaredValue += val.valorSeguro;
  });

  for (let [key, value] of Object.entries(totales)) {
    const element = formularioCotizacion.elements[key];
    element.value = value;
  }
}