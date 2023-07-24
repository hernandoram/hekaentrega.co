export const campoFormulario = (campo, i) => {
    console.log(campo);
    console.log("hola");
    return(
    `
<div class="row border border-info my-2 p-2 rounded position-relative">
    
    <span 
    class="position-absolute p-2 text-center" 
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
    placeholder="opt1,opt2,opt3"
    value="${campo.opciones || ""}" name="opciones">

    <input type="text" class="form-control" id="opciones-mensajeria2-${i}"
    placeholder="opt1,opt2,opt3"
    value="${campo.opciones2 || ""}" name="opciones2">
</div>


     <div class="form-group col-md ${campo.opciones ? '' : 'd-none'}">
    <label for="alerta-mensajeria-${i}">Alertas</label>
    <input type="text" class="form-control" id="alerta-mensajeria-${i}"
    placeholder="opt1:Alerta uno -- opt2:Alerta dos"
    value="${campo.alerta || ""}" name="alerta">
    </div> 

  
</div>
`)};

{/* <div class="form-group col-md-3 ${campo.tipo==="select" ? '' : 'd-none'}">
<label for="despendiente-mensajeria-${i}">Dependiente</label>
<input type="text" class="form-control" id="despendiente-mensajeria-${i}"
placeholder="nombre:valor"
value="${campo.dependiente || ""}" name="dependiente">
</div> */}


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