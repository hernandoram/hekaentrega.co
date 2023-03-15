import { mostrarRenderFormNovedades } from "./renderForm.js";
import { campoFormulario } from "./views.js";

const db = firebase.firestore();

const selListMovimientos = $("#list_novedades-mensajeria");
const selListFormularios = $("#formulario-mensajeria");
const visorMensajeria = $("#visor-mensajeria");
const formRegistro = $("form", visorMensajeria);
const formFormularios = $("#visor_form-mensajeria");
const referencia = db.collection("infoHeka").doc("novedadesMensajeria");
const opcionesMovimientos = $("#mensajeria [data-action]");

const camposForm = $("#campos_form-mensajeria");

selListMovimientos.on("change", seleccionarNovedad);
selListFormularios.on("change", seleccionarFormulario);
opcionesMovimientos.on("click", manejarOpcion);

const action = act => $(`#mensajeria [data-action='${act}']`);
const showActions = acts => acts.forEach(a => action(a).removeClass("d-none"));
const hideActions = acts => acts.forEach(a => action(a).addClass("d-none"));

let listaRegistros = [], listaFormularios = [];
mostrarRegistros();
async function mostrarRegistros() {
    const {lista, formularios} = await referencia.get().then(d => {
        if(d.exists) return d.data();

        return {};
    });

    listaRegistros = lista;
    listaFormularios = formularios || [];

    const opcionesLista = lista.map((l,i) => `<option value="${i}">${l.novedad}</option>`).join("");
    selListMovimientos.html(opcionesLista);
    selListMovimientos.prepend("<option value selected>-- Nueva --</option>");
    selListMovimientos.change();

    const opcionesFormularios = listaFormularios.map((l,i) => `<option value="${i}">${l.titulo}</option>`).join("");
    selListFormularios.html(opcionesFormularios);
    selListFormularios.prepend("<option value selected>-- Nuevo Formulario --</option>");
}

function seleccionarNovedad(e) {
    const val = e.target.value;
    opcionesMovimientos.addClass("d-none");
    const els = $("[name]", formRegistro);

    if(!val) {
        action("guardar").removeClass("d-none");
        els.attr("disabled", false);
        formRegistro[0].reset();
        selListFormularios.change();

        return;
    }

    const elemento = listaRegistros[val];
    const modulo = "-mensajeria";
    const keys = Object.keys(elemento);

    els.attr("disabled", true);

    keys.forEach(k => {
        const el = $("#" + k + modulo, formRegistro);
        if(el.prop("type") === "checkbox")
            el.attr("checked", elemento[k]);
        else
            el.val(elemento[k]);
    });

    action("editar").removeClass("d-none");
    selListFormularios.change();
}

function manejarOpcion(e) {
    const type = e.target.getAttribute("data-action");
    console.log(type);
    switch(type) {
        case "editar":
            activarEdicionMensaje();
        break;
        case "guardar":
            guardarRegistro();
        break;

        case "editar-form":
            activarEdicionFormulario();
        break;
        case "agregar-campo":
            agregarCampo();
        break;
        case "guardar-form":
            guardarForm(e);
        break;
    }

}

function activarEdicionMensaje() {
    const el = $("[name]", formRegistro);
    const attr = el.prop("disabled");
    el.attr("disabled", !attr);

    attr ? action("guardar").removeClass("d-none") : action("guardar").addClass("d-none");

    selListMovimientos.attr("disabled", false);
}

async function guardarRegistro() {
    const idNov = selListMovimientos.val();

    const elemento = listaRegistros[idNov] || {};
    const booleans = ["notificar_ws", "esNovedad"];

    const formData = new FormData(formRegistro[0]);
    for ( let key of Object.keys(elemento) ) {
        const val = formData.get(key);

        const esBoleano = booleans.includes(key);

        elemento[key] = esBoleano ? !!val : val;
    }

    for ( let ent of formData.entries() ) {
        const [key, val] = ent;
        const esBoleano = booleans.includes(key);

        elemento[key] = esBoleano ? !!val : val;
    }

    elemento.fecha_actualizacion = new Date();

    if(Number.isNaN(parseInt(idNov))) {
        console.log("Se va a guardar uno nuevo");
        elemento.fecha_creacion = new Date();
        listaRegistros.push(elemento);
    }

    console.log(elemento, listaRegistros, idNov);

    referencia.update({lista: listaRegistros})
    .then(() => {
        Toast.fire("Registros Actualizados correctamente", "", "success");
        mostrarRegistros();
    })
    .catch((e) =>Toast.fire("Error al guardar la información", e.message, "error"));
    
}

// #region APARTADO PARA LA OPCIONES DEL FORMULARIO
const listaCampos = [];
let modoEdicionForm = false;

function seleccionarFormulario(e) {
    const val = e.target.value;
    const els = () => $("[name]", formFormularios);
    const acciones = ["editar-form", "agregar-campo", "guardar-form"];
    hideActions(acciones);
    listaCampos.splice(0, listaCampos.length);

    console.log("sleccion de formulario", val);
    if(!val) {
        showActions(acciones.slice(-2));
        els().attr("disabled", false);
        formFormularios[0].reset();
        agregarCampo();
        modoEdicionForm = true;
        return;
    }

    const elemento = listaFormularios[val];
    const modulo = "-mensajeria";
    const keys = Object.keys(elemento);
    listaCampos.push(...elemento.campos)

    keys.forEach(k => {
        const el = $("#" + k + modulo, formFormularios);
        if(el.prop("type") === "checkbox")
            el.attr("checked", elemento[k]);
        else
            el.val(elemento[k]);
    });

    action("editar-form").removeClass("d-none");
    renderizarCampos();
    els().attr("disabled", true);
    modoEdicionForm = false;

    mostrarRenderFormNovedades("#render_form-mensajeria", elemento, {
        integracionVisual: true
    });
}

function activarEdicionFormulario() {
    const el = $("[name]", formFormularios);
    const attr = el.prop("disabled");
    el.attr("disabled", !attr);
    modoEdicionForm = !modoEdicionForm;

    attr ? showActions(["agregar-campo", "guardar-form"]) : hideActions(["agregar-campo", "guardar-form"]);

    selListMovimientos.attr("disabled", false);
}

function renderizarCampos() {
    const camposHtml = listaCampos.map(campoFormulario).join("");
    camposForm.html(camposHtml);
    action("quitar-campo").click(quitarCampo);
    action("select-tipo").on("change", selectTipoCampo);
}

function agregarCampo() {
    listaCampos.push({});
    renderizarCampos();
}

function quitarCampo(e) {
    if(modoEdicionForm === false) return;
    const i = e.target.getAttribute("data-index");
    listaCampos.splice(i, 1);
    renderizarCampos();
}

async function guardarForm() {
    const idForm = selListFormularios.val();

    const elemento = {campos: [{}]};
    const elementosDeLista = ["nombre", "tipo", "opciones", "dependiente", "alerta", "etiqueta"];

    const formData = new FormData(formFormularios[0]);
    
    let i = 0;
    for ( let ent of formData.entries() ) {
        const [key, val] = ent;
        const esCampo = elementosDeLista.includes(key);
        if(esCampo) {
            const actual = elemento.campos[i];
            const existe = actual && actual[key] !== undefined;
            if(existe) {
                i++;
                elemento.campos.push({});
            }

            elemento.campos[i][key] = val;
        } else {
            elemento[key] = val;
        }

    }

    console.log(elemento);

    if(!elemento.campos || !elemento.campos.length) {
        return Toast.fire("Tienes que asignar un campo", "", "error");
    }

    if(Number.isNaN(parseInt(idForm))) {
        // elemento.fecha_creacion = new Date();
        listaFormularios.push(elemento);
    } else {
        listaFormularios[idForm] = elemento;
    }

    console.log(elemento, listaFormularios, idForm);

    
    referencia.update({formularios: listaFormularios})
    .then(() => {
        Toast.fire("Formulario guardado correctamente", "", "success");
        mostrarRegistros();
    })
    .catch((e) =>Toast.fire("Error al guardar la información", e.message, "error"));

}

function selectTipoCampo(e) {
    const i = e.target.getAttribute("data-index");
    console.log(e.target.value);
    if(e.target.value === "select") {
        $(`#opciones-mensajeria-${i}`).parent().removeClass("d-none");
    } else {
        $(`#opciones-mensajeria-${i}`).parent().addClass("d-none");

    }


}


// #endregion