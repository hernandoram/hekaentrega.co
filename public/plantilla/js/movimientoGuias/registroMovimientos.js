import { estadosRecepcion } from "../puntoEnvio/constantes.js";
import { mostrarRenderFormNovedades } from "./renderForm.js";
import { campoFormulario } from "./views.js";

const db = firebase.firestore();
const referencia = db.collection("infoHeka").doc("novedadesMensajeria");
const refEstadosNotificacion = db.collection("estadosNotificacion");
const referencia2 = db.collection("infoHeka").doc("categoriasMensajeria");


/*
    Script encargado de la creación, manipulación de estados puestos por heka entrega para:
        - Definir movimientos de guías
        - Definir novedades
        - Crear formularios para asignarlos dinámicamente en las novedades y/o estados establecidos

    Dentro de la plataforma de admin se puede encontra el #mensajeria que será utilizado para configurar lo necesario
 */

//#region SELECTORES DE FUNCIONALIDAD Y EVENTOS
const idVistaRender = "#render_form-mensajeria";
const idVistaContructorForm = "#editor_form-mensajeria";
const selListMovimientos = $("#list_novedades-mensajeria"); // select de la lista de movimientos
const selListFormularios = $("#formulario-mensajeria"); // Select de la lista de formularios
const visorMensajeria = $("#visor-mensajeria"); // El contenedor principal donde muestra el formulario para editar/crear novedades
const visorTipo = $("#tipo-mensajeria"); // El contenedor principal donde muestra el formulario para editar/crear novedades
const formRegistro = $("form", visorMensajeria); // Formulario para crear/editar novedades
const formFormularios = $("#editor_form-mensajeria"); // Formulario para crear/editar un formulario asociado
const opcionesMovimientos = $("#mensajeria [data-action]"); // Acciones particulares como editar, agregar, etc
const camposForm = $("#campos_form-mensajeria");
const botoncategoria= document.getElementById("crear-tipo-boton");
const inputcategoria= document.getElementById("nuevo-tipo");

//#endregion

//inputs


//#region Acciones y eventos
selListMovimientos.on("change", seleccionarNovedad);
selListFormularios.on("change", seleccionarFormulario);
opcionesMovimientos.on("click", manejarOpcion);

const action = act => $(`#mensajeria [data-action='${act}']`);
const showActions = acts => acts.forEach(a => action(a).removeClass("d-none"));
const hideActions = acts => acts.forEach(a => action(a).addClass("d-none"));
//#endregion

let listaRegistros = [], listaFormularios = [];
let categorias = [];

//#region APARTADO PARA LAS FUNCIONES DE MENSAJERÍA
mostrarRegistros();
/**
 * La función "mostrarRegistros" recupera una lista de mensajes y formularios, completa los menús
 * desplegables con los datos recuperados y agrega opciones predeterminadas para crear nuevos mensajes
 * y formularios.
 */
async function mostrarRegistros() {
    const lista = await refEstadosNotificacion
    .orderBy("nombre")
    .get()
    .then(q => {
        const res = [];
        q.forEach(d => {
            const data = d.data();
            data.id = d.id;
            res.push(data);
        });

        return res;
    });


    // Consulat la lista de mensajes y novedades
    const {formularios} = await referencia.get().then(d => {
        if(d.exists) return d.data();
        return {};
    });

    const listacategorias = Object.values(estadosRecepcion);

    listaRegistros = lista;
    listaFormularios = formularios || [];
    categorias= listacategorias || [];

    // Se llena la lista de movimientos o novedades
    const opcionesLista = lista.map((l,i) => `<option value="${l.id}">${l.nombre}</option>`).join("");
    selListMovimientos.html(opcionesLista);
    selListMovimientos.prepend("<option value selected>-- Nueva --</option>");
    selListMovimientos.change();

    // Se llena la lista de formularios
    const opcionesFormularios = listaFormularios.map((l,i) => `<option value="${i}">${l.titulo}</option>`).join("");
    selListFormularios.html(opcionesFormularios);
    selListFormularios.prepend("<option value selected>-- Nuevo Formulario --</option>");

    // Se llena la lista de formularios
    const opcionesCategoria = categorias.map((c) => `<option value="${c}">${c}</option>`).join("");
    visorTipo.html(opcionesCategoria);
    visorTipo.prepend("<option value='seleccione' selected>-- Seleccione --</option>");
}
visorTipo.on("change", seleccionarCategoria);

function seleccionarCategoria(e) {
    if (e.target.value == "OTRA"){
        inputcategoria.classList.remove("d-none");
        botoncategoria.classList.remove("d-none");
    }else{
        inputcategoria.classList.add("d-none");
        botoncategoria.classList.add("d-none");
    }
}
botoncategoria.addEventListener("click", crearCategoria);


function crearCategoria(e) {
  e.preventDefault();
  const elemento={ titulo: inputcategoria.value.toUpperCase()}

  console.log(categorias, elemento)

  categorias.push(elemento);

  referencia2
    .set({listacategorias: categorias})
    .then(Toast.fire("Registros Actualizados correctamente", "", "success"));

    mostrarRegistros()
    inputcategoria.classList.add("d-none");
    botoncategoria.classList.add("d-none");
}

/**
 * La función "seleccionarNovedad" se utiliza para seleccionar un elemento específico de una lista y
 * llenar un formulario con sus datos correspondientes.
 * @param e - El parámetro "e" es un objeto de evento que representa el evento que activó la función.
 * Se pasa como argumento cuando se llama a la función en respuesta al enevento "onchange" de la lista
 * de novedades
 */
function seleccionarNovedad(e) {
    const val = e.target.value;
    opcionesMovimientos.addClass("d-none");
    const els = $("[name]", formRegistro);
    // En caso de que val sea null|undefined|"" es porque se va a cargar una información nueva
    if(!val) {
        action("guardar").removeClass("d-none");
        els.attr("disabled", false);
        formRegistro[0].reset();
        selListFormularios.change();

        return;
    }

    // representa la novedad/movimiento seleciconado
    const elemento = listaRegistros.find(r => r.id === val);
    
    const modulo = "-mensajeria";
    const keys = Object.keys(elemento);


    console.log(elemento);
    
    els.attr("disabled", true);

    // Para llenar el formulario del módulo de mensajería con los valores extraidos
    keys.forEach(k => {
        const el = $("#" + k + modulo, formRegistro);
        if(el.prop("type") === "checkbox")
            el.attr("checked", elemento[k]);
        else
            el.val(elemento[k]);
    });

    action("editar").removeClass("d-none");

    // Para activar el enveto "onChange" para el formulario asociado
    selListFormularios.val(elemento.formulario);
    visorTipo.val(elemento.tipo);
    selListFormularios.change();
    visorTipo.change()
}

/**
 * La función "manejarOpcion" maneja diferentes acciones basadas en el atributo "data-action" del
 * elemento de destino.
 * @param e - El parámetro "e" es un objeto de evento que representa el evento que activó la función.
 * Se usa comúnmente en los controladores de eventos para acceder a la información sobre el evento,
 * como el elemento de destino que activó el evento.
 */
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
        case "ver-form":
            activarEdicionFormulario(e);
        break;
    }

}

/**
 * La función "activarEdicionMensaje" habilita o deshabilita los campos y botones del visor del registro
 */
function activarEdicionMensaje() {
    const el = $("[name]", formRegistro);
    const attr = el.prop("disabled");
    el.attr("disabled", !attr);

    attr ? action("guardar").removeClass("d-none") : action("guardar").addClass("d-none");

    selListMovimientos.attr("disabled", false);
}

/**
 * La función `guardarRegistro` es una función asíncrona que guarda un registro al actualizar una lista
 * de registros en la base de datos de Firebase.
 */
async function guardarRegistro() {
    const idNov = selListMovimientos.val();

    const elemento = {};
    const booleans = ["notificar_ws", "esNovedad"];

    // Para guardar la respuesta del formulario
    const formData = new FormData(formRegistro[0]);
    for ( let key of Object.keys(elemento) ) {
        const val = formData.get(key);

        const esBoleano = booleans.includes(key);

        elemento[key] = esBoleano ? !!val : val;
    }

    // También se usa como emergencia lo expuesto por formaData
    for ( let ent of formData.entries() ) {
        const [key, val] = ent;
        const esBoleano = booleans.includes(key);

        elemento[key] = esBoleano ? !!val : val;
    }

    elemento.fecha_actualizacion = new Date();

    // Es caso de que sea una novedad inexistente
    if(idNov) {
        console.log("Se va a guardar uno nuevo");
        elemento.fecha_creacion = new Date();
    }

    console.log(elemento, idNov);

    const registro = idNov 
        ? refEstadosNotificacion.doc(idNov).update(elemento) 
        : refEstadosNotificacion.add(elemento)

    // Se actualiza solo la lista de mensajería
    registro
    .then(() => {
        Toast.fire("Registros Actualizados correctamente", "", "success");
        mostrarRegistros();
    })
    .catch((e) =>Toast.fire("Error al guardar la información", e.message, "error"));
    
}

//#endregion

// #region APARTADO PARA LA OPCIONES DEL FORMULARIO
const listaCampos = [];
let modoEdicionForm = false;

/**
 * La función "seleccionarFormulario" se utiliza para manejar la selección de un formulario y realizar
 * acciones en base al formulario seleccionado.
 * @param e - El parámetro `e` es un objeto de evento que representa el evento que activó la función.
 * En respuesta el evento "onchange" de la lista de formularios
 * @returns La función no tiene declaración de retorno, por lo que no devuelve ningún valor.
 */
function seleccionarFormulario(e) {
    const val = e.target.value;
    const els = () => $("[name]", formFormularios);
    const acciones = ["editar-form", "agregar-campo", "guardar-form", "ver-form"];
    hideActions(acciones);
    listaCampos.splice(0, listaCampos.length);
    console.log("sleccion de formulario", val);
    if(!val) {
        showActions(acciones.slice(-2));
        els().attr("disabled", false);
        formFormularios[0].reset();
        $(idVistaContructorForm).show("fast");
        $(idVistaRender).hide();
        $(idVistaRender).html("");
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
    $(idVistaContructorForm).hide("fast");
    $(idVistaRender).show();

    renderizarCampos();
    els().attr("disabled", true);
    modoEdicionForm = false;

    // Función para mostrar el resultado del formulario agregado
    mostrarRenderFormNovedades(idVistaRender, elemento, {
        integracionVisual: true
    });
}

/**
 * La función `activarEdicionFormulario` alterna el atributo deshabilitado de los elementos del
 * formulario y muestra/oculta ciertas acciones y vistas según el modo actual.
 */
function activarEdicionFormulario() {
    const el = $("[name]", formFormularios);
    const attr = el.prop("disabled");
    el.attr("disabled", !attr);
    modoEdicionForm = !modoEdicionForm;

    if(attr) {
        // CUANDO VOY A EDITAR
        showActions(["agregar-campo", "guardar-form", "ver-form"]) 
        hideActions(["editar-form"]);
        $(idVistaContructorForm).show();
        $(idVistaRender).hide("fast");
    } else {
        // CUANDO VOY A MIRAR EL FORMULARIO CREADO
        $(idVistaContructorForm).hide("fast");
        $(idVistaRender).show();
        hideActions(["agregar-campo", "guardar-form", "ver-form"]);
        showActions(["editar-form"]);
    }

    selListMovimientos.attr("disabled", false);
}

/**
 * La función "renderizarCampos" genera campos HTML basados en una lista de campos y agrega detectores
 * de eventos para eliminar campos y cambiar tipos de campos.
 */
function renderizarCampos() {
    const camposHtml = listaCampos.map(campoFormulario).join("");
    camposForm.html(camposHtml);
    action("quitar-campo").click(quitarCampo);
    action("select-tipo").on("change", selectTipoCampo);
    action("select-no-inputs").on("change", selectNoInputs);
    action("depender-campo").on("change", dependerCampo);


}


function dependerCampo(e){
    const i = e.target.getAttribute("data-index");
    console.log(i);
    const campoDependiente = document.getElementById(
      `despendiente-mensajeria-${i}`
    );
    
    const cbox = document.getElementById(`cbox-${i}`);

  
    if (cbox.checked) {
      campoDependiente.classList.remove("d-none");
    } else {
      campoDependiente.classList.add("d-none");
      campoDependiente.value="";
    }

}

function selectNoInputs(e){
    const i = e.target.getAttribute("data-index");
    console.log(i)

    const opcion3 = document.getElementById(`opciones-mensajeria3-${i}`);
    const alerta3 = document.getElementById(`alerta-mensajeria3-${i}`);
    const opcion4 = document.getElementById(`opciones-mensajeria4-${i}`);
    const alerta4 = document.getElementById(`alerta-mensajeria4-${i}`);
    const input = document.getElementById(`selectInputs-${i}`).value;

    console.log(input);

    if (input == 4) {
      opcion3.classList.remove("d-none");
      alerta3.classList.remove("d-none");
      opcion4.classList.remove("d-none");
      alerta4.classList.remove("d-none");
    } else if (input == 3) {
      opcion3.classList.remove("d-none");
      alerta3.classList.remove("d-none");
      opcion4.classList.add("d-none");
      opcion4.value = "";
      alerta4.classList.add("d-none");
      alerta4.value = "";
    } else {
      opcion3.classList.add("d-none");
      opcion3.value = "";
      alerta3.classList.add("d-none");
      alerta3.value = "";
      opcion4.classList.add("d-none");
      opcion4.value = "";
      alerta4.classList.add("d-none");
      alerta4.value = "";
    }

}

/**
 * La función "agregarCampo" agrega un objeto vacío a la matriz "listaCampos" y luego llama a la
 * función "renderizarCampos".
 */
function agregarCampo() {
    listaCampos.push({});
    renderizarCampos();
}


/**
 * La función "quitarCampo" elimina un campo de una lista de campos.
 * @param e - El parámetro "e" es un objeto de evento que representa el evento que activó la función.
 * Producida por el evento onclik de la acciones quitar
 * @returns Si la variable `modoEdicionForm` es `falsa`, la función regresará sin realizar más
 * acciones.
 */
function quitarCampo(e) {
    if(modoEdicionForm === false) return;
    const i = e.target.getAttribute("data-index");
    listaCampos.splice(i, 1);
    renderizarCampos();
}

/**
 * La función `guardarForm` es una función asíncrona que guarda los datos del formulario en la base de
 * datos y muestra un mensaje de éxito si los datos se guardan correctamente.
 */
async function guardarForm(e) {
    e.preventDefault();
    const idForm = selListFormularios.val();

    // Se inicializa el objeto con la maqueta vacía
    const estructuraFormularioGenerado = {campos: [{}]};

    // Se estable el patrón de elementos de lista para definir como se va a registrar la información
    const elementosDeLista = ["nombre", "tipo", "dependiente",
     "opciones","opciones1", "opciones2", "opciones3","opciones4",
      "alerta", "alerta1", "alerta2", "alerta3", "alerta4", "etiqueta"];

    const formData = new FormData(formFormularios[0]);
    
    let i = 0;
    /* Itera sobre las entradas del formulario, luego analiza si es de tipo campo o si es un elemnto general
        del formulario, al ser un campo, ingresa sobre los campos del formulario construido para añadir
        el campo tomado del formulario en caso de que ya exista el campo, genera un nuevo registro para trabajar
        sobre un campo nuevo
    */
    for ( let ent of formData.entries() ) {
        const [key, val] = ent;
        const esCampo = elementosDeLista.includes(key);
        if(esCampo) {
            const actual = estructuraFormularioGenerado.campos[i];
            const existe = actual && actual[key] !== undefined;
            if(existe) {
                i++;
                estructuraFormularioGenerado.campos.push({});
            }
            if (val.length>0){
                estructuraFormularioGenerado.campos[i][key] = val;
            }else{
                delete estructuraFormularioGenerado.campos[i][key]
            }
          
        } else {
            estructuraFormularioGenerado[key] = val;
        }

        if(estructuraFormularioGenerado.campos[i].tipo!="select"){
            eliminarCamposEmpiecen(estructuraFormularioGenerado.campos[i],"opciones","alerta");
       }

    }      
    
    console.log(estructuraFormularioGenerado);

    if(!estructuraFormularioGenerado.titulo || !estructuraFormularioGenerado.descripcion) {
        return Toast.fire("El formulario debe tener un titulo y respuesta construida", "", "error");
    }


    for (let i = 0; i < estructuraFormularioGenerado.campos.length; i++) {
      if (
        !estructuraFormularioGenerado.campos[i].nombre ||
        !estructuraFormularioGenerado.campos[i].etiqueta
      ) {
        return Toast.fire(
          `El formulario ${i+1} debe tener un nombre y una etiqueta`,
          "",
          "error"
        );
      }

      
    const cbox = document.getElementById(`cbox-${i}`);
  
    if (cbox.checked && !estructuraFormularioGenerado.campos[i].dependiente) {
        return Toast.fire(
            `El formulario ${i+1} debe tener un campo del que dependa`,
            "",
            "error"
          );
    
    }
      if (estructuraFormularioGenerado.campos[i].tipo === "select") {
        const estructura = estructuraFormularioGenerado.campos[i];

        if (!estructura.opciones1 || !estructura.opciones2) {
          return Toast.fire(
            `El formulario ${i+1} debe contener minimo dos opciones`,
            "",
            "error"
          );
        } else {
          estructura.opciones =
            estructura.opciones1 + "," + estructura.opciones2;

          if (estructura.opciones3) {
            estructura.opciones += "," + estructura.opciones3;
          }

          if (estructura.opciones4) {
            estructura.opciones += "," + estructura.opciones4;
          }

          //alertas

          if(!estructura.alerta && estructura.alerta1){
            estructura.alerta = `${estructura.opciones1}:${estructura.alerta1}`;
          }

          if(!estructura.alerta && estructura.alerta2){
            estructura.alerta = `${estructura.opciones2}:${estructura.alerta2}`;
        } else if(estructura.alerta && estructura.alerta2){
            estructura.alerta += ` -- ${estructura.opciones2}:${estructura.alerta2}`;
          }


          if(!estructura.alerta && estructura.alerta3 && estructura.opciones3){
            estructura.alerta = `${estructura.opciones3}:${estructura.alerta3}`;
        } else if(estructura.alerta && estructura.alerta3){
            estructura.alerta += ` -- ${estructura.opciones3}:${estructura.alerta3}`;
          }

          
          if(!estructura.alerta && estructura.alerta4 && estructura.opciones4){
            estructura.alerta = `${estructura.opciones4}:${estructura.alerta4}`;
        } else if(estructura.alerta && estructura.alerta4){
            estructura.alerta += ` -- ${estructura.opciones4}:${estructura.alerta4}`;
          }

        }
      }
    }

    if(Number.isNaN(parseInt(idForm))) {
        // elemento.fecha_creacion = new Date();
        listaFormularios.push(estructuraFormularioGenerado);
    } else {
        listaFormularios[idForm] = estructuraFormularioGenerado;
    }

    // console.log(estructuraFormularioGenerado, listaFormularios, idForm);

    // Se actulizan solo los formularios
    referencia.update({formularios: listaFormularios})
    .then(() => {
        Toast.fire("Formulario guardado correctamente", "", "success");
        mostrarRegistros();
    })
    .catch((e) =>Toast.fire("Error al guardar la información", e.message, "error"));

}

/**
 * La función `selectTipoCampo` se utiliza para alternar la visibilidad de un conjunto de opciones en
 * función del valor seleccionado de un menú desplegable.
 * @param e - El parámetro "e" es un objeto de evento que representa el evento que activó la función.
 * Activado por el "onchange" del campo para selecciona el tipo 
 */
function selectTipoCampo(e) {
    const i = e.target.getAttribute("data-index");
    console.log(e.target.value);
    if(e.target.value === "select") {
        $(`#opciones-mensajeria-${i}`).parent().removeClass("d-none");
        $(`#alerta-mensajeria-${i}`).parent().removeClass("d-none");
        $(`#select-opciones-${i}`).removeClass("d-none");
        $(`#select-opciones-${i}`).addClass("d-flex");
    } else {

        $(`#opciones-mensajeria-${i}`).parent().addClass("d-none");
        $(`#alerta-mensajeria-${i}`).parent().addClass("d-none");
        $(`#select-opciones-${i}`).addClass("d-none");
        $(`#select-opciones-${i}`).removeClass("d-flex");
           
    }


}


function eliminarCamposEmpiecen(objeto, propiedad, propiedad2) {
    for (let key in objeto) {
      if (key.startsWith(propiedad) || key.startsWith(propiedad2)) {
        delete objeto[key];
      }
    }
  }

// #endregion