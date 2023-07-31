export const campoFormulario = (campo, i) => {
    console.log(campo);
    return(
    `
<div class="row border border-info my-2 p-2 rounded position-relative">
    
    <span 
    class="${i!=0? "" : "d-none"} position-absolute p-2 text-center" 
    style="right: 0; top: 0; cursor: pointer; height: 30px; width: 30px; z-index: 2"
    data-action="quitar-campo"
    data-index="${i}"
    >&times;</span>

    <div class="form-group col-md-6">
        <label for="nombre-mensajeria-${i}">Nombre</label>
        <input type="text" class="form-control" id="nombre-mensajeria-${i}" value="${campo.nombre || ""}" placeholder="Identificador de la respuesta para enviarla a la administración" name="nombre">
    </div>

  

    <div class="form-group col-md-6">
        <label for="tipo-mensajeria-${i}">Tipo</label>
        <select class="custom-select"
        data-action="select-tipo"
        data-index="${i}"
        id="tipo-mensajeria-${i}" value="${campo.tipo || ""}" name="tipo">
            <option value="input" ${campo.tipo === "input" ? "selected" : ""}>Texto</option>
            <option value="select" ${campo.tipo === "select" ? "selected" : ""}>Selección</option>
            <option value="textarea" ${campo.tipo === "textarea" ? "selected" : ""}>Descriptivo</option>
        </select>
    </div>

    <div class="form-group col-md-12">
    <label for="etiqueta-mensajeria-${i}">Etiqueta</label>
    <input type="text" class="form-control" id="etiqueta-mensajeria-${i}" placeholder="Esta información es la que se le despliega al usuario" value="${campo.etiqueta || ""}" name="etiqueta">
</div>

   

    <div class="form-group col-md-6 ${campo.opciones ? '' : 'd-none'}">
    <label for="opciones-mensajeria-${i}">Opciones</label>
    <input type="text" class="form-control" id="opciones-mensajeria-${i}"
    placeholder="Si" 
    value="${campo.opciones1 || ""}" name="opciones1">

    <input type="text" class="form-control mt-2" id="opciones-mensajeria2-${i}"
    placeholder="No" 
    value="${campo.opciones2 || ""}" name="opciones2">

    <input type="text" class="form-control mt-2  ${campo.opciones3 ?"" : 'd-none'}" id="opciones-mensajeria3-${i}"
    placeholder="Quizas"
    value="${campo.opciones3 || ""}" name="opciones3">

    <input type="text" class="form-control mt-2 ${campo.opciones4 ?"" : 'd-none'}" id="opciones-mensajeria4-${i}"
    placeholder="De pronto"
    value="${campo.opciones4 || ""}" name="opciones4">
</div>


     <div class="form-group col-md ${campo.opciones ? '' : 'd-none'}">
    <label for="alerta-mensajeria-${i}">Alertas</label>

    <input type="text" class="form-control" id="alerta-mensajeria-${i}"
    placeholder="Alerta uno"
    value="${campo.alerta1 || ""}" name="alerta1">


    <input type="text" class="form-control mt-2" id="alerta-mensajeria2-${i}"
    placeholder="Alerta dos"
    value="${campo.alerta2 || ""}" name="alerta2">

    <input type="text" class="form-control mt-2 ${campo.alerta3 || campo.opciones3 ?"" : 'd-none'}" id="alerta-mensajeria3-${i}"
    placeholder="Alerta tres"
    value="${campo.alerta3 || ""}" name="alerta3">

    <input type="text" class="form-control mt-2 ${campo.alerta4 || campo.opciones4 ?"" : 'd-none'}" id="alerta-mensajeria4-${i}"
    placeholder="Alerta cuatro"
    value="${campo.alerta4 || ""}" name="alerta4">


    </div> 

    <div class="col-md-12 d-none align-items-center"
    id="select-opciones-${i}" >

    <p class="mt-0 mb-0 mr-2">Número de opciones</p>

    <select id="selectInputs-${i}" data-action="select-no-inputs" data-index="${i}">
    <option value="">-</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    </select>

    </div>
    
    <div class="form-group col-md-12 ${i != 0 ? "" : "d-none"} mb-0">

    <label><input type="checkbox" data-action="depender-campo" data-index="${i}" id="cbox-${i}" value="" /> este campo depende de otro?</label
    
    <div>

    <input type="text" class="form-control d-none" id="despendiente-mensajeria-${i}"

    placeholder="nombre:valor"

    value="${campo.dependiente || ""}" name="dependiente">

    </div>

    </div>

    </div>


`)};

  


export const obtenerCampoRenderFormulario = (campo, i) => {
    const opciones = campo.opciones ? campo.opciones.split(",") : [];
    switch(campo.tipo) {
        case "input": 
            return (`
                <div class="form-group ${campo.dependiente ? 'd-none' : ''}">
                    <label for="${campo.nombre}-mensajeria">${campo.etiqueta}</label>
                    <input class="form-control" id="${campo.nombre}-mensajeria" name="${campo.nombre}" />
                </div>
            `);

        case "textarea": 
            return (`
                <div class="form-group ${campo.dependiente ? 'd-none' : ''}">
                    <label for="${campo.nombre}-mensajeria">${campo.etiqueta}</label>
                    <textarea class="form-control" id="${campo.nombre}-mensajeria" name="${campo.nombre}"></textarea>
                </div>
            `);

        case "select": 
            return (`
                <div class="form-group ${campo.dependiente ? 'd-none' : ''}">
                    <label for="${campo.nombre}-mensajeria">${campo.etiqueta}</label>
                    <select class="custom-select"
                    id="${campo.nombre}-mensajeria" name="${campo.nombre}">
                        ${["<option value>-- Seleccione --</option>"].concat(opciones.map(op => `<option value="${op}">${op}</option>`)).join("")}
                    </select>
                </div>
            `);
    }
}