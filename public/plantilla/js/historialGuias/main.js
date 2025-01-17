// import { firestore as db } from "../config/firebase.js";
import { 
  db, 
  collection,
  doc,
  getDocs,
  collectionGroup,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  onSnapshot, } from "/js/config/initializeFirebase.js";
import SetHistorial from "./historial.js";
import { defFiltrado, defineFilter } from "./config.js";
import { renderInfoFecha } from "./views.js";
import { Watcher, owerridelistaNovedadesEncontradas } from "/js/render.js";
import { ControlUsuario } from '/js/cargadorDeDatos.js';
import { user_id } from '/js/cargadorDeDatos.js';

const btnActvSearch = $("#btn_actv_search-guias_hist");
const btnSearch = $("#btn_buscar-guias_hist");
const inpFechaInicio = $("#fecha_inicio-guias_hist");
const inpFechaFinal = $("#fecha_final-guias_hist");
const inpNumeroGuia = $("#numeroGuia-guias_hist");
const alerta = $("#alerta_novedad-guias_hist");
btnActvSearch.click(toggleBuscador);
btnSearch.click(consultarHistorialGuias);

const id_user = localStorage.user_id;
const guiasRef = collection(doc(collection(db, "usuarios"), id_user), "guias");

const historial = new SetHistorial();
historial.includeFilters();
globalThis.h = historial;

let historialConsultado;
const fechas = new Watcher();
fechas.watch(renderInfoFecha);

consultarHistorialGuias();
async function consultarHistorialGuias() {
  const fecha_inicio = new Date(inpFechaInicio.val()).setHours(0) + 8.64e7;
  const fecha_final = new Date(inpFechaFinal.val()).setHours(0) + 2 * 8.64e7;

  fechas.change([fecha_inicio, fecha_final, inpNumeroGuia.val()]);
  historial.clean(defFiltrado.novedad);

  // Esperar a que se carguen los datos del usuario
  if (ControlUsuario.dataCompleted.value !== true)
    await ControlUsuario.hasLoaded;

  if (historialConsultado) historialConsultado();

  let reference = ControlUsuario.esPuntoEnvio
    ? query(collectionGroup(db, "guias"), where("id_punto", "==", user_id))
    : guiasRef;

  if (inpNumeroGuia.val()) {
    reference = query(reference, where("numeroGuia", "==", inpNumeroGuia.val()));
  } else {
    reference = query(
      reference,
      orderBy("timeline", "desc"),
      startAt(fecha_final),
      endAt(fecha_inicio)
    );
  }

  historialConsultado = onSnapshot(reference, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();

      const id = data.id_heka;
      data.row_id = "historial-guias-row-" + id;

      // Determinar la transportadora según condiciones
      data.mostrar_transp = data.transpVisible
        ? data.transpVisible
        : data.oficina
        ? data.transportadora + "-Flexii"
        : data.transportadora;

      historial.guiasNeutras.add(id);

      if (change.type === "added" || change.type === "modified") {
        historial.add(data);
      }

      if (inpNumeroGuia.val()) {
        const filt = defineFilter(data);
        $(`[data-filter="${filt}"]`).click();
      }
    });

    console.log(historial.filtrador);
    historial.filter(historial.filtrador);
  });
}

function mostrarNovedades(numeroNovedades) {
  const mostradorNoNovedades = document.getElementById("mostrador-noNovedades");
  const mostradorSiNovedades = document.getElementById("mostrador-SiNovedades");
  if (numeroNovedades > 0) {
    mostradorNoNovedades.classList.add("d-none");
    mostradorSiNovedades.classList.remove("d-none");
    $(".mostrar-cantidad_novedades").text(numeroNovedades);
  } else {
    mostradorNoNovedades.classList.remove("d-none");
    mostradorSiNovedades.classList.add("d-none");
  }
}

cargarNovedades();
async function cargarNovedades() {
  try {
    // Crear una consulta para obtener las guías en novedad
    const novedadesQuery = query(guiasRef, where("enNovedad", "==", true));
    const querySnapshot = await getDocs(novedadesQuery);

    console.log(querySnapshot.size);

    mostrarNovedades(querySnapshot.size);

    const novedades = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      const id = data.id_heka;
      data.row_id = "historial-guias-row-" + id;

      // Determinar si mostrar la transportadora según las condiciones
      data.mostrar_transp = data.transpVisible
        ? data.transpVisible
        : data.oficina
        ? data.transportadora + "-Flexii"
        : data.transportadora;

      data.deleted ? historial.delete(id) : historial.add(data);

      if (!data.deleted) novedades.push(data);
    });

    owerridelistaNovedadesEncontradas(novedades);

    mostrarAlertaNovedades({
      contador: novedades.length,
    });

    historial.filter(historial.filtrador);
  } catch (error) {
    console.error("Error al cargar novedades:", error);
  }
}

let texto_inicial_alerta = alerta.html();
function mostrarAlertaNovedades(obj) {
  if (!obj.contador) return;

  alerta.removeClass("d-none");
  const exp = /\{(\w+)\}/g;
  let nuevo_texto = texto_inicial_alerta;

  let x;
  while ((x = exp.exec(texto_inicial_alerta))) {
    nuevo_texto = nuevo_texto.replace(x[0], obj[x[1]]);
  }

  alerta.html(nuevo_texto);
  $(".ver-novedades").on("click", () =>
    $("#filter_novedad-guias_hist").click()
  );
}

function toggleBuscador() {
  const cont = $("#filtrado-guias_hist");
  cont.toggle("fast");
}

globalThis.historialGuias = consultarHistorialGuias;
