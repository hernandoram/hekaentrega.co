import { cotizarApi } from "../cotizador/cotizadorApi.js";
import { TranslatorFromApi } from "../cotizador/translator.js";
import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { ChangeElementContenWhileLoading, fetchApp2 } from "../utils/functions.js";
import { estadoRecibido, estadosRecepcion, idFlexiiGuia } from "./constantes.js";
import { actualizarEstadoEnvioHeka, dataValueSelectedFromInput, crearPedidoEnvios } from "./crearPedido.js";
import TablaEnvios from "./tablaEnvios.js";
import { bodegasEl, diceContenerEl, oficinaDestinoEl, containerQuoterResponse } from "./views.js";

const principalId = idFlexiiGuia;

const tablaGeneradorPedidos = new TablaEnvios("#contenedor_tabla-" + principalId);

$("#mostrarDevoluciones-flexii_guia").change((e) => {
    if (e.target.checked) {
        tablaGeneradorPedidos.addFilter(estadosRecepcion.devuelto);
    } else {
        tablaGeneradorPedidos.removeFilter(estadosRecepcion.devuelto);
    }
    tablaGeneradorPedidos.reloadData();
});

async function obtenerGuiasEnEsperaPunto() {
    tablaGeneradorPedidos.reloadData()
    .then(() => {
    });
}


const configSelectize = {
    options: [],
    labelField: "nombre", // el label de lo que se le muestra al usuario por cada opción
    valueField: "id", // el valor que será guardado, una vez el lusuario seleccione dicha opción
    searchField: ["nombre", "label"] // El criterio de filtrado para el input
};

bodegasEl.selectize(configSelectize);
oficinaDestinoEl.selectize({...configSelectize, labelField: "label"});
diceContenerEl.selectize(configSelectize)

bodegasWtch.watchFromLast((info) => renderOptionsSelectize(bodegasEl, info));
tablaGeneradorPedidos.selectionCityChange.watch(val => obtenerUsuariosFrecuentes(val).then((info) => renderOptionsSelectize(oficinaDestinoEl, info)));
cargarObjetosFrecuentes().then((info) => renderOptionsSelectize(diceContenerEl, info));



function renderOptionsSelectize(element, options) {
    if (!options) return; 

    
    const selectorSelectize = element[0].selectize;

    selectorSelectize.clearOptions();

    options.forEach(data => selectorSelectize.addOption(data));
}

let direccionesDestino = [];
async function obtenerUsuariosFrecuentes(daneCiudad) {
    if(!direccionesDestino.length) {
        direccionesDestino = await obtenerBodegasPuntosDestino();
    }

    return direccionesDestino.filter(c => c.daneCiudad === daneCiudad);

    const referenciaUsuariosFrecuentes = usuarioAltDoc().collection(
        "plantillasUsuariosFrecuentes"
    );
    
    const opciones = [];
    
    await referenciaUsuariosFrecuentes
    .where("daneCiudad", "==", daneCiudad)
    .get()
    .then((querySnapshot) => {
        querySnapshot.forEach((document) => {
            const data = document.data();
            data.id = document.id;
        
            opciones.push(data);
        });
    });

    return opciones;
}

async function obtenerBodegasPuntosDestino() {
    // 1. Obtenemos la lista de usuarios de tipo punto y/o mensajero
    const usuarios = await db.collection("usuarios")
    .where("type", "in",  ["PUNTO", "MENSAJERO"])
    .get()
    .then(q => {
        const res = [];

        q.forEach(d => {
            res.push(d.data());
        });

        return res;
    });

    // 2. Con los centro de costo, obtenemos información del id Usuairo en refactor
    const usuariosMongo = [];
    await Promise.all(usuarios.map(async u => {
        const user = await fetchApp2(`/api/v1/user?company_name_id=${u.centro_de_costo}&limit=1`).send();
        
        if(user && user.code === 200) {
            usuariosMongo.push(user.response);
            return user
        } else {
            console.error("Error obteniendo datos de usuario", user);
            return null;
        }
    }));

    // 3. Con la información de los id de usuario de refactor, sacamos las bodegas de cada uno
    const bodegas = [];
    await Promise.all(usuariosMongo.map(async u => {
        const bodega = await fetchApp2(`/api/v1/warehouse?user=${u._id}`).send();
        
        if(bodega && bodega.code === 200) {
            bodegas.push(...bodega.response.rows);
            return bodega
        } else {
            console.error("Error obteniendo datos de bodega: ", bodega);
            return null;
        }
    }));

    // 4. Finalmente retornamos la lista de bodegas con la estructura que se necesita para el proceso de creación de guía
    return bodegas.map(b => {
        return {
            label: [b.name, "-", b.user.company_name].join(" ").trim(),
            nombre: [b.user.name, b.user.last_name].join(" ").trim(), // Nombre del usuario destino
            documentoIdentidad: b.user.document,
            direccionDestinatario: b.address.trim(),
            barrio: b.neighborhood.trim(),
            celular: b.user.phone,
            otroCelular: b.user.phone,
            email: b.user.email,
            observaciones: "",
            ciudad: b.city.label,
            daneCiudad: b.city.dane,
            tipoDocumento: b.user.type_document,
            departamento: b.city.state.label,
            id: b._id
        }
    });
}

$("#cotizador-" + principalId).on("submit", cotizarConjunto);
async function cotizarConjunto(e) {
    e.preventDefault();
    const {target} = e;
    const formData = new FormData(target);
    const l = new ChangeElementContenWhileLoading($("[type='submit']", target));
    l.init();

    formData.set("type_payment", 3); // Este tipo de envíos siempre serán envíos convencionales
    formData.set("collection_value", 0); // Debido a que será un envío convencional, no se toma en cuenta ele valor de recaudo
    formData.set("withshipping_cost", false); // No aplica para este tipo de envíos;
    formData.set("city_origin", dataValueSelectedFromInput(bodegasEl).dane_ciudad); // Seteamos a mano la ciuda origen/detino debido a que el value corresponde al id del documento de base de datos
    formData.set("city_destination", dataValueSelectedFromInput(oficinaDestinoEl).daneCiudad); // Seteamos a mano la ciuda origen/detino debido a que el value corresponde al id del documento de base de datos

    const dataTypes = {
        weight: "number",
        declared_value: "number",
        width: "number",
        long: "number",
        height: "number",
        type_payment: "number",
        collection_value: "number",
        withshipping_cost: "boolean"
    }

    try {
        containerQuoterResponse.html("");
        const consulta = Object.fromEntries(formData.entries());

        // Para convertir los datos y enviarlos correctamente al back (numéricos y boleanos)
        Object.keys(dataTypes).forEach(key => {
            const convertor = dataTypes[key];
            switch(convertor) {
                case "number":
                    consulta[key] = Number(consulta[key]);
                break;

                case "boolean":
                    consulta[key] = consulta[key] === "false" ? false : !!consulta[key];
                break;
            }
        });

        const cotizacion = await cotizarApi(consulta);

        mostrarListaTransportadoras(consulta, cotizacion.response);
    } catch (e) {
        console.error("Error Al cotizar: ", e);
    } finally {
        l.end();
    }

}


function mostrarListaTransportadoras(consultaCotizacion, respuestaCotizacion) {
    respuestaCotizacion.filter(r => !r.message).forEach((r, i) => {
        const {distributor_id, total} = r;
        const transp = distributor_id.toUpperCase();
        const configTransp = transportadoras[transp];
        const pathLogo = configTransp.logoPath;
        
        const cotizacionTraducida = new TranslatorFromApi(consultaCotizacion, r); 
        const transportElement = document.createElement("li");
        transportElement.classList.add("list-group-item", "list-group-item-action");
        transportElement.style.cursor = "pointer";

        const innerHtml = `
            <img 
                src="${pathLogo}" 
                style="max-height:100px; max-width:120px"
                alt="logo-${distributor_id}"
            />
            <h5>Costo de Envío: <b>$${convertirMiles( total )}</b></h5>
        `;

        transportElement.innerHTML = innerHtml;
        transportElement.onclick = () => crearPedidoEnvios(cotizacionTraducida, tablaGeneradorPedidos.dataSelected)
            .then(() => {
                console.log("Se está recargando la info"); 
                tablaGeneradorPedidos.reloadData();
            });

        containerQuoterResponse.append(transportElement);
    });
}


export {tablaGeneradorPedidos};
