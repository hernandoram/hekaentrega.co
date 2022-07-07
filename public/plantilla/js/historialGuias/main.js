// import { firestore as db } from "../config/firebase.js";
import SetHistorial from "./historial.js";
import { defFiltrado } from "./config.js";

const db = firebase.firestore();

const btnActvSearch = $("#btn_actv_search-guias_hist");
const btnSearch = $("#btn_buscar-guias_hist");
const inpFechaInicio = $("#fecha_inicio-guias_hist");
const inpFechaFinal = $("#fecha_final-guias_hist");
const inpNumeroGuia = $("#numeroGuia-guias_hist");
btnActvSearch.click(toggleBuscador);
btnSearch.click(consultarHistorialGuias);

const id_user = localStorage.user_id;
const guiasRef = db.collection("usuarios").doc(id_user)
.collection("guias");


const historial = new SetHistorial();
historial.includeFilters();
globalThis.h = historial;


let historialConsultado;

consultarHistorialGuias();
async function consultarHistorialGuias() {
    const fecha_inicio = Date.parse(inpFechaInicio.val().replace(/\-/g, "/"));
    const fecha_final = Date.parse(inpFechaFinal.val().replace(/\-/g, "/")) + 8.64e7;
    historial.clean(defFiltrado.novedad);

    if(historialConsultado) historialConsultado();

    let reference = guiasRef;
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
              data.row_id = "historial-guias-row" + id;

            if(change.type === "added" || change.type === "modified") {
                data.deleted ? historial.delete(id) : historial.add(data);
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
        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log(data);

            const id = data.id_heka;
            data.row_id = "historial-guias-row" + id;

            data.deleted ? historial.delete(id) : historial.add(data);
        })
    });

    historial.filter(historial.filtrador);
    
}

function toggleBuscador() {
    const cont = $("#filtrado-guias_hist");
    cont.toggle("fast");
}

globalThis.historialGuias = consultarHistorialGuias;