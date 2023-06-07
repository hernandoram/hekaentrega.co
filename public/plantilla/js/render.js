var firebaseConfig = {
    apiKey: "AIzaSyCtzXKSoweSMLPej5-MbkTfQzFH719y-MM",
    authDomain: "hekaapp-23c89.firebaseapp.com",
    databaseURL: "https://hekaapp-23c89.firebaseio.com",
    projectId: "hekaapp-23c89",
    storageBucket: "hekaapp-23c89.appspot.com",
    messagingSenderId: "539740310887",
    appId: "1:539740310887:web:66f9ab535d18addeb173c2",
    measurementId: "G-47CYMPHNRM"
};

const estadosGuia = {
    novedad: "NOVEDAD",
    pedido: "PEDIDO",
    pagada: "PAGADA",
    finalizada: "FINALIZADA",
    generada: "GENERADA",
    proceso: "TRANSITO",
    empacada: "EMPACADA",
    eliminada: "ELIMINADA",
    neutro: "NEUTRO" // formalmente ninguna guía debería ener registraod este estado
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();

function escucha(id, e, funcion) {
    document.getElementById(id).addEventListener(e, funcion)
}

/* En este Script están muchas de la funciones importantes para el funcionamiento de:
    *Plataforma2.htl    *Admin.html
*/

//Muestra en la pantalla lo que el cliente quiere hacer
function mostrar(id) {
    let content = document.getElementById("content").children;

    if(id == "" || !window.top[id]){
        dNone(content);
        content[0].style.display = "block"
        let firstItem = $(".nav-item:first").addClass("active");
    } else {
        if(window.top[id].classList[0] == "container-fluid") {
            dNone(content);
            content[id].style.display = "block"
            $(".nav-item, .collapse-item").removeClass("active");
            
            let item = $("[href='#"+id+"']");
            item.parents(".nav-item").addClass("active");
            if(item.hasClass("collapse-item")) item.addClass("active");
        } else if (window.top[id].classList[0] == "container" || 
        window.top[id].nodeName == "BODY") {

        } else {
            mostrar(window.top[id].parentNode.getAttribute("id"))
        }
    }

}

//Función invocada desde mostrar() para ocultar todos los elementos principales
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
    return `<tr id="historial-guias-row${id}"
        data-id="${id}
        data-costo_envio="${datos.costo_envio}"
        data-debe=${datos.debe}
    >
        <td 
        data-search="${datos.filtrar}">
            <div class="form-check text-center">
                <input class="form-check-input position-static check-guias" type="checkbox"
                data-id="${id}" data-numeroGuia="${datos.numeroGuia}"
                data-prueba="${datos.prueba}" data-id_archivoCargar="${datos.id_archivoCargar}"
                data-type="${datos.type}" data-has_sticker="${datos.has_sticker}"
                data-transportadora="${datos.transportadora}"
                data-funcion="activar-desactivar" aria-label="..." disabled>
                <span class="sr-only">${!datos.debe ? "PAGADA" : ""}</span>
            </div>
        </td>
        <td class="d-flex justify-content-around flex-wrap">
            <button class="btn btn-primary btn-circle btn-sm mt-2" data-id="${id}"
            id="ver_detalles${id}" data-toggle="modal" data-target="#modal-detallesGuias"
            title="Detalles">
                <i class="fas fa-search-plus"></i>
            </button>

            <button class="btn btn-primary btn-circle btn-sm mt-2" data-id="${id}"
            id="descargar_documento${id}" title="Descargar Documentos">
                <i class="fas fa-file-download"></i>
            </button>

            <button class="btn btn-primary btn-circle btn-sm mt-2" data-id="${id}"
            data-funcion="activar-desactivar" data-activate="after"
            id="generar_rotulo${id}" title="Generar Rótulo">
                <i class="fas fa-ticket-alt"></i>
            </button>
            
            ${datos.numeroGuia ? 
                `<button class="btn btn-primary btn-circle btn-sm mt-2" data-id="${id}"
                id="ver_movimientos${id}" data-toggle="modal" data-target="#modal-gestionarNovedad"
                title="Revisar movimientos">
                    <i class="fas fa-truck"></i>
                </button>` : ""}

            ${datos.numeroGuia && !datos.has_sticker && generacion_automatizada ?
                `<button class="btn btn-primary btn-circle btn-sm mt-2" data-id="${id}"
                data-funcion="activar-desactivar"
                id="crear_sticker${id}" title="Crear Sticker de la guía">
                    <i class="fas fa-stamp"></i>
                </button>` : ""
            }                

            <button class="btn btn-success btn-circle btn-sm mt-2" data-id="${id}" 
            id="clonar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}" disabled
            title="Clonar Guía">
                <i class="fas fa-clone"></i>
            </button>

            <button class="btn btn-danger btn-circle btn-sm mt-2" data-id="${id}" 
            id="eliminar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}" disabled
            title="Eliminar Guía">
                <i class="fas fa-trash"></i>
            </button>
        </td>

        <td>${id}</td>
        <td>${datos.numeroGuia}</td>
        <td>${datos.estado}</td>
        <td>${datos.nombreD}</td>
        <td>
            <a class="btn btn-light d-flex align-items-baseline mb-1" href="https://api.whatsapp.com/send?phone=57${datos.telefonoD.toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${datos.telefonoD}</a>
            <a class="btn btn-light d-flex align-items-baseline" href="https://api.whatsapp.com/send?phone=57${datos.celularD.toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${datos.celularD}</a>
        </td>
        <td>${datos.transportadora || "SERVIENTREGA"}</td>
        <td>${datos.type || "Pago Contraentrega"}</td>
        <td>${datos.fecha}</td>
        <td>${datos.ciudadD}</td>
        <td>${datos.seguro || datos.valor}</td>
        <td>${datos.valor}</td>
        <td>${datos.costo_envio}</td>

    </tr>`
}

//Cada vez que es habilita muestra un mensaje editable
function avisar(title, content, type, redirigir, tiempo = 5000){
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
    setTimeout(desaparecer, tiempo);

    aviso.addEventListener("click", () => {
        aviso.classList.add("d-none");
        if(redirigir){
            location.href = redirigir;
        }
    })
};
//// Esta funcion me retorna un card con informacion del usuario, sera invocada por otra funcion
function mostrarOficinas(data, id){

    const bodegas = data.bodegas ? data.bodegas : [];
    // let bodega = data.bodegas ? data.bodegas.filter(b => b.principal)[0] : false
    let bodega = bodegas.filter(b => !b.inactiva)[0];

    let bodegasFilter = "";
    if(bodegas) {
        bodegas.forEach((b,i) => {
            bodegasFilter += "data-filter-direccion-"+i+"='"+b.direccion_completa+"'"
        });
    }

    return `<div class="col-md-4 mb-4" 
    data-filter-nombres="${data.nombres}" data-filter-apellidos="${data.apellidos}"
    data-filter-centro_de_costo="${data.centro_de_costo}" ${bodegasFilter} data-filter-celular="${data.celular + "-" +data.celular2}">
    <div class="card border-bottom-info" id="${id}" shadow="h-100 py-2">
        <div class="card-body">
            <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                ${data.nombres ? (
                    `<div class="h4 font-weight-bold text-info text-uppercase mb-2 ${data.visible===true ?"text-danger"  :"text-primary"   }">${data.nombres.split(" ")[0]} ${data.apellidos.split(" ")[0]}</div>`
                    
                    ) : (
                       ` <div class="h4 font-weight-bold text-info text-uppercase mb-2">Oficina sin nombre</div>`
                        
                )}

                    <div class="row no-gutters align-items-center">
                        <div class="h6 mb-0 mr-3 font-weight-bold text-gray-800">
                            <p>Nro. de Documento: <small>${data.numero_documento}</small></p>
                            <p>Contacto: <small>${data.celular}</small></p>
                            <p>Ciudad: <small>${data.ciudad ? data.ciudad : "No cuenta con ciudad."}</small></p>
                        </div>
                    </div>
                </div>
                <div class="col-auto">
                    <i class="fas fa-user fa-2x text-gray-300"></i>
                </div>
            </div>
            <div class="btn-group" role="group" data-buscador="${id}" 
            >
                <button class="btn btn-primary" onclick="mostrarOficina('${data.id}')" data-funcion="ver-eliminar" value="">Ver Oficina</button>
                <button class="btn btn-info" data-funcion="movimientos" value="">Ver Movimientos</button>
            </div>
            <div class="custom-control custom-switch text-center mt-1">
                <input type="checkbox" class="custom-control-input activador_automaticas" data-id="${id}"
                id="switch-guias_automaticas_${id}" ${data.generacion_automatizada && "checked"}>
                <label class="custom-control-label" for="switch-guias_automaticas_${id}">Usuario automatizado</label>
            </div>
        </div>
    </div>
  </div>`
}





//// Esta funcion me retorna un card con informacion del usuario, sera invocada por otra funcion
function mostrarUsuarios(data, id){
    const bodegas = data.bodegas ? data.bodegas : [];
    // let bodega = data.bodegas ? data.bodegas.filter(b => b.principal)[0] : false
    let bodega = bodegas.filter(b => !b.inactiva)[0];

    let bodegasFilter = "";
    if(bodegas) {
        bodegas.forEach((b,i) => {
            bodegasFilter += "data-filter-direccion-"+i+"='"+b.direccion_completa+"'"
        });
    }

    return `<div class="col-md-4 mb-4" 
    data-filter-nombres="${data.nombres}" data-filter-apellidos="${data.apellidos}"
    data-filter-centro_de_costo="${data.centro_de_costo}" ${bodegasFilter} data-filter-celular="${data.celular + "-" +data.celular2}">
    <div class="card border-bottom-info" id="${id}" shadow="h-100 py-2">
        <div class="card-body">
            <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                    <div class="h4 font-weight-bold text-info text-uppercase mb-2">${data.nombres.split(" ")[0]} ${data.apellidos.split(" ")[0]}</div>
                    <div class="row no-gutters align-items-center">
                        <div class="h6 mb-0 mr-3 font-weight-bold text-gray-800">
                            <p>Nro. de Documento: <small>${data.numero_documento}</small></p>
                            <p>Contacto: <small>${data.celular}</small></p>
                            <p>Correo: <small>${data.correo}</small></p>
                            <p>Bodega principal: <small>${bodega ? bodega.direccion_completa : "No cuenta con bodega activa."}</small></p>
                        </div>
                    </div>
                </div>
                <div class="col-auto">
                    <i class="fas fa-user fa-2x text-gray-300"></i>
                </div>
            </div>
            <div class="btn-group" role="group" data-buscador="${id}" 
            data-nombre="${data.nombres.split(" ")[0]} ${data.apellidos.split(" ")[0]}">
                <button class="btn btn-primary" data-funcion="ver-eliminar" value="">Ver Usuario</button>
                <button class="btn btn-info" data-funcion="movimientos" value="">Ver Movimientos</button>
            </div>
            <div class="custom-control custom-switch text-center mt-1">
                <input type="checkbox" class="custom-control-input activador_automaticas" data-id="${id}"
                id="switch-guias_automaticas_${id}" ${data.generacion_automatizada && "checked"}>
                <label class="custom-control-label" for="switch-guias_automaticas_${id}">Usuario automatizado</label>
            </div>
        </div>
    </div>
  </div>`
}

//Retorna una tarjeta con informacion del documento por id
function mostrarDocumentos(id, data, tipo_aviso) {
    return `<div class="col-sm-6 col-lg-4 mb-4 document-filter" 
    data-filter_user="${data.centro_de_costo}"
    data-filter_transportadora="${data.transportadora || "SERVIENTREGA"}"
    data-filter_type="${data.type ? data.type.replace(/\s/g, "") : "PAGOCONTRAENTREGA"}"
    >
    <div class="card shadow h-100" id="${id}">
        <h6 class='text-center card-header'>${data.transportadora || "Servientrega"}</h6>

        <div class="card-body">
            <i class="fa fa-eye${!data.important ? "-slash" : ""} float-right resaltar-doc"
            data-id="${id}" data-important="${data.important}"
            style="cursor: pointer;"></i>
            <h5 class="card-title font-weight-bold text-${tipo_aviso || "info"} text-uppercase mb-2">${data.nombre_usuario}</h5>
            <h6 class="card-subtitle text-muted mb-2">${data.centro_de_costo || "Centro de costo"}</h6>
            <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                    <div class="row no-gutters align-items-center">
                        <div class="h6 mb-0 mr-3 font-weight-bold text-gray-800 w-100">
                            <p class="text-truncate"
                            style="cursor: zoom-in"
                            data-mostrar="texto">Id Guias Generadas: <br><small class="text-break">${data.guias}</small> </p>
                            <p>Tipo: <small class="text-break">${data.type || "PAGO CONTRAENTREGA"}</span></p>
                            <p>Fecha: <small>${data.fecha}</small></p>
                        </div>
                    </div>
                </div>
                <div class="col-auto">
                    <i class="fa fa-file fa-2x text-gray-300" data-id_guia="${id}" 
                    data-guias="${data.guias}" data-nombre_guias="${data.nombre_guias}"
                    data-nombre_relacion="${data.nombre_relacion}"
                    data-user="${data.id_user}" data-funcion="descargar-docs" 
                    id="descargar-docs${id}"></i>

                    <span class="badge-pill badge-primary float-right">${data.guias.length}</span>
                </div>
            </div>
            <form enctype="multipart/form-data" id="form-estado-numguia${id}" class="row" data-guias="${data.guias}" data-type="${data.type}"
            data-id_guia="${id}" data-user="${data.id_user}" 
            data-nombre="${data.nombre_usuario}" data-transportadora="${data.transportadora || "SERVIENTREGA"}">
                <button class="col-12 col-md-6 btn btn-primary mb-3 text-truncate" title="Descargar Excel" data-funcion="descargar" value="">Descargar</button>
                <div class="col-12 col-md-6 dropdown no-arrow mb-3">
                    <button class="col-12 btn btn-info dropdown-toggle text-truncate" title="Subir documentos" type="button" id="cargar${id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Subir Documentos
                    </button>
                    <div class="dropdown-menu" aria-labelledby="cargar${id}">
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="cargar-relacion-envio${id}">Cargar Relacion de Envíos</label>
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="cargar-guias${id}">Cargar Guías</label>
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="actualizar-num-guia${id}">Actualizar Guia</label>
                    </div>
                </div>
                <input class="cargar-documentos" type="file" data-tipo="relacion-envio" id="cargar-relacion-envio${id}" style="display: none">
                <input class="cargar-documentos" type="file" data-tipo="guias" id="cargar-guias${id}" style="display: none">
                <input class="cargar-documentos" type="file" name="documento" data-tipo="num-guia" id="actualizar-num-guia${id}" style="display: none">
                <p id="mostrar-relacion-envio${id}" class="ml-2" 
                style="text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;"></p>
                
                <p id="mostrar-guias${id}" class="ml-2" 
                style="text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;"></p>
                
                <button class="btn btn-danger d-none col-12" data-funcion="enviar" id="subir${id}">Subir</button>
            </form>


        </div>
    </div>
  </div>`
}

//Muestra la fecha de hoy
function genFecha(direccion, milliseconds){
    // Genera un formato de fecha AAAA-MM-DD
    let fecha = new Date(milliseconds || new Date()), mes = fecha.getMonth() + 1, dia = fecha.getDate();
    if(dia < 10){
        dia = "0" + dia;
    }
    if(mes < 10) {
        mes = "0" + mes;
    }
    if(direccion == "LR"){
        return `${dia}-${mes}-${fecha.getFullYear()}` 
    } else
    return `${fecha.getFullYear()}-${mes}-${dia}`
}

//Retorna una tabla de documentos filtrados
function mostrarDocumentosUsuario(id, data){
    return `<div class="col-sm-6 col-lg-4 mb-4">
    <div class="card border-bottom-info shadow h-100 py-2" id="${id}">
        <h6 class='text-center card-header'>${data.transportadora || "Servientrega"}</h6>

        <div class="card-body">
        <h5 class="card-title font-weight-bold text-info text-uppercase mb-2">${data.nombre_usuario}</h5>
        <div class="row no-gutters align-items-center">
            <div class="col mr-2">
                <div class="row no-gutters align-items-center">
                    <div class="h6 mb-0 mr-3 font-weight-bold text-gray-800 w-100">
                        <p class="text-truncate"
                        style="cursor: zoom-in"
                        data-mostrar="texto">Id Guias Generadas: <br><small class="text-break">${data.guias}</small> </p>
                        <p>Tipo: <small class="text-break">${data.type || "PAGO CONTRAENTREGA"}</span></p>
                        <p>Fecha: <small>${data.fecha}</small></p>
                    </div>
                </div>
            </div>
            <div class="col-auto">
                <i class="fa fa-file fa-2x text-gray-300" data-id_guia="${id}" 
                data-guias="${data.guias}" data-nombre_guias="${data.nombre_guias}"
                data-nombre_relacion="${data.nombre_relacion}"
                data-user="${data.id_user}" data-funcion="descargar-docs" 
                id="descargar-docs${id}"></i>

                <span class="badge-pill badge-primary float-right">${data.guias.length}</span>
            </div>
        </div>
            <div class="row" data-guias="${data.guias.toString()}" data-id_guia="${id}" data-user="${data.id_user}" data-nombre="${data.nombre_usuario}">
                <div class="d-none">
                    <button class="col-12 btn btn-info mb-2" 
                    type="button" id="boton-descargar-guias${id}" disabled>
                        Descargar Guías
                    </button>
                    <button class="col btn btn-info mb-2" 
                    type="button" id="boton-descargar-relacion_envio${id}" disabled>
                        Descargar Manifiesto
                    </button>
                    <button class="col-12 btn btn-info mb-2" 
                    type="button" id="boton-generar-rotulo${id}">Genera Rótulo</button>
                </div>
                <div class="col-12 dropdown">
                    <button class="col-12 btn btn-info dropdown-toggle text-truncate" title="Subir documentos" type="button" id="acciones-documento${id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Descargar
                    </button>
                    <div class="dropdown-menu" aria-labelledby="acciones-documento${id}">
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="boton-descargar-guias${id}">Guías</label>
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="boton-descargar-relacion_envio${id}">Manifiesto</label>
                        <label class="dropdown-item form-control" data-funcion="cargar-documentos" for="boton-generar-rotulo${id}">Rótulos</label>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>`
}

//Actiualiza todos los inputs de fechas que hay en el documento
for(let input_fecha of document.querySelectorAll('[type="date"]')) {
    input_fecha.value = genFecha();
}

//Activa los inputs y btones de cada guia que no haya sido enviada
function activarBotonesDeGuias(id, data, activate_once){
    let activos = document.querySelectorAll('[data-funcion="activar-desactivar"]');
      for (let actv of activos){
        if(id == actv.getAttribute("data-id")){
            actv.setAttribute("data-enviado", data.enviado);
            actv.setAttribute("data-deletable", data.deletable);
        }

        let revisar = actv.getAttribute("data-enviado");
        let when = actv.getAttribute("data-activate");
        let operador = when != "after" ? revisar != "true" : revisar == "true";

        if(operador || estado_prueba){
          actv.removeAttribute("disabled");
        } else {
          actv.setAttribute("disabled", "true")
        }

      }

      if(activate_once) {
        $("#eliminar_guia"+id).on("click", async function(e) {
            // let confirmacion = confirm("Si lo elimina, no lo va a poder recuperar, ¿Desea continuar?");
            const resp = await Swal.fire({
                title: '¡AENCIÓN',
                text: "Estás a punto de eliminar la guía Nro. " + id + ", Si la elimina, no lo va a poder recuperar, ¿Desea continuar?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '¡Si! continuar 👍',
                cancelButtonText: "¡No, me equivoqué!"
            });

            const confirmacion = resp.isConfirmed;

            if(confirmacion && 
                (this.getAttribute("data-enviado") != "true" || this.getAttribute("data-deletable") != "false")
            ){
                $("#enviar-documentos").prop("disabled", true);
                this.disabled = true;
                this.display = "none";
                usuarioAltDoc(data.id_user).collection("guias")
                .doc(id).update({deleted: true, fecha_eliminada: new Date(), estadoActual: estadosGuia.eliminada}).then((res) => {
                    console.log(res);
                    console.log("Document successfully deleted!");
                    avisar("Guia Eliminada", "La guia Número " + id + " Ha sido eliminada", "alerta");
                    $("#enviar-documentos").prop("disabled", false);
                    // row.remove();
                }).catch((error) => {
                    console.error("Error removing document: ", error);
                    $("#enviar-documentos").prop("disabled", false);

                });
            } else {
                avisar("No permitido", "La guia Número " + id + " no puede ser eliminada", "advertencia");
            }
        });

        $("#ver_movimientos"+id).on("click", e => {
        document.getElementById("contenedor-gestionarNovedad").innerHTML = ""
        document.getElementById("contenedor-gestionarNovedad").innerHTML = `
            <div class="d-flex justify-content-center align-items-center"><h1 class="text-primary">Cargando   </h1><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>
        `;
        usuarioAltDoc(data.id_user).collection("estadoGuias").doc(id)
        .get().then(doc => {
            console.log(doc.data());
            if(doc.exists) {
                gestionarNovedadModal(doc.data(), data);
            } else {
                document.getElementById("contenedor-gestionarNovedad").innerText = "El estado de esta guía aún no ha sido actualizado"; 
            }
        })
        });

        $("#clonar_guia"+id).on("click", () => {
            Swal.fire({
                title: "Clonando",
                html: "Por favor espere mientra generamos el nuevo número de guía.",
                didOpen: () => {
                    Swal.showLoading();
                },
                allowOutsideClick: false,
                allowEnterKey: false,
                showConfirmButton: false,
                allowEscapeKey: true
            })
            usuarioAltDoc(data.id_user).collection("guias").doc(id)
            .get().then(doc => {
                enviar_firestore(doc.data()).then(res => {
                    if(res.icon === "success") {
                        Swal.fire({
                            icon: "success",
                            title: res.title,
                            text: res.mensaje,
                            timer: 6000,
                            showCancelButton: true,
                            confirmButtonText: "Si, ir al cotizador.",
                            cancelButtonText: "No, ver el historial."
                
                        }).then((res) => {
                            if(res.isConfirmed) {
                                location.href = "plataforma2.html";
                            } else {
                                location.href = "#historial_guias";
                                cambiarFecha();
                            }
                        })
                    } else {
                        Swal.fire({
                            icon: res.icon,
                            title: res.title,
                            html: res.mensaje
                        })
                    }
                });
            })
        })

        $("#descargar_documento"+id).on("click", e => {
            firebase.firestore().collection("documentos").where("guias", "array-contains", id).get()
            .then(querySnapshot => {
                if (!querySnapshot.size) {
                    avisar("Sin documento", "Esta guía no tiene ningún documento asignado aún", "aviso");
                }
                querySnapshot.forEach(doc => {
                    console.log(doc.data());
                    console.log(doc.id)
                    if(doc.data().descargar_relacion_envio && doc.data().descargar_guias) {
                        descargarDocumentos(doc.id);
                    } else {
                        avisar("No permitido", "Aún no están disponibles ambos documentos", "aviso");
                    }
                })
            })
        });

        $("#ver_detalles" + id).click(verDetallesGuia)

        $("#generar_rotulo" + id).click(function() {
            let id = this.getAttribute("data-id");
            const guiaPunto = this.getAttribute("data-punto");
            if(guiaPunto) {
                imprimirRotuloPunto(id);
            } else {
                firebase.firestore().collection("documentos").where("guias", "array-contains", id)
                .get().then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        generarRotulo(doc.data().guias);
                    })
                })
            }
        })

        $("#crear_sticker" + id).click(crearStickerParticular);

        $("#editar_guia" + id).click(editarGuiaCreada);

        $("#empacar-" + id).on("change", empacarGuia);

        $("#gestionar-novedad-" + id).on("click", gestionarNovedad);
      }

}


function crearStickerParticular() {
    swal.fire({
        title: "Creando Sticker",
        html: "Estamos trabajando en ello, por favor espere...",
        didOpen: () => {
            Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEnterKey: false,
        showConfirmButton: false,
        allowEscapeKey: true
    });
    const id_heka = this.getAttribute("data-id");
    const id_user = this.getAttribute("data-id_user");
    console.log(id_heka)
    usuarioAltDoc(id_user).collection("guias").doc(id_heka).get()
    .then(async doc => {
        if(doc.exists) {
            const data = doc.data();
            const para_crear = {
                numeroGuia: data.numeroGuia,
                id_heka: data.id_heka,
                id_archivoCargar: data.id_archivoCargar, // paraservientrega (no es tan necesario)
                prueba: data.prueba,
                url: data.urlGuia, 
                oficina: data.oficina,
                type: data.type
            }
    
            let has_sticker;
    
            if(data.transportadora === "INTERRAPIDISIMO") {
                has_sticker = await generarStickerGuiaInterrapidisimo(para_crear);
            } else if (data.transportadora === "SERVIENTREGA") {
                has_sticker = await guardarStickerGuiaServientrega(para_crear);
            } else if(data.transportadora === "ENVIA") {
                has_sticker = await guardarStickerGuiaEnvia(para_crear);
            } else if(data.transportadora === "COORDINADORA") {
                has_sticker = await guardarStickerGuiaCoordinadora(para_crear);
            } else {
                has_sticker = await guardarStickerGuiaAveo(para_crear);
            }
    
            try {
                if(!has_sticker) throw "No se creó el sticker";

                doc.ref.update({has_sticker}).then(() => {
                    Toast.fire({
                        icon: "success",
                        text: "Sticker de guía creado exitósamente"
                    });
                    
                    actualizarHistorialDeDocumentos();
                });

            } catch (e){
                console.log(e);
                Toast.fire({
                    icon: "error",
                    text: "Lo siento, hubo un error para guardar el sticker"
                });
            }
        }
    })
}

function editarGuiaCreada() {
    const formEditarGuia = `
    <form action="#" id="editar_guia" class="row">
        <div class="col-sm-4">
            <div class="form-group">
                <label for="nombre-editar_guia">Nombre destinatario</label>
                <input type="text" class="form-control" id="nombre-editar_guia" name="nombreD" maxlength="15">
            </div>
        </div>

        <div class="col-sm-4 mb-2">
            <label for="identificacionD-editar_guia">Documento de identificación</label>
            <input type="number" id="identificacionD-editar_guia" name="identificacionD" class="form-control form-control-user" value="" placeholder="ej. 123456789" required="">
        </div>
        <div class="col-sm-4 mb-2">
            <label for="tipo-doc-dest-editar_guia" class="col-form-label">Tipo De Documento</label>
            <select class="custom-select" form="datos-destinatario" id="tipo-doc-dest-editar_guia" name="tipo_doc_dest">
                <option value="2">Seleccione</option>
                <option value="1">NIT</option>
                <option value="2">CC</option>
            </select>
        </div>

        <div class="form-group col-12 mb-2">
            <label for="direccion-editar_guia">Dirección completa destinatario</label>
            <input type="text" class="form-control" id="direccion-editar_guia" name="direccionD" required>
        </div>
        
        <div class="col-12 mb-3 mb-2">
            <h5>Email</h5>
            <input type="email" id="correoD-editar_guia" name="correoD" class="form-control form-control-user" value="" placeholder="nombre@ejemplo.com">
        </div>

        <div class="col-sm-6 mb-3 mb-2">
            <h5>Celular del Destinatario</h5>
            <input type="number" id="telefonoD-editar_guia" name="telefonoD" class="form-control form-control-user detect-errors" 
            value="" placeholder="Celular" required="" maxlengt="10">
        </div>
        <div class="col-sm-6 mb-3 mb-2">
            <h5>Otro celular del Destinatario</h5>
            <input type="number" id="celularD-editar_guia" name="celularD" class="form-control form-control-user detect-errors" value="" placeholder="celular">
        </div>
        
    </form>
    `;

    const m = createModal();
    
    $(".modal-body", m).append(formEditarGuia);

    m.modal();

    
}

function empacarGuia() {
    const id_heka = this.getAttribute("data-id");
    const empacada = this.checked;
    usuarioDoc.collection("guias").doc(id_heka).update({empacada});
}

let listaNovedadesEncontradas = [];
async function gestionarNovedad(e) {
    const id_heka = this.getAttribute("data-id");
    const guia = listaNovedadesEncontradas.find(n => n.id_heka === id_heka);
    if(!guia) return;

    const novedad = await usuarioAltDoc(guia.id_user).collection("estadoGuias")
    .doc(id_heka).get().then(d => d.exists ? d.data() : {});

    console.log(novedad)
    gestionarNovedadModal(novedad, guia);
}


//funcion que me devuelve a los inputs que estan escritos incorrectamente o vacios
function verificador(arr, scroll, mensaje) {
    let inputs = document.querySelectorAll("input");
    let mensajes_error = document.querySelectorAll(".mensaje-error");
    let primerInput;

    mensajes_error.forEach(err => {
        err.remove()
    })
    for(let i = 0; i < inputs.length; i++){
        inputs[i].classList.remove("border-danger");
    }

    if(arr){
        if(typeof arr == "string") {
            if(addId(arr))
            primerInput = document.getElementById(arr).parentNode;
        } else {
            let error = [];
            for(let id of arr){
                let inp = document.getElementById(id)
                if(addId(id)){
                    error.push(id);
                    if(mensaje) {
                        if(inp.parentNode.querySelector(".mensaje-error")) {
                            inp.parentNode.querySelector(".mensaje-error").innerText = mensaje;
                        } else {
                            let p = document.createElement("p");
                            p.innerHTML = mensaje;
                            p.setAttribute("class", "mensaje-error text-danger text-center mt-2")
                            inp.parentNode.appendChild(p);
                        }
                    }
                    // console.log(inp);
                    primerInput = document.getElementById(error[0]).parentNode;
                }
            }
        }
        if(primerInput) {
            const input = primerInput.querySelector("input")
            if(!input) return;

            input.focus()
            primerInput.scrollIntoView({
                behavior: "smooth"
            });
        }
    }
    
    function addId(id){
        let elemento = document.getElementById(id);
        if(!elemento.value){
            elemento.classList.add("border-danger");
            return true
        } else if(scroll) {
            elemento.classList.add("border-danger");
            return scroll == "no-scroll" ? false : true
        } else {
            console.log(elemento);
            elemento.classList.remove("border-danger");
            return false
        }
    }

}


function tablaPagos(arrData, id) {
    //tarjeta principal, head, body
    let card = document.createElement("div"),
        encabezado = document.createElement("a"),
        cuerpo = document.createElement("div"),
        table = document.createElement("table"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        usuario = document.createElement("h3"),
        total = document.createElement("h4"),
        btn_pagar = document.createElement("button"),
        inpAddComprobante = document.createElement("input"),
        totalizador = 0,
        idRemitente = arrData[0].REMITENTE.replace(" ", "");

    card.classList.add("card", "mt-4");

    encabezado.setAttribute("class","card-header d-flex justify-content-between");
    encabezado.setAttribute("data-toggle", "collapse");
    encabezado.setAttribute("role", "button");
    encabezado.setAttribute("aria-expanded", "true");

    cuerpo.setAttribute("class", "card-body collapse table-responsive");
    btn_pagar.setAttribute("class", "btn btn-danger");
    btn_pagar.setAttribute("id", "pagar"+arrData[0].REMITENTE.replace(" ", ""));
    btn_pagar.setAttribute("data-funcion", "pagar");
    
    inpAddComprobante.setAttribute("class", "form-control my-3");
    inpAddComprobante.setAttribute("type", "text");
    inpAddComprobante.setAttribute("placeholder", "Si deseas agregar comprobante bancario");
    inpAddComprobante.setAttribute("id", "comprobante_bancario"+idRemitente);
    
    table.classList.add("table", "table-bordered");
    thead.classList.add("thead-light");
    thead.innerHTML = `<tr>
        <th>Centro de Costo</th>
        <th>Transportadora</th>
        <th>Guía</th>
        <th>Recaudo</th>
        <th>Envío Total</th>
        <th>Total a Pagar</th>
        <th>Comisión heka</th>
        <th data-id="${arrData[0].REMITENTE.replace(" ", "")}">Fecha</th>
        <th>Estado</th>
        <th>Cuenta responsable</th>
        <th>Acciones</th>
    </tr>`
    
    encabezado.setAttribute("href", "#" + arrData[0].REMITENTE.replace(" ", ""));  
    encabezado.setAttribute("aria-controls", arrData[0].REMITENTE.replace(" ", ""));
    cuerpo.setAttribute("id", arrData[0].REMITENTE.replace(" ", ""));
    cuerpo.setAttribute("data-usuario", arrData[0].REMITENTE)
        
    for(let data of arrData){
        const buttonVerComp = administracion && data.comprobante_bancario && data.comprobante_bancario.includes("http") ? `
            <a class="btn btn-primary btn-sm m-1" href="${data.comprobante_bancario}" target="_blank">Comprobante</a>
        ` : "";

        const buttonVerFac = administracion ? `
            <button data-action="ver-factura" data-guia="${data.GUIA}" class="btn btn-primary btn-sm m-1">Factura</button>
        ` : "";

        let tr = document.createElement("tr");
        tr.setAttribute("id", data.GUIA);
        tr.setAttribute("data-remitente", data.REMITENTE);
        tr.innerHTML = `
            <td>${data.REMITENTE}</td>
            <td>${data.TRANSPORTADORA}</td>
            <td>${data.GUIA}</td>
            <td>${data.RECAUDO}</td>
            <td>${data["ENVÍO TOTAL"]}</td>
            <td>${data["TOTAL A PAGAR"]}</td>
            <td>${data["COMISION HEKA"] || ""}</td>
            <td data-id="${data.REMITENTE}" data-fecha="${data.FECHA}" data-funcion="cambiar_fecha">${data.FECHA}</td>
            <td>${data.estado}</td>
            <td>${data.cuenta_responsable || "No registró"}</td>
            <td>
                <div class="d-flex flex-wrap">
                    ${buttonVerFac}
                    ${buttonVerComp}
                </div>
            </td>
        `;
        if(!data.FECHA){
            btn_pagar.setAttribute("disabled", "");
        }

        if(data.ERROR) {
            btn_pagar.setAttribute("disabled", "");
            tr.setAttribute("data-error", data.ERROR);
            tr.setAttribute("class", "text-danger");
            total.classList.add("text-danger");
        }
        tbody.appendChild(tr);
        totalizador += parseInt(data["TOTAL A PAGAR"]);

    }

    table.append(thead, tbody);
    // total.textContent = "$" + convertirMiles(totalizador);
    total.textContent = "$" + convertirMiles(0);
    // total.setAttribute("data-total", totalizador.toFixed(2));
    total.setAttribute("data-total", "0");
    total.setAttribute("id", "total" + arrData[0].REMITENTE.replace(" ", ""));
    usuario.textContent = arrData[0].REMITENTE;
    encabezado.append(usuario, total);
    // btn_pagar.textContent = "Pagar $" + convertirMiles(totalizador);
    btn_pagar.textContent = "Pagar $" + convertirMiles(0);
    cuerpo.appendChild(table);
    cuerpo.appendChild(inpAddComprobante);
    cuerpo.appendChild(btn_pagar);
    card.append(encabezado, cuerpo);
    document.getElementById(id).appendChild(card);
};

//muestra la notificación específica para agregarla al panel, ademñas de asignarle funcionalidades
function mostrarNotificacion(data, type, id){
    let notificacion = document.createElement("a"),
        div_icon = document.createElement("div"),
        circle = document.createElement("div"),
        icon = document.createElement("i"),
        div_info = document.createElement("div"),
        info = document.createElement("div"),
        mensaje = document.createElement("span"),
        button_close = document.createElement("button");


    notificacion.setAttribute("class", "dropdown-item d-flex align-items-center justify-content-between");
    notificacion.classList.add("notificacion-"+id);
    notificacion.setAttribute("id", "notificacion-"+id);

    let color = data.icon ? data.icon[1] : "primary";
    let type_icon = data.icon ? data.icon[0] : "file-alt"

    div_icon.classList.add("mr-3");
    circle.setAttribute("class", "icon-circle bg-" +color);
    icon.setAttribute("class", "fas fa-"+type_icon+" text-white");
    circle.append(icon);
    div_icon.append(circle);
    
    info.setAttribute("class", "small text-gray-500");
    mensaje.style.display = "-webkit-box";
    mensaje.style.overflow = "hidden";
    mensaje.style.webkitLineClamp = "4";
    mensaje.style.webkitBoxOrient = "vertical";
    mensaje.innerHTML = data.mensaje;
    div_info.append(info, mensaje);
    
    button_close.setAttribute("type", "button");
    button_close.setAttribute("title", "Eliminar notificación");
    button_close.setAttribute("arial-label", "close");
    button_close.setAttribute("class", "close d-flex align-self-start");
    button_close.innerHTML = '<span aria-hidden="true" class="small">&times;</span>';
    button_close.addEventListener("click", () => {
        firebase.firestore().collection("notificaciones").doc(id).delete().then(() => {
            console.log("Se ha eliminado una notificación con id: " + id)
        });
    })
    info.textContent = data.fecha + (data.hora ? " A las " + data.hora : "");
    

    notificacion.addEventListener("click", e => {
        if(!e.target.parentNode.classList.contains("close") || !data.detalles) {
            if(type == "novedad") {
                revisarMovimientosGuias(true, data.seguimiento, data.id_heka, data.guia);
                mostrar("novedades");
            } else {
                if(data.detalles) {
                    console.log(data.detalles, data)
                    notificacion.setAttribute("data-toggle", "modal");
                    notificacion.setAttribute("data-target", "#modal-detallesNotificacion");
                    modalNotificacion(data.detalles)
                    $("#revisar-detallesNotificacion").one("click", () => {
                        location.href = "#" + (data.href || "documentos");
                        if(data.href == "deudas") {
                            revisarDeudas();
                        } else if (data.href === "usuarios") {
                            if(data.id_user)
                                seleccionarUsuario(data.id_user);
                        } else {
                            cargarDocumentos(data.guias.slice(0,5));
                        }
                    });
                    
                    return;
                }

                let href;
                if(administracion) {
                    cargarDocumentos(data.guias.slice(0,5));
                } else {
                    href = userClickNotification(data)
                }
                
                notificacion.setAttribute("href", "#" + (href || "documentos"));
            }
        }
    })

    notificacion.append(div_icon, div_info, button_close);
    return notificacion;
}

function mostrarNotificacionEstaticaUsuario(noti, id) {
    if(noti.startDate > new Date().getTime()) return;
    
    if(noti.endDate < new Date().getTime()) {
        eliminarNotificacion(id);
    }

    const mostrador = $("#notificaciones-estaticas");
    const alerta = document.createElement("div");
    const buttonCloseAlert = document.createElement("button");

    alerta.setAttribute("class", `alert alert-${noti.icon[1]}`);
    alerta.setAttribute("role", "alert");

    buttonCloseAlert.innerHTML = '<span aria-hidden="true">&times;</span>';
    buttonCloseAlert.classList.add("close");
    buttonCloseAlert.setAttribute("type", "button");
    buttonCloseAlert.setAttribute("data-dismiss", "alert");
    buttonCloseAlert.setAttribute("data-notification", id);
    buttonCloseAlert.setAttribute("aria-label", "close");
    buttonCloseAlert.addEventListener("click", () => eliminarNotificacion(id));
    
    mostrador.append(alerta);

    if(noti.allowDelete) alerta.appendChild(buttonCloseAlert);
    $(alerta).append(noti.mensaje);
    
    
    // buttonCloseAlert.onclick = () => eliminarNotificacion(id);
}

async function mostrarNotificacionAlertaUsuario(noti, id) {
    if(noti.startDate > new Date().getTime()) return;
    
    if(noti.endDate < new Date().getTime()) {
        console.log("eliminar notificación");
    }

    const opciones = {
        icon: noti.icon[0], 
        text: noti.mensaje,
    }

    if(noti.allowDelete) {
        opciones.showCancelButton = true;
        opciones.cancelButtonText = "No volver a ver";
    }

    Swal.fire(opciones)
    .then(r => {
        if(noti.deleteAfterWatch) {
            console.log("Eliminar después de ver");
        } else if (r.dismiss === Swal.DismissReason.cancel) {
            console.log("Eliminado por decisión del usuario")
        }
    })
}

function eliminarNotificacion(id) {
    db.collection("notificaciones").doc(id).delete();
}



function userClickNotification(data) {
    let href;
    if(data.href === "novedades") {
        console.log(data);
        revisarGuiaUser(data.id_heka)
        href = data.href;
    } else {
        href = "documentos";
        actualizarHistorialDeDocumentos(data.timeline);    
    }
    return href;
}

//Muestra los igresos y egresos de los usuarios a medida que van generando guías
function tablaMovimientos(arrData){
    
    let tabla = document.createElement("table"),
        t_head = document.createElement("tr"),
        detalles = document.createElement("h3");

    detalles.textContent = "Detalles";
    detalles.setAttribute("class", "text-center mt-3")

    t_head.innerHTML = `
        <th># Guía</th>
        <th>Transportadora</th>
        <th>Fecha</th>
        <th>Saldo Previo</th>
        <th>Movimiento</th>
        <th>Saldo Cuenta</th>
        <th>Mensaje</th>
        <th>Acciones</th>
    `
    tabla.setAttribute("class", "table text-center");
    tabla.appendChild(t_head);

    let gastos_usuario = 0
    let i = 0;
    for(let data of arrData){
        let row = document.createElement("tr");
        const buttonRest = data.type === "DESCONTADO" || true ? `<button class="btn btn-primary" data-action="restaurar" data-index="${i}">Restaurar</button>`: "";

        row.innerHTML = `
            <td>${data.numeroGuia || "No aplica"}</td>
            <td>${data.transportadora || "No aplica"}</td>
            <td>${data.fecha}</td>
            <td class="text-right">$${convertirMiles(data.saldo_anterior)}</td>
            <td class="text-right">$${convertirMiles(data.diferencia)}</td>
            <td class="text-right">$${convertirMiles(data.saldo)}</td>
            <td>${data.mensaje}</td>
            <td>${buttonRest}</td>
        `

        if(parseInt(data.diferencia) < 0){
            row.classList.add("table-secondary")
        }
        if(data.diferencia < 0 && data.guia) {
            gastos_usuario -= parseInt(data.diferencia);
        }
        tabla.appendChild(row);
        i++;
    }

    tabla.innerHTML += `<tr>
        <td colspan="4"><h5>Gastos Totales Del usuario</h5></td>
        <td><h5>$${convertirMiles(gastos_usuario)}</h5></td>
    </tr>`

    document.getElementById("card-movimientos").append(tabla, detalles);
    $("[data-action='restaurar']", document.getElementById("card-movimientos"))
    .click((e) => restaurarSaldoGuia(e.target, arrData))

}

async function restaurarSaldoGuia(trg, data) {
    const index = trg.getAttribute("data-index");
    const movimiento = data[index];
    const id_heka = movimiento.guia;
    const diferencia = -movimiento.diferencia;
    const loader = new ChangeElementContenWhileLoading(trg);

    if(!movimiento) return;

    const procesoFinalizado = (bool) => {
        loader.end();

        if(bool) {
            $("#filtrador-movimientos").click();
            Toast.fire("Movimiento restaurado con éxito", "", "success");
        }
    }

    const efectuarRestauracion = await Swal.fire({
        icon: "warning",
        title: "¡Atención!",
        text: "Al restaurar va a revertir el movimiento ocasionado, si el movimiento involucra una guía, dicha guía será eliminada del usuario, ¿deseas continuar?",
        showConfirmButton: true,
        showCancelButton: true
    });

    if(!efectuarRestauracion.isConfirmed) return;

    loader.init();

    if(isNaN(diferencia)) {
        Toast.fire("No hay saldo que retornar.", "", "error");
        procesoFinalizado();
        return;
    }

    const userRef = firebase.firestore().collection("usuarios").doc(movimiento.user_id)

    const datos_saldo_usuario = await userRef
    .get().then(doc => doc.data().datos_personalizados);

    if(!datos_saldo_usuario) {
        Toast.fire("No se pudo consultar la información del usuario.", "", "error");
        procesoFinalizado();
        return;
    }

    if(datos_saldo_usuario.saldo < 0) {
        avisar("No permitido", "Se detecta un saldo negativo, por favor justifica el saldo canjeado en deudas, o contace al desarrollador para agregar una excepción.", "advertencia")
        procesoFinalizado();
        return;
    };

    const detalles_saldo = {
        saldo: parseInt(datos_saldo_usuario.saldo) + diferencia,
        saldo_anterior: parseInt(datos_saldo_usuario.saldo),
        actv_credit: datos_saldo_usuario.actv_credit || false,
        fecha: genFecha(),
        diferencia: diferencia,
        mensaje: "Se ha restaurado un movimiento anterior.",
        
        momento: new Date().getTime(),
        user_id: movimiento.user_id,
        guia: movimiento.guia || "",
        medio: "Administración",
        numeroGuia: movimiento.numeroGuia || "",
        
        type: "RESTAURADO"
    }

    console.log(detalles_saldo);
    try {
        await actualizarSaldo(detalles_saldo);
    
        if(id_heka) {
            await firebase.firestore().collectionGroup("guias").where("id_heka", "==", id_heka)
            .get().then(q => {
                q.forEach(d => d.ref.update({deleted: true}))
            })
        }

        procesoFinalizado(true);

    } catch (e) {
        procesoFinalizado();
        Toast.fire(e.message, "", "error");
    }
    

}

//Mustra los movimientos de las guías
function tablaMovimientosGuias(data, extraData, usuario, id_heka, id_user){
    const ultimo_movimiento = data.movimientos[data.movimientos.length - 1];
    
    //Preparon los componentes necesarios
    let card = document.createElement("div"),
        encabezado = document.createElement("a"),
        cuerpo = document.createElement("div"),
        table = document.createElement("table"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        tr = document.createElement("tr"),
        ul = document.createElement("ul");

    card.classList.add("card", "mt-5");
    ul.classList.add("list-group", "list-group-flush");

    encabezado.setAttribute("class","card-header d-flex justify-content-between");
    encabezado.setAttribute("data-toggle", "collapse");
    encabezado.setAttribute("role", "button");
    encabezado.setAttribute("aria-expanded", "true");

    cuerpo.setAttribute("class", "card-body collapse table-responsive");

    table.classList.add("table");
    table.setAttribute("id", "tabla-estadoGuias-"+usuario.replace(/\s/g, ""));
    thead.classList.add("text-light", "bg-primary");
    const classHead = "text-nowrap";
    thead.innerHTML = `<tr>
        <th class="${classHead}">Guía</th>
        <th class="${classHead}">Acción</th>
        <th class="${classHead}">Novedad</th>
        <th class="${classHead}">Transportadora</th>
        <th class="${classHead}">Fecha de novedad</th>
        <th class="${classHead}">Tiempo</th>
        <th class="${classHead}">Tiempo en Gestión</th>
        <th class="${classHead}">Fecha de envío</th>
        <th class="${classHead}">Estado</th>
        <th class="${classHead}">Nombre</th>
        <th class="${classHead}">Dirección</th>
        <th class="${classHead}">Números</th>
        <th class="${classHead}">Destino</th>
        <th class="${classHead}">Movimiento</th>
        <th class="${classHead}">Gestión</th>
        <th class="${classHead}">Fech. Ult. Gestión</th>
        
    </tr>`
    
    encabezado.setAttribute("href", "#estadoGuias-" + usuario.replace(/\s/g, ""));  
    encabezado.setAttribute("aria-controls", "estadoGuias-" +usuario.replace(/\s/g, ""));
    encabezado.textContent = usuario;
    cuerpo.setAttribute("id", "estadoGuias-" + usuario.replace(/\s/g, ""));
    cuerpo.setAttribute("data-usuario", usuario.replace(/\s/g, ""));

    tr.setAttribute("id", "estadoGuia"+data.numeroGuia);

    //Si parece una novedad, el texto lo pinta de rojo
    const momento_novedad = buscarMomentoNovedad(data.movimientos, data.transportadora);
    const ultimo_seguimiento = extraData.seguimiento ? extraData.seguimiento[extraData.seguimiento.length - 1] : "";
    const millis_ultimo_seguimiento = ultimo_seguimiento && extraData.novedad_solucionada 
        ? ultimo_seguimiento.fecha.toMillis() : new Date();
        
    const mov = traducirMovimientoGuia(data.transportadora);

    const tiempo_en_novedad = diferenciaDeTiempo(momento_novedad[mov.fechaMov] || new Date(), new Date());
    
    if(tiempo_en_novedad > 3 && data.transportadora == "INTERRAPIDISIMO" && !administracion) return;
    
    let btnGestionar, btn_solucionar = ""
    //Según el tipo de usuario, cambia el botón que realiza la gestión
    if(administracion) {
        btnGestionar = "Revisar";
        btn_solucionar = `
            <button class="btn btn-${extraData.novedad_solucionada ? "secondary" : "success"} m-2" 
            id="solucionar-guia-${data.numeroGuia}">
                ${extraData.novedad_solucionada ? "Solucionada" : "Solucionar"}
            </button>
        `;
    } else {
        btnGestionar = extraData.novedad_solucionada 
        || extraData.transportadora === "INTERRAPIDISIMO" ? "Revisar" : "Gestionar";
    }
    tr.innerHTML = `
        <td>
            <div class="d-flex align-items-center">
                ${data.numeroGuia}
                <i id="actualizar-guia-${data.numeroGuia}" class="fa fa-sync ml-1 text-primary" title="Actualizar guía ${data.numeroGuia}" style="cursor: pointer"></i>
            </div>
        </td>

        <td class="row justify-content-center">
            <button class="btn btn-${extraData.novedad_solucionada ? "secondary" : "primary"} m-2 " 
            id="gestionar-guia-${data.numeroGuia}"
            data-toggle="modal" data-target="#modal-gestionarNovedad"}>
                ${btnGestionar}
            </button>
            ${btn_solucionar}
        </td>

        <td class="text-danger">${ultimo_movimiento[mov.novedad]}</td>
        <td>${data.transportadora || "Servientrega"}</td>
        <td>${momento_novedad[mov.fechaMov] ? momento_novedad[mov.fechaMov] : "No aplica"}</td>

        <td class="text-center">
            <span class="badge badge-danger p-2 my-auto">
                ${tiempo_en_novedad} días
            </span>
        </td>

        <td class="text-center">
            <span class="badge badge-danger p-2 my-auto">
                ${diferenciaDeTiempo(millis_ultimo_seguimiento, new Date())} días
            </span>
        </td>

        <td>${data.fechaEnvio}</td>
        <td>${data.estadoActual}</td>
        <td style="min-width:200px; max-width:250px">${extraData.nombreD}</td>

        <!-- Dirección del destinatario-->
        <td style="min-width:250px; max-width:300px">
            <p>${extraData.direccionD}</p>
        </td>
        
        <td>    
            <a href="https://api.whatsapp.com/send?phone=57${extraData.telefonoD.toString().replace(/\s/g, "")}" target="_blank">${extraData.telefonoD}</a>, 
            <a href="https://api.whatsapp.com/send?phone=57${extraData.celularD.toString().replace(/\s/g, "")}" target="_blank">${extraData.celularD}</a>
        </td>
        
        <td>${extraData.ciudadD} / ${extraData.departamentoD}</td>
        
        <td>
            ${ultimo_movimiento[mov.descripcionMov]}
        </td>
        
        <td style="min-width:250px; max-width:300px">
            ${ultimo_seguimiento.gestion || "No aplica"}
        </td>
        <td>${ultimo_seguimiento.fecha ? genFecha(ultimo_seguimiento.fecha.toMillis()) + " " + ultimo_seguimiento.fecha.toDate().toString().match(/\d\d:\d\d/)[0] : "No aplica"}</td>
        
    `;

    //si existe la guía en la ventana mostrada la sustituye
    if(document.querySelector("#estadoGuia" + data.numeroGuia)) {
        document.querySelector("#estadoGuia" + data.numeroGuia).innerHTML = "";
        document.querySelector("#estadoGuia" + data.numeroGuia).innerHTML = tr.innerHTML
    } else if(document.querySelector("#estadoGuias-" + usuario.replace(/\s/g, ""))){
        // console.log(document.querySelector("#estadoGuias-" + usuario.replace(/\s/g, "")).querySelector("tbody"))
        $("#tabla-estadoGuias-"+usuario.replace(/\s/g, "")).DataTable().destroy();
        document.querySelector("#estadoGuias-" + usuario.replace(/\s/g, "")).querySelector("tbody").appendChild(tr);
    } else {
        tbody.appendChild(tr);
        table.append(thead, tbody);
        let mensaje = document.createElement("p");
        mensaje.classList.add("text-center", "text-danger");
        mensaje.innerHTML = "Tiempo óptimo de solución: 24 horas";
        cuerpo.append(mensaje, table);
        card.append(encabezado, cuerpo);
    
        document.getElementById("visor_novedades").appendChild(card);

        //logica para borrar los elementos del localstorage
        
        let localStorageItems= localStorage;

        const keys= Object.keys(localStorageItems);

        const filteredItems = keys.filter(key => key.startsWith("tiempoguia"));

        console.log(filteredItems)

        filteredItems.forEach(key=>{
            const value= localStorageItems.getItem(key);
            const fecha= new Date(value);
            const fechamil=fecha.getTime();
            const fechaactual= new Date();
           console.log(fechaactual.getTime()-fechamil)
            
            if(21600000-fechaactual.getTime()-fechamil >=1){
                localStorage.removeItem(key);           
            }

        }
            )
    }

    $("#gestionar-guia-"+data.numeroGuia).click(() => {
        extraData.id_heka = id_heka;
        gestionarNovedadModal(data, extraData);
    })
    
    const boton_solucion = $("#solucionar-guia-"+data.numeroGuia);

    const boton_actualizar = $("#actualizar-guia-"+data.numeroGuia);
    boton_solucion.click(async () => {
        const html_btn = boton_solucion.html();
        boton_solucion.html(`
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Cargando...
        `);

        const referenciaGuia = firebase.firestore().collection("usuarios").doc(id_user).collection("guias").doc(id_heka)
        
        let { value: text } = await Swal.fire({
            title: 'Respuesta',
            html: `
                <textarea placeholder="Escribe tu mensaje" id="respuesta-novedad" class="form-control"></textarea>
                <div id="posibles-respuestas"></div>
            `,
            inputPlaceholder: 'Escribe tu mensaje',
            inputAttributes: {
                'aria-label': 'Escribe tu respuesta'
            },
            didOpen: respondiendoNovedad,
            preConfirm: () => document.getElementById("respuesta-novedad").value,
            showCancelButton: true
        });
        
        if (text == undefined) {
            boton_solucion.html(html_btn);
        } else if (text) {
            text = text.trim();

            const solucion = {
                gestion: "<b>La transportadora \"" +data.transportadora+ "\" responde lo siguiente:</b> " + text.trim(),
                fecha: new Date(),
                admin: true
            }
            avisar("Se enviará mensaje al usuario", text);
            if(extraData.seguimiento) {
                extraData.seguimiento.push(solucion)
            } else {
                extraData.seguimiento = new Array(solucion)
            }

            console.log(extraData);
            console.log(solucion);

            const mensajePreguardado = listaRespuestasNovedad.findIndex(l => l.mensaje.toLowerCase() == text.toLowerCase());

            if(mensajePreguardado == -1) {
                listaRespuestasNovedad.push({
                    cantidad: 1,
                    mensaje: text
                });
            } else {
                listaRespuestasNovedad[mensajePreguardado].cantidad++
            }

            // Para guardar una nueva estructura de mensaje
            db.collection("infoHeka").doc("respuestasNovedad").update({respuestas: listaRespuestasNovedad});

            referenciaGuia.update({
                seguimiento: extraData.seguimiento,
                novedad_solucionada: true
            }).then(() => {
                firebase.firestore().collection("notificaciones").doc(id_heka).delete();
                
                enviarNotificacion({
                    visible_user: true,
                    user_id: id_user,
                    id_heka: extraData.id_heka,
                    mensaje: "Respuesta a Solución de la guía número " + extraData.numeroGuia + ": " + text.trim(),
                    href: "novedades"
                })

                boton_solucion.html("Solucionada");

            })
        } else {
            console.log("No se envió mensaje");
            // return
            referenciaGuia.update({
                novedad_solucionada: true
            }).then(() => {
                firebase.firestore().collection("notificaciones").doc(id_heka).delete();
                boton_solucion.html("Solucionada");
                avisar("Guía Gestionada", "La guía " +data.numeroGuia+ " ha sido actualizada exitósamente como solucionada");
            })
        }


    });

    boton_actualizar.click(async (e) => {
        e.target.remove();
        const resp = await actualizarEstadoGuia(data.numeroGuia, id_user, true);

        revisarMovimientosGuias(true, null, null, data.numeroGuia);
    });
}



function respondiendoNovedad(swalDom) {
    console.log(swalDom);
    const textarea = swalDom.querySelector("#respuesta-novedad");
    const posiblesRespuestas = swalDom.querySelector("#posibles-respuestas");
    mostrarPosiblesRespuestasNovedad(posiblesRespuestas, textarea);


    textarea.addEventListener("keyup", e => {
        const val = e.target.value;
        const lista = mostrarPosiblesRespuestasNovedad(posiblesRespuestas, textarea, val.trim());

        if(e.keyCode === 13 && lista) {
            e.target.value = lista[0].mensaje;
        }
    });

    


}

function mostrarPosiblesRespuestasNovedad(domResp, textarea, mensaje = "") {
    if(!listaRespuestasNovedad) return;

    let lista = listaRespuestasNovedad.sort((a,b) => b.cantidad - a.cantidad);

    if(mensaje) {
        lista = lista.filter(l => l.mensaje.toLowerCase().includes(mensaje.toLowerCase()));
    }

    lista = lista.slice(0, 3);

    const titulo = "<h6 class='mt-3'>Posibles respuestas</h6>";
    domResp.innerHTML = "";

    if(!lista.length) return;

    const listHtml = lista.map((l, i) => {
        const position = l.mensaje.toUpperCase().indexOf(mensaje.toUpperCase());
        const longitud = mensaje.length + position;
        const slc = (i,f) => l.mensaje.slice(i,f);
        return `<a href="javascript:void(0)" class="lista list-group-item list-group-item-action d-flex justify-content-between" data-id="${i}" title="seleccionar">
            <span>${mensaje ? slc(0, position) + "<b>" + slc(position, longitud) + "</b>" + slc(longitud) : l.mensaje}</span>
        </a>`;
    });

    domResp.innerHTML += titulo + `<div class="list-group">${listHtml.join("")}</div>`;

    $(".lista", domResp).click(function() {
        const id = this.getAttribute("data-id");

        const seleccionado = lista[id];

        if(seleccionado) {
            textarea.value = seleccionado.mensaje;
        }
    });

    return lista;
}

function traducirMovimientoGuia(transportadora) {
    let traductor = new Object();
    switch (transportadora) {
        case "ENVIA":
            return {
                novedad: "novedad",
                fechaMov: "fechaMov",
                observacion: "observacion",
                descripcionMov: "estado",
                ubicacion: "ciudad"
            }
        case "TCC":
            return {
                novedad: "aclaracion",
                fechaMov: "fechamostrar",
                observacion: "descripcion",
                descripcionMov: "estado",
                ubicacion: "ciudad"
            }
        case "INTERRAPIDISIMO":
            return {
                novedad: "Motivo",
                fechaMov: "Fecha Cambio Estado",
                observacion: "Motivo",
                descripcionMov: "Descripcion Estado",
                ubicacion: "Ciudad"
            }
        case "COORDINADORA":
            return {
                novedad: "codigo_novedad",
                fechaMov: "fecha_completa",
                observacion: "descripcion",
                descripcionMov: "descripcion",
                ubicacion: "Ciudad"
            }
        default:
            return {
                novedad: "NomConc",
                fechaMov: "FecMov",
                observacion: "DesTipoMov",
                descripcionMov: "NomMov",
                ubicacion: "OriMov"
            }
    }
}

function buscarMomentoNovedad(movimientos, transp) {
    const last = movimientos.length - 1;
    for(let i = last; i >= 0; i--) {
        const mov = movimientos[i];
        if(revisarNovedad(mov,transp)) {
            return mov;
        }
    }

    return {}
}


function revisarNovedad(mov, transp) {
    if(transp === "INTERRAPIDISIMO") {
        return !!mov.Motivo;
    } else if (transp === "ENVIA" || transp === "TCC") {
        return !!mov.novedad
    } else if(transp === "COORDINADORA") {
        return !!mov.codigo_novedad;
    } else {
        if(listaNovedadesServientrega.length) {
            return listaNovedadesServientrega.includes(mov.NomConc)
        }

        return mov.TipoMov === "1";
    }
}


//dataN = data de la novedad, dataG = data de la guía
function gestionarNovedadModal(dataN, dataG) {
    // console.log(dataN.numeroGuia);
    // console.log(dataG)
    const ultimo_mov = dataN.movimientos[dataN.movimientos.length - 1];
  
    const noguia = dataN.numeroGuia;
  
    const tiempoguardado = new Date(localStorage.getItem("tiempoguia" + noguia));
    console.log("tiempo guardado"+ tiempoguardado)
    const tiempoguardadomilis = tiempoguardado.getTime();
    let tiempoactual = new Date();
    let tiempoactualmilis = tiempoactual.getTime();
  
        console.log("el tiempo guardado es " + tiempoguardado);
        console.log("el tiempo actual es " + tiempoactual);
  
    let diffCounter = 21600000 - (tiempoactualmilis - tiempoguardadomilis); //modificar el valor para cambiar el número de horas
    // let diffCounter = 30000 - (tiempoactualmilis - tiempoguardadomilis); //modificar el valor para cambiar el número de horas
        
    hours = Math.floor(diffCounter / (1000 * 60 * 60));
    mins = Math.floor(diffCounter / (1000 * 60));
  
    console.log("mins: " + mins);
    m = mins - hours * 60;
  
    let mostrador_gestionar;
  
    if (mins >= 1) {
      // indicar número de minutos a esperar!
      mostrador_gestionar = `
          <div class="card">
          <div class="card-header">
          <h5>Anuncio</h5>
      </div>
      <div class="card-body">
      Debes esperar <b> ${hours} </b> horas y <b> ${m} </b> minutos  para volver a gestionar la guía
      </div>
      </div>
      `;
    } else {
    localStorage.removeItem("tiempoguia" + noguia);
      mostrador_gestionar = `
          
          <h3>Escribe aquí tu solución a la novedad</h3>
          <textarea type="text" class="form-control" name="solucion-novedad" id="solucion-novedad-${dataN.numeroGuia}"></textarea>
          <button class="btn btn-success m-2" id="solucionar-novedad-${dataN.numeroGuia}">Enviar Solución</button>
      `;
    }
  
    if (dataG.oficina && !dataG.recibidoEnPunto) {
      mostrador_gestionar = `<p>Las guías que se dirigen hacia las oficinas flexii, no pueden ser gestionadas por este medio.</p>`;
    }
  
    //Acá estableceré la información general de la guía
    const ultimoMovConNovedad =
      revisarNovedad(ultimo_mov, dataN.transportadora) || dataN.enNovedad;
    let info_gen = document.createElement("div"),
      info_guia = `
              <div class="col-12 col-sm-6 col-md-4 col-lg mb-3">
              <div class="card">
              <div class="card-header">
                  <h5>Datos de la guía</h5>
              </div>
              <div class="card-body">
                  <p>Número de guía: <span>${dataN.numeroGuia}</span></p>
                  <p>Fecha de envío: <span>${dataN.fechaEnvio}</span></p>
                  <p>Estado: <span class="${
                    ultimoMovConNovedad ? "text-danger" : "text-primary"
                  }">
                    ${ultimoMovConNovedad ? "En novedad" : dataN.estadoActual}
                  </span></p>
                  <p>Peso: <span>${dataG.detalles.peso_liquidar} Kg</span></p>
                  <p>Dice contener: <span>${dataG.dice_contener}</p>
              </div>
              </div>
          </div>
          `,
      info_rem = `
              <div class="col-12 col-sm-6 col-md-4 col-lg mb-3">
                  <div class="card">
                  <div class="card-header">
                      <h5>Datos Remitente</h5>
                  </div>
                  <div class="card-body">
                      <p>Nombre: <span>${dataG.nombreR}</span></p>
                      ${
                        administracion
                          ? `<p>Centro de Costo: <span>${dataG.centro_de_costo}</span></p>`
                          : ""
                      }
                      <p>Direccion: <span>${dataG.direccionR}</span></p>
                      <p>Ciudad: <span>${dataG.ciudadR}</span></p>
                      <p>teléfono: <span>${dataG.celularR}</span></p>
                  </div>
                  </div>
              </div>
          `,
      info_dest = `
              <div class="col-12 col-sm-6 col-md-4 col-lg mb-3">
                  <div class="card">
                  <div class="card-header">
                      <h5>Datos del destinatario</h5>
                  </div>
                  <div class="card-body">
                      <p>Nombre: <span>${dataG.nombreD}</span></p>
                      <p>Direccion: <span>${dataG.direccionD}</span></p>
                      <p>Ciudad: <span>${dataG.ciudadD}</span></p>
                      <p>teléfonos: <span>
                          <a href="https://api.whatsapp.com/send?phone=57${dataG.telefonoD
                            .toString()
                            .replace(/\s/g, "")}" target="_blank">${
        dataG.telefonoD
      }</a>, 
                          <a href="https://api.whatsapp.com/send?phone=57${dataG.celularD
                            .toString()
                            .replace(/\s/g, "")}" target="_blank">${
        dataG.celularD
      }</a>
                      </span></p>
                  </div>
                  </div>
              </div>
          `,
      gestionar = `
              <div class="col mb-3">
              ${mostrador_gestionar}
              </div>
          `;
  
    info_gen.classList.add("row");
    info_gen.innerHTML = info_guia + info_rem + info_dest;
  
    //Acá etableceré la información de movimientos y gestiones anteriores de la guía
    let detalles = document.createElement("div"),
      mensajeGetionada = dataG.novedad_solucionada
        ? "<p class='text-success text-center'>Esta guía ya ha sido gestionada en base a la última solución enviada.</p>"
        : "",
      desplegadores = new DOMParser().parseFromString(
        `
          <div class="col-12">
          ${mensajeGetionada}
          <div class="btn-group mb-3 col-12" role="group">
              <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#historial-estados-gestionarNovedad" aria-expanded="false" aria-controls="historial-estados-gestionarNovedad">Historial Estados</button>
              <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#seguimiento-gestionarNovedad" aria-expanded="false" aria-controls="seguimiento-gestionarNovedad">Seguimiento</button>
          </div></div>
          `,
        "text/html"
      ).body.firstChild,
      historial_estado = new DOMParser().parseFromString(
        `
          <div class="collapse multi-collapse col-12 col-md mb-4" id="historial-estados-gestionarNovedad">
              <ul class="list-group border-left-primary"></ul>
          </div>
          `,
        "text/html"
      ).body.firstChild,
      seguimiento = new DOMParser().parseFromString(
        `
          <div class="collapse multi-collapse col-12 col-md" id="seguimiento-gestionarNovedad">
              <ul class="list-group border-left-primary"></ul>
          </div>
          `,
        "text/html"
      ).body.firstChild;
  
    const movTrad = traducirMovimientoGuia(dataN.transportadora);
    const guardarComoNovedad =
      dataG.transportadora === "SERVIENTREGA" && administracion;
  
    if (dataN.movimientos) {
      for (let i = dataN.movimientos.length - 1; i >= 0; i--) {
        let mov = dataN.movimientos[i];
        let li = document.createElement("li");
        let enNovedad = revisarNovedad(mov, dataN.transportadora);
        const btnGuardarComoNovedad =
          guardarComoNovedad && mov[movTrad.novedad]
            ? `<button class='btn btn-sm ml-2 btn-outline-danger registrar-novedad' data-novedad='${
                mov[movTrad.novedad]
              }'>Registrar novedad</button>`
            : "";
  
        li.innerHTML = `
                  <span class="badge badge-primary badge-pill mr-2 d-flex align-self-start">${
                    i + 1
                  }</span>
                  <div class="d-flexd-flex flex-column w-100">
                  <small class="d-flex justify-content-between">
                      <h6 class="text-danger">${
                        enNovedad
                          ? "<i class='fa fa-exclamation-triangle mr-2'></i>En novedad"
                          : ""
                      }</h6>
                      <h6>${mov[movTrad.fechaMov]}</h6>
                  </small>
                  <h4>${mov[movTrad.descripcionMov]}</h4>
                  <p class="mb-1">
                      <b>${mov[movTrad.observacion]}</b>
                  </p>
                  <p class="mb-1"><i class="fa fa-map-marker-alt mr-2 text-primary"></i>${
                    mov[movTrad.ubicacion] || "No registra."
                  }</p>
                  <p>
                      <span class="text-danger">${mov[movTrad.novedad]}</span>
                      ${btnGuardarComoNovedad}
                  </p>
                  </div>
              `;
        li.setAttribute("class", "list-group-item d-flex");
        historial_estado.children[0].appendChild(li);
      }
    }
  
    if (dataG.seguimiento) {
      for (let i = dataG.seguimiento.length - 1; i >= 0; i--) {
        let seg = dataG.seguimiento[i];
        let li = document.createElement("li");
  
        li.innerHTML = `
              <span class="badge badge-primary badge-pill mr-2 d-flex align-self-start">${
                i + 1
              }</span>
              <div class="d-flexd-flex flex-column w-100">
              <small class="d-flex justify-content-between">
                  <h6>${genFecha("LR", seg.fecha.toMillis())}</h6>
                  <h6>${
                    seg.fecha
                      .toDate()
                      .toString()
                      .match(/\d\d:\d\d/)[0]
                  }</h6>
              </small>
              <p>
                  ${seg.gestion}
              </p>
              </div>
              `;
        li.setAttribute("class", "list-group-item d-flex");
        seguimiento.children[0].appendChild(li);
      }
    }
  
    detalles.classList.add("row");
    detalles.append(desplegadores, historial_estado, seguimiento);
  
    document.getElementById("contenedor-gestionarNovedad").innerHTML = "";
    document
      .getElementById("contenedor-gestionarNovedad")
      .append(info_gen, detalles);
  
    // Funciones para despues que cargue todo
    if (!administracion) {
      info_gen.innerHTML += gestionar;
      let p = document.createElement("p");
      p.classList.add("text-danger");
      let idSolucion = "#solucion-novedad-" + dataN.numeroGuia;
      let btn_solucionar = $("#solucionar-novedad-" + dataN.numeroGuia);
      btn_solucionar.parent().append(p);
  
      $(idSolucion).on("input", (e) => {
        if (e.target.value) {
          btn_solucionar.prop("disabled", false);
          btn_solucionar.text("Enviar Solución");
          p.innerHTML = "";
        }
      });
  
      btn_solucionar.click((e) => {
    
       
        if (!$(idSolucion).val()) {
          p.innerText = "Error! No puedes enviar una solución vacía.";
          p.classList.replace("text-success", "text-danger");
        } else {
            e.target.disabled = true;
            e.target.innerHTML = "";
            e.target.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Cargando...`;
          console.log($(idSolucion));
          if (dataG.seguimiento) {
            dataG.seguimiento.push({
              gestion: $(idSolucion).val(),
              fecha: new Date(),
            });
          } else {
            dataG.seguimiento = [
              {
                gestion: $(idSolucion).val(),
                fecha: new Date(),
              },
            ];
          }
  
          // return;
          usuarioDoc
            .collection("guias")
            .doc(dataG.id_heka)
            .update({
              seguimiento: dataG.seguimiento,
              novedad_solucionada: false,
            })
            .then(() => {
              localStorage.setItem("tiempoguia" + noguia, new Date());
              p.innerText = "Sugerencia enviada exitósamente";
              p.classList.replace("text-danger", "text-success");
  
              btn_solucionar.remove();
              document
                .querySelector("#solucion-novedad-" + dataN.numeroGuia)
                .remove();
  
              let momento = new Date().getTime();
              let hora =
                new Date().getMinutes() < 10
                  ? new Date().getHours() + ":0" + new Date().getMinutes()
                  : new Date().getHours() + ":" + new Date().getMinutes();
  
              firebase.firestore().collection("notificaciones").doc(dataG.id_heka).set({
                  fecha: genFecha(),
                  timeline: momento,
                  mensaje: datos_usuario.nombre_completo + " (" + datos_usuario.centro_de_costo
                  + ") Sugirió una solución para la guía "
                  + dataN.numeroGuia + ": " + $(idSolucion).val(),
                  hora: hora,
                  guia: dataN.numeroGuia,
                  id_heka: dataG.id_heka,
                  type: "novedad",
                  user_id: user_id,
                  seguimiento: dataG.seguimiento,
                  usuario: datos_usuario.centro_de_costo,
                  visible_admin: true
              })
              btn_solucionar.text("Enviar Solución")
            })
            .catch((e) => {
              console.log(e);
            });
        }
      });
    } else {
      $(".registrar-novedad").click(registrarNovedad);
    }
  }
  


function registrarNovedad() {
    const novedad = this.getAttribute("data-novedad");
    if (!novedad) return;
    console.log(novedad);

    db.collection("infoHeka").doc("novedadesRegistradas")
    .update({
        "SERVIENTREGA": firebase.firestore.FieldValue.arrayUnion(novedad)
    }).then(() => {
        Toast.fire({
            icon: "success",
            title: "Novedad registrada"
        });
    });
}

function modalNotificacion(list) {
    let contenedorModal = document.getElementById("contenedor-detallesNotificacion");
    let lista = document.createElement("ul");

    contenedorModal.innerHTML = "";
    contenedorModal.innerHTML = "<h2 class='text-center'>Detalles</h2>";

    for(let detalle of list) {
        let li = document.createElement("li");
        li.innerHTML = detalle;
        lista.appendChild(li);
    }

    contenedorModal.appendChild(lista);

    
}

$("#activador_filtro_fecha").change((e) => {
    e.target.checked ? $("#fecha-pagos").show("fast") : $("#fecha-pagos").hide("fast")
});

$("#activador_filtro_fecha-gestionar_pagos").change((e) => {
    e.target.checked ? $("#fecha-gestionar_pagos").show("fast") : $("#fecha-gestionar_pagos").hide("fast")
});

$("[for='fecha_cargue-pagos_pendientes']").click((e) => {
    $("#fecha_cargue-pagos_pendientes").toggleClass("d-none");
    $("#fecha_cargue-pagos_pendientes").toggleClass("d-inline");
});

$("#switch-habilitar-filtrado-pagos").change((e) => {
    $("#filtrador-pagos").toggleClass("d-none")
    e.target.checked ? $("#filtrador-pagos").show("fast") : $("#filtrador-pagos").hide("fast")
});

function enviarNotificacion(options) {
    //Este es el patrón utilizado para el objeto que se ingresa en las notificaciones
    let example_data = {
        visible_user: false,
        visible_admin: false,
        visible_office: true,
        icon: ["exclamation", "danger"],
        detalles: "arrErroresUsuario", //mostrar una lista de posibles causas
        user_id: "vinculo.id_user",
        office_id: "identificador de una oficina",
        mensaje: "Mensaje a mostrar en la notificación",
        href: "id destino",
        fecha: "dd/mm/aaaa",
        timeline: "new Date().getTime()", // ej. 125645584895
        type: "tipo de noticiación",

        //Para notificaciones dinamicas
        startDate: "fecha desde que se quiere mostrar",
        endDate: "hasta cuando se va a mostrar",
        allowDelete: "bool: para permitirle al usuario eliminarla o no",
        deleteAfterWatch: "boll para que se auto elimine luego que el usuario la observe",
        isGlobal: "Bool: para indicar si es una notificación global"
    }

    let fecha = genFecha("ltr").replace(/\-/g, "/");
    let hora = new Date().getHours();
    let minutos = new Date().getMinutes();    
    if(hora <= 9) hora = "0" + hora;
    if(minutos <= 9) minutos = "0" + minutos;
    fecha += ` - ${hora}:${minutos}`;;
    let notificacion = {
        fecha,
        timeline: new Date().getTime()
    };

    for(let option in options) {
        notificacion[option] = options[option];
    }

    console.log(notificacion);

    firebase.firestore().collection("notificaciones").add(notificacion)
};

function mostradorDeudas(data) {
    let visor_deudas = document.getElementById("visor-deudas"),
        card = document.createElement("div"),
        encabezado = document.createElement("a"),
        cuerpo = document.createElement("div"),
        table = document.createElement("table"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        tr = document.createElement("tr")
    
    card.classList.add("card", "mt-3");
    card.setAttribute("data-filter", data.centro_de_costo);
    
    encabezado.setAttribute("class","card-header d-flex justify-content-between");
    encabezado.setAttribute("data-toggle", "collapse");
    encabezado.setAttribute("role", "button");
    encabezado.setAttribute("aria-expanded", "true");
    encabezado.setAttribute("href", "#deudas-" + data.id_user.replace(" ", ""));  
    encabezado.setAttribute("aria-controls", "deudas-" +data.id_user.replace(" ", ""));
    encabezado.textContent = "Deudas de: " + data.centro_de_costo;

    cuerpo.setAttribute("id", "deudas-" + data.id_user);
    cuerpo.setAttribute("class", "card-body collapse table-responsive");
    cuerpo.setAttribute("data-function", "consolidarTotales");
    table.classList.add("table")
    tbody.setAttribute("id", "tabla-deudas" + data.id_user);    

    thead.innerHTML = `
        <tr>
            <th class="text-center" data-function="selectAll">
            <input type="checkbox"/> Select</th>
            <th>Identificador</th>
            <th>Deuda</th>
            <th>Fecha</th>
        </tr>
    `;
    tr.innerHTML = `
       <td id="row-deudas-"+${data.id_heka}><input type="checkbox"
       ${!data.enviado ? "disabled" : ""}
       data-id_heka="${data.id_heka}"
       data-deuda="${data.user_debe}"
       data-id_user="${data.id_user}" class="takeThis"></input></td> 
       <td>${data.id_heka}</td> 
       <td class="totalizador">${data.user_debe}</td> 
       <td>${data.fecha}</td> 
    `;

    if(document.getElementById("tabla-deudas" + data.id_user)){
        document.getElementById("tabla-deudas" + data.id_user).appendChild(tr);
    } else {
        tbody.appendChild(tr);
        table.append(thead, tbody);
        cuerpo.append(table);
        card.append(encabezado, cuerpo);
        visor_deudas.appendChild(card);
    }
}

async function actualizarSaldo(data) {
    const data_de_ejemplo = {
        saldo: "Aquí muestra como va a quedar el saldo",
        saldo_anterior: "Saldo anterior",
        actv_credit: "doc.data().actv_credit || false",
        fecha: "fecha",
        diferencia: 0,
        mensaje: "Guía X eliminada exitósamente",
        
        //si alguno de estos datos es undefined podría generar error al subirlos
        momento: "timeline in semiseconds",
        user_id: "user_id",
        guia: "id guia",
        medio: "Usuario ó admin realizó X cambio",
        numeroGuia: "numeroGuia transportadora",
        // Tipo de actualización
        type: {
            GENERAL: "Cuando admin configura el saldo del usuario de forma genérica",
            DESCONTADO: "Cuando se descuenta al usuario (al crear la guía)",
            RESTAURADO: "Cuando se retorna un saldo descontado de una guía en concreto",
            CANJEADO: "Cuando admin retorna un saldo deudor"
        }
    }

    return await firebase.firestore().collection("usuarios").doc(data.user_id)
    .update({
        "datos_personalizados.saldo": data.saldo
    }).then(() => {
        firebase.firestore().collection("prueba").add(data)
        .then((docRef1)=> {
            firebase.firestore().collection("usuarios").doc(data.user_id)
            .collection("movimientos").add(data)
            .then((docRef2) => {
                firebase.firestore().collection("usuarios").doc("22032021")
                .collection("movimientos").add({
                    id1: docRef1.id,
                    id2: docRef2.id,
                    user: data.user_id,
                    medio: data.medio,
                    guia: data.guia,
                    momento: data.momento
                })
            })
        });

        return data;
    })
};


function verDetallesGuia() {
    let id = this.getAttribute("data-id");
    const id_user = this.getAttribute("data-id_user");
    usuarioAltDoc(id_user).collection("guias").doc(id)
    .get().then(doc => {
        let data = doc.data();
        const oficina = data.datos_oficina;
        const mostrar_oficina = oficina ? "" : "d-none"
        let html = "<div>"
        let mostrador = [
            ["id_heka", "numeroGuia", "estado", "transportadora", "type", "fecha", "nombreD", "direccionD", "ciudadD", "departamentoD", "seguro", "valor", "alto", "largo", "ancho", "peso", "dice_contener", "costo_envio", "telefonoD", "celularD"],
            ["Identificador Guía", "Número de Guía", "Estado", "Transportadora", "Tipo de envío", "Fecha de creación", "Nombre del Destinatario", "Dirección", "Ciudad", "Departamento", "Valor Declarado", "Recaudo", "Alto", "Largo", "Ancho", "Peso", "Contenido", "Costo del envío", "Celular", "Celular 2"]
        ];

        let informacionGuia = "<div class='card my-2'>";
        informacionGuia += "<h3 class='card-header'>Datos de guía</h3><div class='card-body row m-0'>";
        
        let informacionDestinatario = "<div class='card my-2'>";
        informacionDestinatario += "<h3 class='card-header'>Datos del destinatario</h3><div class='card-body row m-0'>";
        
        mostrador[0].forEach((v, n) => {
            const info = data[v] || "No registra";
            const titulo = mostrador[1][n];
            
            
            const element = "<p class='col-12 col-sm-6 text-left'>" + titulo + ": <b>" + info + "</b></p>";
            switch(v[v.length - 1]) {
                case "D": informacionDestinatario += element;
                    break;
                default: informacionGuia += element;

            }
        });

        
        informacionGuia += "</div></div>";
        informacionDestinatario += "</div></div>";
        html += informacionDestinatario + informacionGuia;
        
        if (oficina) {
            let informacionOficina = "<div class='card my-2'>";
            informacionOficina += "<h3 class='card-header'>Datos de la oficina</h3><div class='card-body row m-0'>";
            const datos_oficina = [
                ["Nombre representante", "Direccion", "Barrio", "Ciudad", "Celular", "Correo"],
                [oficina.nombre_completo, oficina.direccion, oficina.barrio, oficina.ciudad, oficina.celular, oficina.correo]
            ]

            datos_oficina[0].forEach((titulo, i) => {
                const info = datos_oficina[1][i] || "No registra";                
                
                const element = "<p class='col-12 col-sm-6 text-left'>" + titulo + ": <b>" + info + "</b></p>";
                informacionOficina += element;
            });

            informacionOficina += "</div></div>";

            html += informacionOficina;
        }
        
        html += "</div>";
        Swal.fire({
            title: "Detalles de Guía",
            html,
            width: "80%"
        });
    })
}

function createModal() {
    let modal = new DOMParser().parseFromString(`<div class="modal fade" id="modal-creado" 
    tabindex="-1" aria-labelledby="titulo-modal-creado" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="titulo-modal-creado">Título modal creado</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
          <button type="button" class="btn btn-primary" id="btn-continuar-modal-creado">Continuar</button>
        </div>
      </div>
    </div>
  </div>`, "text/html").body.children[0]

  let m = $(modal);
  m.find("[data-dismiss='modal']").click(() => {
    console.log("ha sido clickado");
  })

  m.on('hidden.bs.modal', function (event) {
    this.remove()
  })

  document.body.append(modal);
  return m;
}



function organizarPostPlantillaMensaje(number, params) {
    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            number,
            params
        })
    }
}

const Toast = Swal.mixin({
    toast: true,
    position: "bottom-start",
    showConfirmButton: false,
    timer: 3000,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

const Cargador = Swal.mixin({
    didOpen: () => {
        Swal.showLoading();
    },
    allowOutsideClick: false,
    allowEnterKey: false,
    showConfirmButton: false,
    allowEscapeKey: true
})

//guar la base64 en el path (ruta) ingresado. devuelve true si fue guardado con éxito, caso contrario devuelve false
async function guardarBase64ToStorage(base64, path) {
    return await firebase.storage().ref().child(path)
    .putString(base64, "base64").then(snapshot => {
        console.log("Documento subido con exito");
        return true
    }).catch(error => {
        console.log("hubo un error para subir el documento => " + error);
        return false;
    });
};

function indexarGuias(guias){
    return guias[0] + ((guias.length > 1) ? "_"+guias[guias.length - 1] : "")
}

function diferenciaDeTiempo(inicial, final) {
    inicial = new Date(inicial).getTime();
    final = new Date(final).getTime();

    const diff = final - inicial;
    return Math.floor(diff / (1000*60*60*24));

}

function getDateRangeMs(idInicial, idFinal) {
    let fecha_inicio = Date.parse(document.getElementById(idInicial).value.replace(/\-/g, "/")),
        fecha_final = Date.parse(document.getElementById(idFinal).value.replace(/\-/g, "/")) + 8.64e7;

    return [fecha_inicio, fecha_final];
}

function value(request) {
    return document.getElementById(request).value;
}

function asignacion(request, response) {
    return document.getElementById(request).value = response;
}

function printHTML(request, response) {
  return document.getElementById(request).innerHTML += response;
}

function inHTML(request, response) {
    return document.getElementById(request).innerHTML = response;
}

//DESACTIVAR MODULO
function desactivar(a) {
    var x = document.getElementById(a);
    x.style.display = "none";
}

//ACTIVAR MODULO
function activar(a) {
    var x = document.getElementById(a);
    x.style.display = "block";
}
function activar_query(a) {
  var x = document.querySelector(a);
  x.style.display = "block";
}

////////////validar email////////////7
function validar_email(email) {
    var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email) ? true : false;
}


function soloNumeros(campo){
    var textoFinal="";

    var numeros="1234567890";
    for(let i=0;i<campo.length;i++){
        for(let j=0;j<numeros.length;j++){
        if(campo[i]==numeros[j]){
            textoFinal+=campo[i];
        }

        }

    }
    return textoFinal;

}
 
function convertirMoneda(number, locales = "es-Co", currency = "COP", minimumFractionDigits = 0) {
    return new Intl.NumberFormat(locales, {
        style: 'currency',
        currency,
        minimumFractionDigits
      }).format(number)
}

const segmentarString = (str, longitud) => {
    let nuevoArr = []; //array donde se guardara el resultado
    let nueva = ""; //me sirve para ir inyectando de aun item
    let cont = 1; //contador que lo uso en mi ciclo para indicar cuando es tiempo de guardar un item en mi array
    for (let i = 0; i <= str.length; i++) {
        //for para desestructurar el string y volverlo a armar pero como array
        let nuevo = str.charAt(i); //con .charAt() solo obtengo un valor de mi str y lo guardo en una variable local
        nueva = nueva + nuevo; //nueva es la variable global en la que armo el item
        if (cont === longitud || i === str.length) {
        //cuando el contador llega a la longitud deseada
        nuevoArr.push(nueva); // le inyecto ese item previamente guardado en nueva
        nueva = ""; //limpio nueva para armar el siguiente item
        cont = 0; //reinicio el contador para que vuelva a llegar a la longitud deseada
        }
        cont++; //incremento el contador
    }
    
    return nuevoArr; //al finalizar retorno mi nuevo arreglo
};

const segmentarArreglo = (arr, rango) => {
    const res = [];
    
    for (let i = 0; i < arr.length; i += rango) {
        const last = Math.min(i + rango, arr.length)
        res.push(arr.slice(i, last))
    }

    return res;
}
  
class DetectorErroresInput {
    constructor (...selectors) {
        this.selectors = selectors;
        this.booleans = new Array();
        this.config = new Object();
        this.message = "Valor inválido"
    }

    init(type = "input") {
        this.selectors.forEach(selector => {
            $(selector).on(type, (e) => {
                this.value = e.target.value;

                const index = this.booleans.findIndex(bool => this.comprobateBoolean(selector, bool));
                const bool = index != -1;
    
                const boolTaken = this.booleans[index];
                let message;
                if(boolTaken) {
                    const sustitute = boolTaken.sustitute;
                    const forbid = boolTaken.forbid;
                    const type = typeof forbid;
                    message = boolTaken.message;

                    const character = type === "string" ? forbid : this.value.match(forbid)[0]
                    
                    if(boolTaken.removeAccents) this.value = this.removeAccents(this.value);

                    if(sustitute || sustitute === "") e.target.value = this.value.replace(forbid, sustitute);

                    if(message) {
                        message = message
                        .replace("{forbidden}", character)
                        .replace("{sustitute}", sustitute);
                    }
                }

                message = message ? message : this.message;
                this.showHideErr(e.target, bool, message);
            });
        })

        return this;
    }

    removeAccents(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    
    comprobateBoolean(selector, boolConfig) {        
        const caso = this.viewCase(boolConfig.case);
        const operator = boolConfig.operator;
        const valor = boolConfig.forbid;
        if((boolConfig.selector && selector !== boolConfig.selector ) 
        || (boolConfig.selectors && !boolConfig.selectors.contains(selector))) return false;
        let bool = false;
        
        if(!this.value) return false;
        
        switch (operator) {
            case ">":
                bool = caso > valor
                break;
            case "<":
                bool = caso < valor
                break;
            case ">=":
                bool = caso >= valor
                break;
            case "<=":
                bool = caso <= valor
                break;
            case "==":
                bool = caso == valor
                break;
            case "!=":
                bool = caso != valor
                break;
            case "contains":
                bool = valor.split("|").some(v => caso.includes(v));
                break;
            case "regExp":
                bool = valor.test(caso)
                break;
        }

        return bool;
    }

    viewCase(caso) {
        let respuesta;
        switch (caso) {
            case "length":
                respuesta = this.value.length
                break;
            case "number":
                respuesta = parseInt(this.value)
                break
            default:
                respuesta = this.value
        }
        return respuesta || this.value
    }

    set setDefaultMessage(message) {
        this.message = message
    }

    set insertBoolean(boolean) {
        this.booleans.push(boolean);
    }

    set setBooleans(booleans) {
        this.booleans = booleans;
    }

    set setConfig(config) {
        this.config = config
    }
    
    showHideErr(id, hasErr, message) {
        if(hasErr) {
            if($(id).parent().children(".mensaje-error").length) {
                $(id).parent().children(".mensaje-error").text(message)
            } else {
                $(id).parent().append(`<p class="mensaje-error mt-2 text-center ${this.config.className || "text-danger"}">${message}</p>`);
            }
        } else {
            if($(id).parent().children(".mensaje-error")) {
                $(id).parent().children(".mensaje-error").remove();
            }
        }
    }
}

class ChangeElementContenWhileLoading {
    constructor(e) {
        this.el = $(e);
        this.initVal = $(e).html();
        this.charger = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Cargando...`
    }

    init() {
        this.el.prop("disabled", true);
        this.el.html(this.charger);
        console.log(this.initVal);
    }

    end() {
        this.el.prop("disabled", false);
        this.el.html(this.initVal);
    }
}

//guardará un arreglo y funcionará cun un listener
class Watcher {
    constructor(val) {
        this.value = val || new Array();
        this.watchers = new Array();
    }

    set push(val) {
        if(!this.value.includes(val)) {
            this.value.push(val);
        }
    }

    set quit(val) {
        const index = this.value.indexOf(val);
        this.value.splice(index, 1);
    }

    change(newInfo) {
        this.value = newInfo;

        this.watchers.forEach(watch => watch(this.value));
    }

    watch(fn) {
        this.watchers.push(fn);
    }

    init() {
        console.log("se Inició la función con =>", this.value);
    }
}


const medidasCtrl = new DetectorErroresInput(".only-integers").init("input");
medidasCtrl.setBooleans = [
    {
        operator: "regExp",
        message: 'Debe ser un número entero, caracter "{forbidden}" eliminado',
        forbid: /[^\d]/g,
        sustitute: ""
    }
];
