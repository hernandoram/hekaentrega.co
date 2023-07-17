import { obtenerCampoRenderFormulario } from "./views.js";

/**
 * Script especializado es estructurar y formalizar la lectura del formualrio generado por el registor de movimientos
 */

let respuestaSolucionNovedad = "";
/**
 * La función `mostrarRenderFormNovedades` es una función de JavaScript que presenta un formulario
 * basado en el objeto `formulario` proporcionado y lo muestra en el elemento `idVista` especificado.
 * @param idVista - La identificación del elemento HTML donde se representará el formulario.
 * @param formulario - El parámetro `formulario` es un objeto que contiene las siguientes propiedades:
 *  -campos: Respresenta la lista de controles asociados al formulario
 *  - descripcion: La descripción del mismo
 * @param opts - El parámetro `opts` es un objeto opcional que puede contener las siguientes
 * propiedades:
 *  integracionVisual: Para mostrar el renderizado automático al eventoOnchange de cualquier campo de formulario
 */
export function mostrarRenderFormNovedades(idVista, formulario, opts) {
    const {campos, descripcion} = formulario;
    respuestaSolucionNovedad = "";
    
    const vista = $(idVista);
    const htmlFormulario = campos.map(obtenerCampoRenderFormulario).join("");

    const listaDependientes = campos.filter(c => !!c.dependiente);

    vista.html(htmlFormulario);

    if(opts && opts.integracionVisual) 
        vista.append("<p id='integracion_visual-form'></p>");

    const regExp = /\{([a-zA-Z0-9-_]+)\}/gi;

    let res, c;
    while(res = regExp.exec(descripcion)) {
        const [sustitucion, nombre] = res;

        const campo = campos.find(c => c.nombre === nombre);
        const {alerta} = campo;
        const dependientes = camposDependientes(listaDependientes, nombre);
        const elemento = $(`[name="${nombre}"]`, vista)
        
        if(!elemento.parent().hasClass("d-none")) {
            elemento.attr("required", "true");
        }

        elemento.change((e) => {
            if(alerta) mostrarAlerta(e.target.value, alerta);
            if(dependientes.length) mostrarDependientes(dependientes, vista, e.target.value);
            formatearDescripcion(descripcion, vista)
        });

        c++
        if(c >= 100) throw new Error("Prevención de bucle");
    }
}

export const obtenerDescripcion = () => respuestaSolucionNovedad;

/**
 * Filtra una matriz de objetos en función de un valor de campo
 * específico.
 * @param dependientes - Una matriz de objetos que representan a los dependientes. Cada objeto tiene
 * una propiedad llamada "dependiente" que representa el campo dependiente.
 * @param nombreCampo - El parámetro `nombreCampo` es una cadena que representa el nombre de un campo o
 * propiedad.
 * @returns una matriz de dependientes que tienen una propiedad dependiente con un título que coincide
 * con el parámetro nombreCampo.
 */
function camposDependientes(dependientes, nombreCampo) {
    return dependientes
    .filter(dep => {
        const [titleDep] = dep.dependiente.split(":");
        return titleDep === nombreCampo;
    });
}

/**
 * La función "formatearDescripcion" formatea una descripción reemplazando marcadores de posición con
 * valores de un formulario.
 * @param descripcion - El parámetro `descripcion` es una cadena que representa una descripción. Puede
 * contener marcadores de posición en forma de `{fieldName}` que deben reemplazarse con valores reales.
 * @param vista - El parámetro "vista" es una referencia al elemento HTML que contiene las entradas del
 * formulario.
 * @returns la descripción formateada.
 */
function formatearDescripcion(descripcion, vista) {
    let respuestaDescripcion = descripcion;
    const regExp = /\{([a-zA-Z0-9-_]+)\}/gi;

    let res, c;
    while(res = regExp.exec(descripcion)) {
        const [sustitucion, campo] = res;
        const value = $(`[name="${campo}"]`, vista).val();

        respuestaDescripcion = respuestaDescripcion.replace(sustitucion, value);

        c++
        if(c >= 100) throw new Error("Prevención de bucle");
    }

    $("#integracion_visual-form").html(respuestaDescripcion);
    respuestaSolucionNovedad = respuestaDescripcion;
    return respuestaDescripcion;
}

/**
 * Toma un valor y una cadena de alerta, divide la cadena de alerta en una
 * lista de alertas, encuentra la alerta que coincide con el valor dado y muestra un mensaje de
 * advertencia usando la función Swal.fire.
 * @param value - El parámetro de valor es el valor que desea verificar si coincide con alguna de las
 * alertas en el parámetro de alerta.
 * @param alerta - El parámetro "alerta" es una cadena que contiene múltiples alertas separadas por
 * "-". Cada alerta tiene el formato "valor: mensaje".
 * @returns Si se encuentra una alerta con el valor especificado, la función no devolverá nada. Si no
 * se encuentra ninguna alerta, la función tampoco devolverá nada.
 */
function mostrarAlerta(value, alerta) {
    const listaAlertas = alerta.split(" -- ")
    .map(al => al.split(":"));

    const alertaEncontrada = listaAlertas.find(([al]) => al === value);
    if(!alertaEncontrada) return;

    const [val, mensaje] = alertaEncontrada;

    Swal.fire({
        icon: "warning",
        title: mensaje.trim()
    });
}

/**
 * La función "mostrarDependientes" toma una lista de dependientes, una vista y una decisión, y muestra
 * u oculta elementos en la vista según la decisión.
 * @param listaDependientes - Una matriz de objetos que representan a los dependientes. Cada objeto
 * debe tener una propiedad "nombre" que represente el nombre del dependiente y una propiedad
 * "dependiente" que represente la condición de dependencia en el formato "titleDep:val".
 * @param vista - El parámetro "vista" es el elemento vista o contenedor donde se ubican los elementos
 * dependientes. Se utiliza para seleccionar los elementos dependientes mediante jQuery.
 * @param decision - El parámetro `decisión` es un valor que se utiliza para determinar si un elemento
 * dependiente debe mostrarse u ocultarse. Se compara con el valor especificado en la propiedad
 * `dependiente` de cada elemento del array `listaDependientes`. Si los valores coinciden, el elemento
 * se muestra y
 */
function mostrarDependientes(listaDependientes, vista, decision) {
    listaDependientes.forEach(dep => {
        const {nombre} = dep;
        const el = $(`[name="${nombre}"]`, vista);

        const [titleDep, val] = dep.dependiente.split(":");

        if(val === decision) {
            el.parent().removeClass("d-none");
            el.attr("required", "true");
        } else {
            el.parent().addClass("d-none");
            el.removeAttr("required");
            el.val("");
        }
    });
}