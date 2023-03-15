import { obtenerCampoRenderFormulario } from "./views.js";

export function mostrarRenderFormNovedades(idVista, formulario, opts) {
    const {campos, descripcion} = formulario;
    

    const vista = $(idVista);
    const htmlFormulario = campos.map(obtenerCampoRenderFormulario).join("");

    vista.html(htmlFormulario);

    if(opts.integracionVisual) 
        vista.append("<p id='integracion_visual-form'></p>");

    const regExp = /\{([a-zA-Z0-9-_]+)\}/gi;

    let res, c;
    while(res = regExp.exec(descripcion)) {
        const [sustitucion, campo] = res;
        $(`[name="${campo}"]`, vista).change(() => formatearDescripcion(descripcion, vista));
        c++
        if(c >= 100) throw new Error("Prevención de bucle");
    }
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
}