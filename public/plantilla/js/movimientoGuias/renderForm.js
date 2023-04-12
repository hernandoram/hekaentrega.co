import { obtenerCampoRenderFormulario } from "./views.js";

let respuestaSolucionNovedad = "";
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

function camposDependientes(dependientes, nombreCampo) {
    return dependientes
    .filter(dep => {
        const [titleDep] = dep.dependiente.split(":");
        return titleDep === nombreCampo;
    });
}

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