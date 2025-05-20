import { v0 } from "../config/api.js";
import { geocodeLocation } from "./utils.js";

const alertElement = document.getElementById("alerta");
const mapElement = document.getElementById("map");

const formAppSearch = document.querySelector("form.app-search");

// Para activar el buscador particular de la parte superior
if(formAppSearch) {
    formAppSearch.setAttribute("action", "SeguimientoPaquete");
}

loadData();
async function loadData() {
    const ruta = await obtenerRuta();
    const data = ruta.body;
    if(!ruta) return;

    if(ruta.error) {
        console.log(ruta);

        alertElement.innerText = ruta.body;
        alertElement.classList.add("alert-danger");
        mapElement.classList.add("d-none");
        return;
    }


    alertElement.classList.add("alert-success");
    
    let mensaje = `Su paquete está en proceso de entrega, solo faltan ${data.posicion} paquetes, por entregar antes que el suyo.`;
    if(data.posicion === 1) mensaje = "Fata un paquete por entregar, su envío será el próximo.";
    if(data.posicion === 0) mensaje = "Su paquete está próximo a ser entregado a la dirección: " + data.envio.direccion;

    alertElement.innerText = mensaje;
    initMap(data);
}

async function initMap(body) {
    const {location, envio} = body;

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    
    const locationDestiny = await geocodeLocation({address: envio.direccion});

    const map = new Map(mapElement, {
        center: locationDestiny,
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        mapId: "b1578ba318d8bf2b"
    });

    const glyphConfig = {
        glyph: null,
        glyphColor: '#ff8300',
        background: '#FFD514',
        borderColor: '#ff8300'
    }

    // Ubicación del transportista
    // A marker with a custom SVG glyph.
    const glyphImg = document.createElement("img");
    glyphImg.width = 20;
    glyphImg.height = 20;

    glyphImg.src = "/img/logo-heka.png";

    glyphConfig.glyph = glyphImg;

    const glyphSvgPinElement = new PinElement(glyphConfig);

    new AdvancedMarkerElement({
        map,
        position: location,
        content: glyphSvgPinElement.element,
        title: "Ubicación del transportista.",
    });


    // Ubicación del paquete
    const icon = document.createElement("div");

    icon.innerHTML = '<i class="fa fa-home"></i>';
    glyphConfig.glyph = icon;

    const faPin = new PinElement(glyphConfig);

    new AdvancedMarkerElement({
        map,
        position: locationDestiny,
        content: faPin.element,
        title: envio.direccion,
    });

    return map;
}


async function obtenerRuta() {
    const url = new URL(location);
    const numeroGuia = url.searchParams.get("n") // dónde debería venir el id de la guía
    return await fetch(v0.pathRutaentrega + "/" + numeroGuia)
    .then(d => d.json())
    .catch(e => ({error: true, message: e.message}));

}