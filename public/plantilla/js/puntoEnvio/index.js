import { idFlexiiGuia, idReceptorFlexiiGuia, idScannerEstados } from "./constantes.js";
import { abrirModalActuaizarEstado } from "./estadosFlexii.js";
import { tablaGeneradorPedidos } from "./generadorPedidos.js";
import { capturarEnvio, scannerIdentifier, tablaRecepcionPaquetes } from "./recibirPaquete.js";

window.addEventListener("hashchange", () => {
    const {hash} = location;
    
    loadDataByHash(hash);
});


ControlUsuario.hasLoaded
.then(() => {
    const url = new URL(location);
    const id = url.searchParams.get(scannerIdentifier) // dónde debería venir el id de la guía
    const {hash} = url;
    const currentView = hash.replace("#", "");


    // Se va a invocar la función, siempre que exista un id y el hash actual corresponda con la vista que le compete a la recepción de guías
    if(id) {
        if( currentView === idReceptorFlexiiGuia ) { // Cuando la vista actual es la que captura los envíos
            // Se invoca la función encargada de capturar el envío
            capturarEnvio(id)
            .then((res) => {
                url.searchParams.delete(scannerIdentifier);
                history.replaceState(null, null, url);
                Swal.fire(res);
            });
        } else if ( currentView === idScannerEstados ) { // Cuando la vista es la que se encarga de actualizar los estados
            abrirModalActuaizarEstado(id)
            .then((res) => {
                url.searchParams.delete(scannerIdentifier);
                history.replaceState(null, null, url);
            });
        }
    }

    loadDataByHash(hash);

});


function loadDataByHash(hash) {
    const currentView = hash.replace("#", "");

    if(currentView === idFlexiiGuia) {
        tablaGeneradorPedidos.reloadData();
    } else if (currentView === idReceptorFlexiiGuia) {
        tablaRecepcionPaquetes.reloadData();
    }
}