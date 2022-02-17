import "./views.js";
import { firestore as db } from "../config/firebase.js";
import SetHistorial from "./historial.js";

const id_user = localStorage.user_id;
const guiasRef = db.collection("usuarios").doc(id_user)
.collection("guias");

historial();
async function historial() {
    const fecha_final = new Date().getTime();
    const fecha_inicio = fecha_final - 2.628e+9;
    const historial = new SetHistorial();

    guiasRef
    .orderBy("timeline", "desc")
    .startAt(fecha_final).endAt(fecha_inicio)
    .onSnapshot(snapshot => {
        
        snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const id = data.id_heka;
              data.row_id = "historial-guias-row" + id;

            if(change.type === "added" || change.type === "modified") {
                // if(rowFinded.length) {
                //   const row = table.row("#"+data.row_id)
                //   row.data(data);
                //   activarBotonesDeGuias(id, data, true);
                // } else {
                //   redraw = true;
                //   table.row.add(data);
                // }
                historial.add(data);
            } else if (change.type === "removed"){
                // if(rowFinded.length) {
                //     redraw = true;
                //     table.row("#"+data.row_id).remove();
                // }
            }
        });
        historial.render();
    });
    globalThis.h = historial;


    
}