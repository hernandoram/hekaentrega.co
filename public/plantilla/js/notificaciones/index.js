import { firestore, storage } from "../config/firebase.js";
import { visualizarNotificacion } from "./views.js";

const slectImagenes = $("#imageUrl-centro_notificaciones");
const previsualizadorImagen = $("#preview-centro_notificaciones");
const cargadorImagen = $("#cargar_imagen-centro_notificaciones");
const rutaPorDefectoPrevisualizador = previsualizadorImagen.attr("src");
const formulario = $("#form-centro_notificaciones");
const visorNotificaciones = $("#visor-centro_notificaciones");

slectImagenes.on("change", seleccionarImagen);
cargadorImagen.on("change", cargarNuevaImagen);
formulario.on("submit", generarNotificacion);

const storageRef = storage.ref("centro_notificaciones");
const fireRef = firestore.collection("centro_notificaciones");

listarImagenes();
function listarImagenes() {
    storageRef.listAll().then(res => {
        slectImagenes.html("<option value>-- Lista imágenes --</option>");
        res.items.forEach(async item => {
            const name = item.name;
            const path = await item.getDownloadURL();
            slectImagenes.append(`<option value="${path}">${name}</option>`);
        });
    });
}

function seleccionarImagen() {
    const val = slectImagenes.val();
    renderizarImagen();
}

function renderizarImagen() {
    previsualizadorImagen.attr("src", slectImagenes.val() || rutaPorDefectoPrevisualizador);
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
        active: true
    };

    for (let entrie of formData) {
        const [key, val] = entrie;
        if(["startDate", "endDate"].includes(key)) {
            notificacion[key] = new Date(val + "T00:00:00").getTime();
        } else {
            notificacion[key] = val;
        }

    }

    try {
        await fireRef.add(notificacion);
        Toast.fire("Notificación agregada correctamente", "", "success");
    } catch(e) {
        Toast.fire("Error", e.message, "error");
    }
}

mostrarNotificaciones();
function mostrarNotificaciones() {
    fireRef.get().then(q => {
        visorNotificaciones.html("");
        q.forEach(d => {
            visorNotificaciones.append(visualizarNotificacion(d.data()));
        })
    })
}