function escucha(id, e, funcion) {
    document.getElementById(id).addEventListener(e, funcion)
}

/* En este Script están muchas de la funciones importantes para el funcionamiento de:
    *Plataforma2.htl    *Admin.html
*/

//Muestra en la pantalla lo que el cliente quiere hacer
function mostrar(id) {
    let content = document.getElementById("content").children;
    
    if(id == "" ){
        console.log(content)
        dNone(content);
        content[0].style.display = "block"
    } else {
        if(window.top[id].classList[0] == "container-fluid") {
            dNone(content);
            content[id].style.display = "block"
        }
    }
}

function dNone(content) {
    for(let i = 0; i < content.length; i++){
        content[i].style.display = "none";
    }
}

// revisar este evento onhaschange
window.onload = mostrar(window.location.hash.replace(/#/, ""));
window.addEventListener("hashchange", () => {
    mostrar(window.location.hash.replace(/#/, ""));
})

//// funcion muestra el resultado de busqueda de guia por fecha
function tablaDeGuias(id, datos){
    return `<tr id="historial-guias-row${id}">
        <th>
            <div class="form-check">
                <input class="form-check-input position-static" type="checkbox" value="option1" 
                data-id="${id}" 
                data-funcion="activar-desactivar" aria-label="..." disabled>
            </div>
        </th>
        <th>${id}</th>
        <th>Generando...</th>
        <th>Generando...</th>
        <th>${datos.fecha}</th>
        <th>${datos.nombreR}</th>
        <th>${datos.ciudadD}</th>
        <th>${datos.nombreD}</th>
        <th>$${convertirMiles(datos.valor)}</th>
        <th>$${convertirMiles(datos.costo_envio)}</th>
        <th><button class="btn btn-danger btn-circle" data-id="${id}" id="eliminar_guia${id}" data-funcion="activar-desactivar" disabled>
            <i class="fas fa-trash"></i>
        </button></th> 
    </tr>`
}

//Cada vez que es habilita muestra un mensaje editable
function avisar(title, content, type, redirigir){
    let aviso = document.getElementById("aviso");
    let titulo = document.getElementById("titulo-aviso");
    let texto = document.getElementById("texto-aviso");

    titulo.textContent = title;
    texto.innerText = content;
    titulo.classList.remove("text-warning", "text-danger", "text-primary");
    aviso.children[0].classList.remove("border-left-warning", "border-left-danger", "border-left-primary");
    aviso.classList.remove("d-none");
    aviso.style.opacity = 1;

    titulo.style.cursor = "default";
    texto.style.cursor = "default";
    
    switch(type){
        case "aviso":
            titulo.classList.add("text-warning");
            aviso.children[0].classList.add("border-left-warning");
            break;
        case "advertencia":
            titulo.classList.add("text-danger");
            aviso.children[0].classList.add("border-left-danger");
            break;
        default:
            titulo.classList.add("text-primary");
            aviso.children[0].classList.add("border-left-primary");
    }

    let desaparecer = function (){
        let op = 1;
       let x = setInterval(() => {
        op = op - 0.1
        aviso.style.opacity = op;
        if(op <= 0){
            clearInterval(x);
            if(redirigir){
                location.href = redirigir
            }
            aviso.classList.add("d-none");
        } 
        aviso.addEventListener("mouseover", () => {clearInterval(x); aviso.style.opacity = 1;});
        aviso.addEventListener("mouseleave", () => {setTimeout(desaparecer, 1000)});
        }, 100) 
    } 
    setTimeout(desaparecer, 5000);

    aviso.addEventListener("click", () => {
        aviso.classList.add("d-none");
        if(redirigir){
            location.href = redirigir;
        }
    })
};

avisar("MUESTRA", "que lo que loco, o te vaays");


//// Esta funcion me retorna un card con informacion del usuario, sera invocada por otra funcion
function mostrarUsuarios(data, id){
    return `<div class="col-md-4 mb-4">
    <div class="card border-bottom-info id="${id}" shadow h-100 py-2">
        <div class="card-body">
            <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                    <div class="h4 font-weight-bold text-info text-uppercase mb-2">${data.nombres.split(" ")[0]} ${data.apellidos.split(" ")[0]}</div>
                    <div class="row no-gutters align-items-center">
                        <div class="h6 mb-0 mr-3 font-weight-bold text-gray-800">
                            <p>Nro. de Documento: <small>${data.ingreso}</small></p>
                            <p>Contacto: <small>${data.contacto}</small></p>
                            <p>Direccion: <small>${data.direccion}</small></p>
                        </div>
                    </div>
                </div>
                <div class="col-auto">
                    <i class="fas fa-user fa-2x text-gray-300"></i>
                </div>
            </div>
            <div class="row" data-buscador="${id}">
                <button class="col-12 col-md-5 btn btn-primary" data-funcion="ver-eliminar" value="">Ver Usuario</button>
            </div>
        </div>
    </div>
  </div>`
}

//Retorna una tarjeta con informacion del documento por id
function mostrarDocumentos(id, data, tipo_aviso) {
    return `<div class="col-md-4 mb-4">
    <div class="card border-bottom-${tipo_aviso || "info"} id="${id}" shadow h-100 py-2">
        <div class="card-body">
            <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                    <div class="h4 font-weight-bold text-${tipo_aviso || "info"} text-uppercase mb-2">${data.nombre_usuario}</div>
                    <div class="row no-gutters align-items-center">
                        <div class="h6 mb-0 mr-3 font-weight-bold text-gray-800">
                            <p>Id Guias Generadas: <small>${data.guias}</small></p>
                            <p>Fecha: <small>${data.fecha}</small></p>
                        </div>
                    </div>
                </div>
                <div class="col-auto">
                    <i class="fa fa-file fa-2x text-gray-300" data-id_guia="${id}" 
                    data-guias="${data.guias.toString()}" 
                    data-user="${data.id_user}" data-funcion="descargar-docs" 
                    id="descargar-docs${id}"></i>
                </div>
            </div>
            <div class="row" data-guias="${data.guias.toString()}" data-id_guia="${id}" data-user="${data.id_user}" data-nombre="${data.nombre_usuario}">
                <button class="col-12 col-md-6 btn btn-primary mb-3" data-funcion="descargar" value="">Descargar</button>
                <div class="col-12 col-md-6 dropdown no-arrow mb-3">
                    <button class="col-12 btn btn-info dropdown-toggle" type="button" id="cargar${id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Subir Documentos
                    </button>
                    <div class="dropdown-menu" aria-labelledby="cargar${id}">
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="cargar-relacion-envio${id}">Cargar Relacion de Envíos</label>
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="cargar-guias${id}">Cargar Guías</label>
                    </div>
                </div>
                <input type="file" name="cargar-documentos" data-tipo="relacion-envio" id="cargar-relacion-envio${id}" style="display: none">
                <input type="file" name="cargar-documentos" data-tipo="guias" id="cargar-guias${id}" style="display: none">
                <p id="mostrar-relacion-envio${id}" class="ml-2"></p>
                <p id="mostrar-guias${id}" class="ml-2"></p>
                <button class="btn btn-danger d-none col-12" data-funcion="enviar" id="subir${id}">Subir</button>
            </div>
        </div>
    </div>
  </div>`
}

//Muestra la fecha de hoy
function genFecha(){
    // Genera un formato de fecha AAAA-MM-DD
    let fecha = new Date(), mes = fecha.getMonth() + 1, dia = fecha.getDate();
    if(dia < 10){
        dia = "0" + dia;
    }
    if(mes < 10) {
        mes = "0" + mes;
    }

    return `${fecha.getFullYear()}-${mes}-${dia}`
}

//Retorna una tabla de documentos filtrados
function tablaDeDocumentos(id, datos){
    return `<tr id="historial-docs-row${id}" data-id_doc="${id}">
        <th>${datos.fecha}</th>
        <th>${datos.guias}</th>
        <th>
            <button id="boton-descargar-relacion_envio${id}" class="btn btn-info m-2" disabled>Descargar Relacion</button>
        </th>
        <th>
            <button id="boton-descargar-guias${id}" class="btn btn-info m-2" disabled>Descargar Guías</button>
        </th>
    </tr>`
}

//Actiualiza todos los inputs de fechas que hay en el documento
for(let input_fecha of document.querySelectorAll('[type="date"]')) {
    input_fecha.value = genFecha();
}

//Activa los inputs y btones de cada guia que no haya sido enviada
function activarBotonesDeEnvio(id, enviado){
    let activos = document.querySelectorAll('[data-funcion="activar-desactivar"]');
      for (let actv of activos){
          if(id == actv.getAttribute("data-id")){
              actv.setAttribute("data-enviado", enviado)
          }
        let revisar = actv.getAttribute("data-enviado");
        if(revisar != "true"){
          actv.removeAttribute("disabled");
        } else {
            actv.setAttribute("disabled", "true")
        }
      }

      let eliminarGuia = document.getElementById("eliminar_guia"+id).addEventListener("click", () => {
          let confirmacion = confirm("Si lo elimina, no lo va a poder recuperar, ¿Desea continuar?");
          if(confirmacion){
              firebase.firestore().collection("usuarios").doc(localStorage.user_id).collection("guias").doc(id).delete().then(() => {
                  console.log("Document successfully deleted!");
                  avisar("Guia Eliminada", "La guia Número " + id + " Ha sido eliminada", "alerta");
                  document.getElementById("historial-guias-row"+id).remove();
              }).catch((error) => {
                  console.error("Error removing document: ", error);
              });
          }
      })
}

//funcion que me devuelve a los inputs que estan escritos incorrectamente o vacios
function verificador(arr, boolean) {
    let inputs = document.getElementsByTagName("input");
    let primerInput;
    for(let i = 0; i < inputs.length; i++){
        inputs[i].classList.remove("border-danger", "border");
    }

    if(arr){
        if(typeof arr == "string") {
            addId(arr)
            primerInput = document.getElementById(arr).parentNode;
        } else {
            let error = [];
            for(let id of arr){
                addId(id)
                if(addId(id)){
                    error.push(id);
                    primerInput = document.getElementById(error[0]).parentNode;
                }
            }
        }
        primerInput.scrollIntoView({
            behavior: "smooth"
        })
        console.log(primerInput)
    }
    
    function addId(id){
        let elemento = document.getElementById(id);
        if(elemento.value == ""){
            elemento.classList.add("border", "border-danger");
            return true
        } else if(boolean) {
            elemento.classList.add("border", "border-danger");
            return true
        } else {
            elemento.classList.remove("border-danger");
            return false
        }
    }

}