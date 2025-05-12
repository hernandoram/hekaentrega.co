import { idFlexiiGuia, idGestorEntregaflexii, idReceptorFlexiiGuia, idScannerEstados } from "./constantes.js";
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
    } else if (currentView === idGestorEntregaflexii) {
        let map;

        async function initMap() {
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

            map = new Map(document.getElementById("map"), {
                center: { lat: 37.434, lng: -122.082 }, // 4.7054987997362225, -74.10050257620084
                zoom: 10,
                mapId: "DEMO_MAP_ID"
            });

            const parser = new DOMParser();

            // A marker using a Font Awesome icon for the glyph.
            const faPin = new PinElement({
                glyph: "1",
                glyphColor: '#ff8300',
                background: '#FFD514',
                borderColor: '#ff8300',
            });

            const faMarker = new AdvancedMarkerElement({
                map,
                position: { lat: 37.412, lng: -122.095829650878 },
                content: faPin.element,
                title: 'A marker using a FontAwesome icon for the glyph.'
            });
            
            // A marker using a Font Awesome icon for the glyph.
            const faPin2 = new PinElement({
                glyph: "2",
                glyphColor: '#ff8300',
                background: '#FFD514',
                borderColor: '#ff8300',
            });
            

            const gifMarker = new AdvancedMarkerElement({
                map,
                position: { lat: 37.412, lng: -122.295829650878 },
                content: faPin2.element,
                title: 'A marker using a FontAwesome image for the glyph.'
            });


            // A marker with a custom SVG glyph.
            const glyphImg = document.createElement("img");
            glyphImg.width = 20;
            glyphImg.height = 20;

            glyphImg.src =
                "/img/logo-heka.png";

            const glyphSvgPinElement = new PinElement({
                glyph: glyphImg,
                glyphColor: '#ff8300',
                background: '#FFD514',
                borderColor: '#ff8300'
            });
            const glyphSvgMarkerView = new AdvancedMarkerElement({
                map,
                position: { lat: 37.425, lng: -122.07 },
                content: glyphSvgPinElement.element,
                title: "A marker using a custom SVG for the glyph.",
            });
        }

        initMap();
    }
}