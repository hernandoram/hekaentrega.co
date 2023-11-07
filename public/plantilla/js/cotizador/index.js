const db = firebase.firestore();

let hostname_index = window.location.href;
let cotizador= hostname_index.split("#")[1]
console.log(window.localStorage)
const bodegasEl = cotizador === "cotizar_envio-flexii"? $("#list_bodegas-cotizador-flexii") : $("#list_bodegas-cotizador");
const plantillasEl = cotizador === "cotizar_envio-flexii"? $("#list_plantillas-cotizador-flexii") : $("#list_plantillas-cotizador");
const opcionesEl = cotizador === "cotizar_envio-flexii"? $(".cotizador-beta-flexii") : $(".cotizador-beta");
const inpCiudadR = cotizador === "cotizar_envio-flexii"? $("#ciudadR-flexii") : $("#ciudadR");
const inpCiudadD = cotizador === "cotizar_envio-flexii"? $("#ciudadD-flexii") : $("#ciudadD");
const CheckGuardar =cotizador === "cotizar_envio-flexii"? $("#guardar_cotizacion-cotizador-flexii") : $("#guardar_cotizacion-cotizador");
const configGuardado = cotizador === "cotizar_envio-flexii"? $("#cont_config_save-cotizador-flexii") : $("#cont_config_save-cotizador");
const contNombrePlantilla = cotizador === "cotizar_envio-flexii"? $("#cont_nom_plant-cotizador-flexii") : $("#cont_nom_plant-cotizador");
const formulario = cotizador === "cotizar_envio-flexii"? $("#cotizar-envio-flexii") : $("#cotizar-envio");
const checkActivarDestinoPlantilla = cotizador === "cotizar_envio-flexii"? $("#actv_ciudad_plantilla-cotizador-flexii") : $("#actv_ciudad_plantilla-cotizador");
const actionEliminarPlantilla = cotizador === "cotizar_envio-flexii"? $("#boton_eliminar_plant-flexii") : $("#boton_eliminar_plant");
const checkEditPlant = $("#actv_editar_plantilla-cotizador");
const contEditPlant = cotizador === "cotizar_envio-flexii"? $("#cont_act_plant-cotizador-flexii") : $("#cont_act_plant-cotizador");
const btnCotizar = cotizador == "cotizar_envio-flexii"? $("#boton_cotizar_2-flexii") : $("#boton_cotizar_2");

const referenciaListaPlantillas = usuarioAltDoc().collection("plantillasCotizador");




const listaPlantilla = new Map();

bodegasEl.change(cambiarBodegaCotizador);
plantillasEl.change(cambiarPlantillaCotizador);
CheckGuardar.change(mostrarOcultarNombrePlantilla);
actionEliminarPlantilla.click(eliminarPlantillaActual);
checkActivarDestinoPlantilla.change(() => plantillasEl.change());

const charger = new ChangeElementContenWhileLoading(btnCotizar);
export function iniciarOpcionesCotizador() {
    opcionesEl.removeClass("d-none");
    $("#cotizador .form-control-user").removeClass("form-control-user");
}

export function llenarBodegasCotizador() {
    bodegasWtch.watch(info => {
        if(!info) return;

        console.log(info)

        bodegasEl.html("");

        const opciones = info.map(bodega => {
            const bodegaEl = `<option value="${bodega.ciudad}">${bodega.nombre}</option>`;
            return bodegaEl
        });

        opciones.unshift(`<option>Seleccione Bodega</option>`)
    
        bodegasEl.html(opciones.join(""))
    })
}

watcherPlantilla.watch(llenarProductos);
export function llenarProductos(num) {
    
    referenciaListaPlantillas
    .get().then(q => {
        plantillasEl.html("");
        const opciones = [];

        q.forEach(d => {
            const data = d.data();
            if(data.eliminada) return;
            
            opciones.push(`<option value="${d.id}">${data.nombre}</option>`)
            listaPlantilla.set(d.id, data);
        });
        
        opciones.unshift(`<option value>Seleccione Plantilla</option>`);
        plantillasEl.html(opciones.join(""));

    });

    if(num) configGuardado.addClass("d-none");

    CheckGuardar.prop("checked", false);
}

const ciudadesTomadas = new Map()
function cambiarBodegaCotizador(e) {
    const val = e.target.value;
    limpiarInputCiudad(inpCiudadR);
    

    const bodega = bodegasWtch.value.find(b => b.ciudad == val);
    
    if(!bodega) return;

    buscarCiudad(inpCiudadR, bodega.ciudad)
    
}

function setearCiudad(inp, data) {
    if(!ciudadesTomadas.has(data.nombre)) ciudadesTomadas.set(data.nombre, data);
    if(data.desactivada) return;

    llenarInputCiudad(inp, data);
    charger.end();
}

function buscarCiudad(el, ciudad) {
    charger.init();
    if(ciudadesTomadas.has(ciudad)) return setearCiudad(el, ciudadesTomadas.get(ciudad));

    db.collection("ciudades").where("nombre", "==", ciudad)
    .limit(3)
    .get().then(q => {
        q.forEach(doc => {
            const data = doc.data();
            if(data.desactivada) return;
            setearCiudad(el, data);
        })
    })
}

function cambiarPlantillaCotizador(e) {
    const val = e.target.value;

    formulario[0].reset();
    buscarCiudad(inpCiudadR, bodegasEl.val());

    if(!val) {
        configGuardado.removeClass("d-none");
        contNombrePlantilla.addClass("d-none");
        actionEliminarPlantilla.addClass("d-none");
        contEditPlant.addClass("d-none");
    } else {
        actionEliminarPlantilla.removeClass("d-none");
        contEditPlant.removeClass("d-none");
        configGuardado.addClass("d-none")
    }


    const plantilla = listaPlantilla.get(val);

    if(!plantilla) return;

    const plant = Object.assign({}, plantilla);
    delete plant.ciudadD;
    delete plant.ciudadR;

    const keys = Object.keys(plant);

    keys.forEach(k => {
        $(`[name="${k}"]`, formulario).val(plant[k]);
    });

    if(checkActivarDestinoPlantilla[0].checked) buscarCiudad(inpCiudadD, plantilla.ciudadD);
}

function llenarInputCiudad(inp, data) {
    
    const dataSet = {
        id: data.dane_ciudad,
        ciudad: data.ciudad,
        departamento: data.departamento,
        dane_ciudad: data.dane_ciudad,
    };

    const info_servi = data.transportadoras["SERVIENTREGA"];
    if(info_servi) {
        dataSet.tipo_trayecto = info_servi.tipo_trayecto;
        dataSet.frecuencia = info_servi.frecuencia;
        dataSet.tipo_distribucion = info_servi.tipo_distribucion;
    }

    for(let d in dataSet) {
        inp[0].dataset[d] = dataSet[d];
    }
    inp.val(data.nombre);

}

function limpiarInputCiudad(inp) {
    inp.val("");
    const atributos = ["id", "ciudad", "departamento", "dane_ciudad", "tipo_trayecto", "frecuencia", "tipo_distribucion"];

    atributos.forEach(a => inp.removeAttr("data-" + a));
}

function mostrarOcultarNombrePlantilla(e) {
    const checked = e.target.checked;
    const nombrePlantilla = $("#cont_nom_plant-cotizador")

    checked ? nombrePlantilla.removeClass("d-none") : nombrePlantilla.addClass("d-none");
}

function eliminarPlantillaActual() {
    const idPlantilla = plantillasEl.val();
    Swal.fire({
        icon: 'question',
        title: '¿Seguro que seas eliminar esta plantilla?',
        customClass: {
            cancelButton: "btn btn-secondary m-2",
            confirmButton: "btn btn-primary m-2",
        },
        showCancelButton: true,
        showCloseButton: true,
        cancelButtonText: "Cancelar",
        confirmButtonText: "Eliminar",
        buttonsStyling: false,
    }).then((result) => {
        if (result.isConfirmed) {
            referenciaListaPlantillas.doc(idPlantilla).update({eliminada: true})
            .then(() => {
                Toast.fire("Plantilla Eliminada.", "", "success");
                watcherPlantilla.change(1);
            });
        }

    })
}