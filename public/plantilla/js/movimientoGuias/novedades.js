import {
    db,
    collection,
} from "/js/config/initializeFirebase.js";

const btnDescargarGestiones = $("#btn_descargar_gest-novedades");

// revisarNovedades();
async function revisarNovedades() {

    const usuarios = new Set();
    const novedades = await db.collectionGroup("estadoGuias")
    .where("enNovedad", "==", true)
    .limit(10)
    .get().then(q => {
        let contador = 0;
        let size = q.size;
        console.log(size);

        if(!size) cargadorClass.add("d-none");
        const lista = [];
        q.forEach(d => {
            let path = d.ref.path.split("/");
            let dato = d.data();
            contador++

            usuarios.add(path[1]);
            lista.push(dato);
        });

        return lista; 
    });

    const guiasJoint = novedades.map(async novedad => {
        const {centro_de_costo, id_heka} = novedad;
        const guia = await buscarGuia(centro_de_costo, id_heka);
        const extraer = ["ult_seg", "ult_gest"];

        const respSegumineto = revisarSeguimiento(guia.seguimiento);
        extraer.forEach(ex => novedad[ex] = respSegumineto[ex]);
    })
    
    console.log(novedades);
    if(revisarTiempoGuiasActualizadas()) return;

    usuarios.forEach(actualizarEstadosEnNovedadUsuario);
    
    localStorage.last_update_novedad = new Date();
}

async function buscarGuia(seller, id_heka) {
    return getDoc(doc(collection(doc(collection(db, "usuarios"), seller), "guias"), id_heka))
    .then((d) => (d.exists() ? d.data() : undefined));
}

function revisarSeguimiento(seguimiento) {
    const respuesta = {
        ult_seg: "",
        ult_gest: ""
    }; 

    if(!seguimiento) return respuesta;

    seguimiento.sort((a,b) => a.fecha.toMillis() - b.fecha.toMillis());

    return respuesta;
}