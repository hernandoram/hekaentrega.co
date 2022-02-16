import {idTable} from "./views.js";
import { firestore as db } from "../config/firebase.js";

const id_user = localStorage.user_id;
const guiasRef = db.collection("usuarios").doc(id_user)
.collection("guias");

historial();
async function historial() {
    const fecha_final = new Date().getTime();
    const fecha_inicio = fecha_final - 2.628e+9;

    const guias = await guiasRef
    .orderBy("timeline", "desc")
    .startAt(fecha_final).endAt(fecha_inicio)
    .get().then(querySnapshot => {
        let res = [];
        querySnapshot.forEach(doc => {
            res.push(doc.data());
        });
        return res;
    });


    $("#"+idTable).DataTable({
        destroy: true,
        data: guias,
        order: [[1, "desc"]],
        columns: [
            {data: "id_heka", title: "Id", defaultContent: ""},
            {data: "numeroGuia", title: "Guía transportadora", defaultContent: ""},
            {data: "estado", title: "Estado", defaultContent: ""},
            {data: "mostrar_transp", 
            orderable: false,
            title: "Transportadora", defaultContent: ""},
            {data: "type", title: "Tipo", defaultContent: ""},
            {data: "nombreD", title: "Destinatario", defaultContent: ""},
            {
                data: "telefonoD", title: "Telefonos",
                defaultContent: "", render: (valor,type,row) => {
                    if(type === "display" || type === "filter") {
                        const aCelular1 = `<a class="btn btn-light d-flex align-items-baseline mb-1 action" href="https://api.whatsapp.com/send?phone=57${valor.toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${valor}</a>`;
                        const aCelular2 = `<a class="btn btn-light d-flex align-items-baseline action" href="https://api.whatsapp.com/send?phone=57${row["celularD"].toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${row["celularD"]}</a>`;
                        return aCelular1;
                    }

                    return valor;
                }
            },
            {data: "ciudadD", title: "Ciudad", defaultContent: ""},
            {data: "fecha", title: "Fecha", defaultContent: ""},
            {
                data: "seguro", title: "Seguro", 
                defaultContent: "", render: (value, type, row) => {
                    if(type === "display" || type === "filter") {
                        return value || row["valor"];
                    }

                    return value;
                }
            },
            {
                data: "valor", title: "Recaudo", 
                defaultContent: ""
            },
            {
                data: "costo_envio", title: "Costo de envío", 
                defaultContent: "",
            },
        ],
        language: {
          url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
        },
        dom: 'Bfrtip',
        buttons: [{
            extend: "excel",
            text: "Descargar excel",
            filename: "Historial Guías",
            exportOptions: {
              columns: [1,2,3,4,5,6,7,9,10,11,12,13]
            }
        }, {
            text: "Descargar guías",
            className: "btn btn-primary",
            action: descargarGuiasParticulares
        }, {
            text: "Crear Documentos",
            className: "btn btn-success",
            action: crearDocumentos
        }],
        scrollY: '50vh',
        scrollX: true,
        scrollCollapse: true,
        paging: false,
        lengthMenu: [ [-1, 10, 25, 50, 100], ["Todos", 10, 25, 50, 100] ],
    })
}