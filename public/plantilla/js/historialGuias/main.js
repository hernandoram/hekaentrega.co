// import { firestore as db } from "../config/firebase.js";
import SetHistorial from "./historial.js";
import { defFiltrado, defineFilter } from "./config.js";
import { renderInfoFecha } from "./views.js";

const db = firebase.firestore();

const btnActvSearch = $("#btn_actv_search-guias_hist");
const btnSearch = $("#btn_buscar-guias_hist");
const inpFechaInicio = $("#fecha_inicio-guias_hist");
const inpFechaFinal = $("#fecha_final-guias_hist");
const inpNumeroGuia = $("#numeroGuia-guias_hist");
const alerta = $("#alerta_novedad-guias_hist");
btnActvSearch.click(toggleBuscador);
btnSearch.click(consultarHistorialGuias);

const id_user = localStorage.user_id;
const guiasRef = db.collection("usuarios").doc(id_user)
.collection("guias");


const historial = new SetHistorial();
historial.includeFilters();
globalThis.h = historial;


let historialConsultado;
const fechas = new Watcher();
fechas.watch(renderInfoFecha);

consultarHistorialGuias();
async function consultarHistorialGuias() {
    const fecha_inicio = new Date(inpFechaInicio.val()).setHours(0) + 8.64e7;;
    const fecha_final = new Date(inpFechaFinal.val()).setHours(0) + (2 * 8.64e7);

    fechas.change([fecha_inicio, fecha_final, inpNumeroGuia.val()]);
    historial.clean(defFiltrado.novedad);

    if(historialConsultado) historialConsultado();

    let reference = ControlUsuario.esPuntoEnvio
    ? db.collectionGroup("guias")
    .where("id_punto", "==", user_id) 
    : guiasRef;

    if(inpNumeroGuia.val()) {
        reference = reference
        .where("numeroGuia", "==", inpNumeroGuia.val());
    } else {
        reference = reference
        .orderBy("timeline", "desc")
        .startAt(fecha_final).endAt(fecha_inicio)
    }

    historialConsultado = reference
    .onSnapshot(snapshot => {
        
        snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const id = data.id_heka;
            data.row_id = "historial-guias-row-" + id;
            historial.guiasNeutras.add(id);

            if(change.type === "added" || change.type === "modified") {
                data.deleted ? historial.delete(id) : historial.add(data);
            }

            if(inpNumeroGuia.val()) {
                const filt = defineFilter(data);
                $(`[data-filter="${filt}"]`).click();
            }

        });
        console.log(historial.filtrador);
        historial.filter(historial.filtrador);
        // historial.render();
    });

  
}

cargarNovedades();
async function cargarNovedades() {
    const novedades = await guiasRef.where("enNovedad", "==", true)
    .get().then(querySnapshot => {
        console.log(querySnapshot.size);
        $(".mostrar-cantidad_novedades").text(querySnapshot.size);
        const novedades = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();

            const id = data.id_heka;
            data.row_id = "historial-guias-row-" + id;

            data.deleted ? historial.delete(id) : historial.add(data);

            if(!data.deleted) novedades.push(data);
        })

        listaNovedadesEncontradas = novedades;
        mostrarAlertaNovedades({
            contador: novedades.length
        });

    });

    historial.filter(historial.filtrador);   
}

let texto_inicial_alerta = alerta.html();
function mostrarAlertaNovedades(obj) {
    if(!obj.contador) return;

    alerta.removeClass("d-none");
    const exp = /\{(\w+)\}/g;
    let nuevo_texto = texto_inicial_alerta; 

    let x;
    while(x = exp.exec(texto_inicial_alerta)) {
        nuevo_texto = nuevo_texto.replace(x[0], obj[x[1]]);
    }

    alerta.html(nuevo_texto);
    $(".ver-novedades").on("click", () => $("#filter_novedad-guias_hist").click());
}

function toggleBuscador() {
    const cont = $("#filtrado-guias_hist");
    cont.toggle("fast");
}

globalThis.historialGuias = consultarHistorialGuias;