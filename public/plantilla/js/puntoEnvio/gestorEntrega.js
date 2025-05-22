import { v0 } from "../config/api.js";
import { activadorDeEventos, ChangeElementContenWhileLoading } from "../utils/functions.js";
import { estadosRecepcion, idGestorEntregaflexii } from "./constantes.js";
import { abrirModalActuaizarEstado } from "./estadosFlexii.js";
import { geocodeLocation } from "./utils.js";
import { rowTablaGestorEntrega } from "./views.js";

const principalId = idGestorEntregaflexii;
const idBodyTabla = "#body_tabla-" + principalId;
const buttonSave = $(`#btn_guardar-${principalId}`);
const checkAtivateSharing = $(`#switch_ubicacion-${principalId}`);
let map, idLocator;

$( idBodyTabla ).sortable();

buttonSave.on("click", guardarGestion);

const accionesTabla = {
    actualizarEstado: actualizarEstado,
    changeStatusRoute: onChangeStatusRoute
}

async function activarTablaPrincipal() {
    const data = await cargarEnviosPendientes();
    $(idBodyTabla).html("");
    $(idBodyTabla).append(data.ruta.map(rowTablaGestorEntrega));

    checkAtivateSharing.prop("checked", data.active);
    if(data.active) {
        activateLiveLocation();
    } else {
        if(idLocator) navigator.geolocation.clearWatch(idLocator);
    }
    
    activadorDeEventos({
        container: $(idBodyTabla),
        acciones: accionesTabla
    });
    
    if(!map) map = await initMap(data.location);

    const markers = await renderMarkers(map, data.ruta);
}

function activateLiveLocation() {
    if(idLocator) return;

    const options = {
        maximunAge: 2000
    }

    function success(pos) {
        const { latitude, longitude } = pos.coords;
        const location = {
            lat: latitude,
            lng: longitude
        }
        
        actualizarRuta({ location });
    }

    function error(err) {
        console.error(`ERROR(${err.code}): ${err.message}`);
    }


    idLocator = navigator.geolocation.watchPosition(success, error, options);
}

const markers = new Set();
async function renderMarkers(map, data) {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    markers.forEach(m => {
        m.setMap(null);
    });
    markers.clear();

    data.filter(p => p.active).forEach(async (d, i) => {
        const pin = new PinElement({
            glyph: (i+1).toString(),
            glyphColor: '#ff8300',
            background: '#FFD514',
            borderColor: '#ff8300',
        });

        const marker = await new AdvancedMarkerElement({
            map,
            position: d.location ?? null,
            content: pin.element,
            title: d.direccion
        });

        geocodeLocation({address: d.direccion})
        .then(res => {
            if(!res) return;
            marker.position = res;
        });

        markers.add(marker);
    });

    return markers;

}

async function initMap(center) {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    
    const map = new Map(document.getElementById("map-gestor_entrega"), {
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        mapId: "b1578ba318d8bf2b"
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
        position: center,
        content: glyphSvgPinElement.element,
        title: "A marker using a custom SVG for the glyph.",
    });

    return map;
}

async function cargarEnviosPendientes() {
    return await fetch(v0.pathRutaMensajero + "/" + user_id)
    .then(d => d.json())
    .then(d => d.body)
    .catch(e => console.error(e));
}

function actualizarEstado(e) {
    const parent = $(e.currentTarget).parents("tr");
    console.log(e.target, parent);
    const {id, ng: numeroGuia} = parent[0].dataset
    const envio = {
        id, numeroGuia
    };

    const controlModal = abrirModalActuaizarEstado(envio);

    $(controlModal.modal).on("hidden.bs.modal", function (event) {
        if(!controlModal.data) return;
        const data = controlModal.data;
        console.log(data);

        // Para quitar el checkbox que activa el seguimiento al momentos de que el estado sea cualquiera de estos tipos
        const estadosSinVigilancia = [
            estadosRecepcion.entregado, estadosRecepcion.devuelto, 
            estadosRecepcion.bodega, estadosRecepcion.novedad
        ];

        if(estadosSinVigilancia.includes(data.tipo)) {
            const idSiwtch = `#activacion-${idGestorEntregaflexii}-${id}`;
            $(idSiwtch).prop("checked", false);
        }

        buttonSave.click();
    });

}

function onChangeStatusRoute(e) {
    const {value} = e.target;

    console.log(value, e.target.checked);

}


async function guardarGestion(e) {
    const target = e.target;
    const l = new ChangeElementContenWhileLoading(target);
    l.init();

    const guias = $(idBodyTabla).children()
    .filter((i, elRow) => {
        const {id} = elRow.dataset;
        const checkbox = $(`#activacion-${idGestorEntregaflexii}-${id}`, elRow);

        return checkbox.is(":checked");
    })
    .map((i, el) => {
        return el.dataset.ng;
    }).toArray();
    
    console.log("Las guías van en este orden", guias);

    const objetoEnvio = {
        id_user: user_id,
        active: checkAtivateSharing.is(":checked"),
        guias
    }

    console.log(objetoEnvio);

    const result = await actualizarRuta(objetoEnvio);

    if(result.error) {
        Swal.fire("error", result.body);
    }

    await activarTablaPrincipal();
    l.end();

}

async function actualizarRuta(data) {
    return await fetch(v0.pathRutaentrega + "/" + user_id, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "Application/json"
        }
    }).then(d => d.json())
    .catch(e => ({error: true, message: e.message}));

}



export {activarTablaPrincipal}