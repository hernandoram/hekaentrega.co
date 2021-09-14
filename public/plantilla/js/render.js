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
        console.log(content)
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
        <td>
            <div class="form-check text-center">
                <input class="form-check-input position-static" type="checkbox" value="option1" 
                data-id="${id}" data-numeroGuia="${datos.numeroGuia}"
                data-prueba="${datos.prueba}" data-id_archivoCargar="${datos.id_archivoCargar}"
                data-type="${datos.type}" data-has_sticker="${datos.has_sticker}"
                data-transportadora="${datos.transportadora}"
                data-funcion="activar-desactivar" aria-label="..." disabled>
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
        <td></td>
        <td></td>
        <td>${datos.transportadora || "SERVIENTREGA"}</td>
        <td>${datos.type || "Pago Contraentrega"}</td>
        <td>${datos.fecha}</td>
        <td>${datos.nombreR}</td>
        <td>${datos.ciudadD}</td>
        <td>${datos.nombreD}</td>
        <td>$${convertirMiles(datos.seguro || datos.valor)}</td>
        <td>$${convertirMiles(datos.valor)}</td>
        <td>$${convertirMiles(datos.costo_envio)}</td>

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
function mostrarUsuarios(data, id){
    return `<div class="col-md-4 mb-4" 
    data-filter-nombres="${data.nombres}" data-filter-apellidos="${data.apellidos}"
    data-filter-centro_de_costo="${data.centro_de_costo}" data-filter-direccion="${data.direccion}">
    <div class="card border-bottom-info" id="${id}" shadow="h-100 py-2">
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
            <div class="btn-group" role="group" data-buscador="${id}" 
            data-nombre="${data.nombres.split(" ")[0]} ${data.apellidos.split(" ")[0]}">
                <button class="btn btn-primary" data-funcion="ver-eliminar" value="">Ver Usuario</button>
                <button class="btn btn-info" data-funcion="movimientos" value="">Ver Movimientos</button>
            </div>
        </div>
    </div>
  </div>`
}

//Retorna una tarjeta con informacion del documento por id
function mostrarDocumentos(id, data, tipo_aviso) {
    return `<div class="col-sm-6 col-lg-4 mb-4">
    <div class="card shadow h-100" id="${id}">
        <h6 class='text-center card-header'>${data.transportadora || "Servientrega"}</h6>

        <div class="card-body">
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

                    <small class="badge badge-primary badge-counter float-right">${data.guias.length}</small>
                </div>
            </div>
            <div class="row" data-guias="${data.guias}" data-type="${data.type}"
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
                    </div>
                </div>
                <input type="file" name="cargar-documentos" data-tipo="relacion-envio" id="cargar-relacion-envio${id}" style="display: none">
                <input type="file" name="cargar-documentos" data-tipo="guias" id="cargar-guias${id}" style="display: none">
                <p id="mostrar-relacion-envio${id}" class="ml-2" 
                style="text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;"></p>
                
                <p id="mostrar-guias${id}" class="ml-2" 
                style="text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;"></p>
                
                <button class="btn btn-danger d-none col-12" data-funcion="enviar" id="subir${id}">Subir</button>
            </div>
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
        <div class="card-body">
            <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                    <div class="h4 font-weight-bold text-info text-uppercase mb-2">${data.nombre_usuario}</div>
                    <div class="row no-gutters align-items-center">
                        <div class="h6 mb-0 mr-3 font-weight-bold text-gray-800 w-100">
                            <p style="cursor: zoom-in;"
                            class="text-truncate"
                            data-mostrar="texto">Id Guias Generadas: <br><small class="text-break">${data.guias}</small></p>
                            <p>Fecha: <small>${data.fecha}</small></p>
                        </div>
                    </div>
                </div>
                <div class="col-auto">
                    <i class="fa fa-file fa-2x text-gray-300" data-id_guia="${id}" 
                    data-guias="${data.guias.toString()}" data-nombre_guias="${data.nombre_guias}"
                    data-nombre_relacion="${data.nombre_relacion}"
                    data-user="${data.id_user}" data-funcion="descargar-docs" 
                    id="descargar-docs${id}"></i>
                </div>
            </div>
            <div class="row" data-guias="${data.guias.toString()}" data-id_guia="${id}" data-user="${data.id_user}" data-nombre="${data.nombre_usuario}">
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
            actv.setAttribute("data-enviado", data.enviado)
        }

        let revisar = actv.getAttribute("data-enviado");
        let when = actv.getAttribute("data-activate");
        let operador = when != "after" ? revisar != "true" : revisar == "true";

        if(operador){
          actv.removeAttribute("disabled");
        } else {
          actv.setAttribute("disabled", "true")
        }

      }
      
      
      if(activate_once) {
        let row = document.getElementById("historial-guias-row" + id);
        let dataset = row.dataset;
        let boton_eliminar_guia = document.getElementById("eliminar_guia"+id);
        boton_eliminar_guia.addEventListener("click", function(e) {
            let confirmacion = confirm("Si lo elimina, no lo va a poder recuperar, ¿Desea continuar?");
            if(confirmacion && boton_eliminar_guia.getAttribute("data-enviado") != "true"){
                $("#enviar-documentos").prop("disabled", true)
                boton_eliminar_guia.disabled = true;
                boton_eliminar_guia.display = "none";
                firebase.firestore().collection("usuarios").doc(localStorage.user_id).collection("guias")
                .doc(id).delete().then((res) => {
                    console.log(res);
                    console.log("Document successfully deleted!");
                    avisar("Guia Eliminada", "La guia Número " + id + " Ha sido eliminada", "alerta");
                    row.remove();
                }).then(() => {
                    firebase.firestore().collection("usuarios").doc(localStorage.user_id).collection("informacion")
                    .doc("heka").get().then((doc) => {
                        if(doc.exists){
                            let momento = new Date().getTime();
                            let saldo = parseInt(doc.data().saldo);
                            
                            let saldo_detallado = {
                                saldo: saldo + parseInt(boton_eliminar_guia.getAttribute("data-costo_envio")),
                                saldo_anterior: saldo,
                                actv_credit: doc.data().actv_credit || false,
                                fecha: genFecha(),
                                momento: momento,
                                diferencia: 0,
                                mensaje: "Guía " + id + " eliminada exitósamente",
                                user_id: localStorage.user_id,
                                guia: id,
                                medio: "Usuario: " + datos_usuario.nombre_completo + ", Id: " + localStorage.user_id
                            }
                            
                            if(dataset.debe == "false"){
                                saldo_detallado.diferencia = saldo_detallado.saldo - saldo_detallado.saldo_anterior;
                                console.log(saldo_detallado);
                                console.log(saldo);
                                actualizarSaldo(saldo_detallado);
                            }
                            
                        }
                        historialGuias();
                    });
                    $("#enviar-documentos").prop("disabled", false);
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
        usuarioDoc.collection("estadoGuias").doc(id)
        .get().then(doc => {
            console.log(doc.data());
            if(doc.exists) {
                gestionarNovedadModal(doc.data(), data);
            } else {
                document.getElementById("contenedor-gestionarNovedad").innerText = "El estado de esta guía aún no ha sido actualizado"; 
            }
        })
        });

        document.getElementById("clonar_guia"+id).addEventListener("click", () => {
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
        usuarioDoc.collection("guias").doc(id)
        .get().then(doc => {
            enviar_firestore(doc.data());
        })
        })

        document.getElementById("descargar_documento"+id).addEventListener("click", e => {
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
            firebase.firestore().collection("documentos").where("guias", "array-contains", id)
            .get().then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    generarRotulo(doc.data().guias);
                })
            })
        })
      }

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
            primerInput.querySelector("input").focus()
            primerInput.scrollIntoView({
                behavior: "smooth"
            });
            console.log(primerInput)
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
        totalizador = 0;

    card.classList.add("card", "mt-5");

    encabezado.setAttribute("class","card-header d-flex justify-content-between");
    encabezado.setAttribute("data-toggle", "collapse");
    encabezado.setAttribute("role", "button");
    encabezado.setAttribute("aria-expanded", "true");

    cuerpo.setAttribute("class", "card-body collapse table-responsive");
    btn_pagar.setAttribute("class", "btn btn-danger");
    btn_pagar.setAttribute("id", "pagar"+arrData[0].REMITENTE.replace(" ", ""));
    btn_pagar.setAttribute("data-funcion", "pagar");
    

    table.classList.add("table", "table-bordered");
    thead.classList.add("thead-light");
    thead.innerHTML = `<tr>
        <th>Centro de Costo</th>
        <th>Transportadora</th>
        <th>Guía</th>
        <th>Recaudo</th>
        <th>Envío Total</th>
        <th>Total a Pagar</th>
        <th data-id="${arrData[0].REMITENTE.replace(" ", "")}">Fecha</th>
        <th>Estado</th>
    </tr>`
    
    encabezado.setAttribute("href", "#" + arrData[0].REMITENTE.replace(" ", ""));  
    encabezado.setAttribute("aria-controls", arrData[0].REMITENTE.replace(" ", ""));
    cuerpo.setAttribute("id", arrData[0].REMITENTE.replace(" ", ""));
    cuerpo.setAttribute("data-usuario", arrData[0].REMITENTE)
        
    for(let data of arrData){
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
            <td data-id="${data.REMITENTE}" data-fecha="${data.FECHA}" data-funcion="cambiar_fecha">${data.FECHA}</td>
            <td>${data.estado}</td>
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
                    $("#revisar-detallesNotificacion").click(() => {
                        location.href = "#"+data.href || "#documentos";
                        if(data.href == "deudas") {
                            revisarDeudas();
                        } else {
                            cargarDocumentos(data.guias.slice(0,5));
                        }
                    })
                } else {
                    if(administracion) {
                        cargarDocumentos(data.guias.slice(0,5));
                    } else {
                        actualizarHistorialDeDocumentos(data.timeline);
                    }
                    notificacion.setAttribute("href", "#documentos");
                }
    
            }
        }
    })

    notificacion.append(div_icon, div_info, button_close);
    return notificacion;
}

//Muestra los igresos y egresos de los usuarios a medida que van generando guías
function tablaMovimientos(arrData){
    let tabla = document.createElement("table"),
        t_head = document.createElement("tr"),
        detalles = document.createElement("h3");

    detalles.textContent = "Detalles";
    detalles.setAttribute("class", "text-center mt-3")

    t_head.innerHTML = `
        <th>Fecha</th>
        <th>Saldo Previo</th>
        <th>Movimiento</th>
        <th>Saldo Cuenta</th>
        <th>Mensaje</th>
    `
    tabla.setAttribute("class", "table text-center");
    tabla.appendChild(t_head);

    let gastos_usuario = 0
    for(let data of arrData){
        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${data.fecha}</td>
            <td class="text-right">$${convertirMiles(data.saldo_anterior)}</td>
            <td class="text-right">$${convertirMiles(data.diferencia)}</td>
            <td class="text-right">$${convertirMiles(data.saldo)}</td>
            <td>${data.mensaje}</td>
        `

        if(parseInt(data.diferencia) < 0){
            row.classList.add("table-secondary")
        }
        if(data.diferencia < 0 && data.guia) {
            gastos_usuario -= parseInt(data.diferencia);
        }
        tabla.appendChild(row);
    }

    tabla.innerHTML += `<tr>
        <td colspan="4"><h5>Gastos Totales Del usuario</h5></td>
        <td><h5>$${convertirMiles(gastos_usuario)}</h5></td>
    </tr>`

    document.getElementById("card-movimientos").append(tabla, detalles);
}

/**** Funcion obsoleta */
function tablaNovedades(data, extraData, usuario, solucion, id_heka, resuelta){
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
    table.setAttribute("id", "tabla-novedades-"+usuario.replace(" ", ""));
    thead.classList.add("text-light", "bg-gradient-primary");
    thead.innerHTML = `<tr>
        <th>Guía</th>
        <th class="text-center">Novedad</th>
    </tr>`
    
    encabezado.setAttribute("href", "#novedades-" + usuario.replace(" ", ""));  
    encabezado.setAttribute("aria-controls", "novedades-" +usuario.replace(" ", ""));
    encabezado.textContent = "Novedades " + usuario;
    cuerpo.setAttribute("id", "novedades-" + usuario.replace(" ", ""));
    cuerpo.setAttribute("data-usuario", usuario.replace(" ", ""));

    if(data.guia != 0){
        tr.setAttribute("id", "novedad"+data.guia);
    }
    
    tr.innerHTML = `
        <td>${data.guia}</td>
        <td>${data.novedad} - ${data.fecha.split("T")[0]}</td>
    `
    if(administracion){
        thead.firstChild.innerHTML += `<td>soluciones</td>`;
        let btn = "btn-success";
        if(resuelta){
            btn = "btn-secondary"
        }
        if(data.guia != 0) {
            tr.innerHTML += `
                <td>
                    <p>${solucion}</p>
                    <button class="btn ${btn} m-2" id="solucionar-novedad-${data.guia}">Novedad Solucionada</button>
                </td>
            `
        }
    } else {
        thead.firstChild.innerHTML += `
        <td>Nombre</td>
        <td>Celulares</td>
        <td>Dirección</td>
        <td>Solucionar</td>`;
        if(data.guia != 0){
            tr.innerHTML += `
                <td>${extraData.nombreD}</td>
                
                <td><a href="https://api.whatsapp.com/send?phone=57${extraData.celular1}" target="_blank">${extraData.celular1}</a>
                <a href="https://api.whatsapp.com/send?phone=57${extraData.celular2}" target="_blank">${extraData.celular2}</a></td>
                <td>${extraData.direccion}</td>
                <td>
                    <p>¿Tienes Alguna sugerencia para esta novedad?</p>
                    <textarea type="text" class="form-control" name="solucion-novedad" id="solucion-novedad-${data.guia}">${solucion}</textarea>
                    <button class="btn btn-success m-2" id="solucionar-novedad-${data.guia}">Enviar Solución</button>
                </td>
            `
        }
    }

    if(document.querySelector("#novedad" + data.guia)) {
        document.querySelector("#novedad" + data.guia).innerHTML = "";
        document.querySelector("#novedad" + data.guia).innerHTML = tr.innerHTML
    } else if(document.querySelector("#novedades-" + usuario.replace(" ", ""))){
        document.querySelector("#novedades-" + usuario.replace(" ", "")).querySelector("tbody").appendChild(tr);
    } else {
        tbody.appendChild(tr);
        table.append(thead, tbody);
        let mensaje = document.createElement("p");
        mensaje.classList.add("text-center", "text-danger");
        mensaje.innerHTML = "Tiempo óptimo de solución: 24 horas";
        cuerpo.append(mensaje, table);
        card.append(encabezado, cuerpo);
    
        document.getElementById("visor_novedades").appendChild(card);
    }

    console.log(resuelta);
    if(resuelta && !administracion){
        document.querySelector("#solucionar-novedad-"+data.guia).classList.add("disabled");
        document.querySelector("#solucionar-novedad-"+data.guia).disabled;
        document.querySelector("#solucionar-novedad-"+data.guia).remove();
    }
    
    $("#solucionar-novedad-"+data.guia).click(() => {
        if(administracion){
            console.log(data.guia);
            firebase.firestore().collectionGroup("guias").where("numeroGuia", "==", data.guia)
            .get().then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    console.log(doc.ref.path, doc.data().numeroGuia);
                    console.log(doc.ref.path.toString().replace("guias", "novedades"));
                    
                    firebase.firestore().doc(doc.ref.path.toString().replace("guias", "novedades")).update({
                        solucionada: true
                    }).then(() => {
                        firebase.firestore().doc(doc.ref.path).update({
                            "novedad.resuelta": true,
                            "novedad.fecha": data.fecha
                        });
                    })
                })
            }).then(() => {
                firebase.firestore().collection("notificaciones").doc(id_heka).delete();
                avisar("¡Entendido!", "Se la actualizado el estado de la novedad como resuelto");
            })
        } else {
            console.log($("#solucion-novedad-"+data.guia).val())
            console.log(data.guia);
            if($("#solucion-novedad-"+data.guia).val()) {
                firebase.firestore().collection("usuarios").doc(localStorage.user_id).collection("guias")
                .doc(id_heka).update({
                    solucion_novedad: $("#solucion-novedad-"+data.guia).val(),
                    "novedad.fecha": data.fecha
                }).then(() => {
                    let momento = new Date().getTime();
                    let hora = new Date().getMinutes() < 10 ? new Date().getHours() + ":0" + new Date().getMinutes() : new Date().getHours() + ":" + new Date().getMinutes();
    
                    firebase.firestore().collection("notificaciones").doc(id_heka).set({
                        fecha: genFecha(),
                        timeline: momento,
                        mensaje: datos_usuario.nombre_completo + "(" + datos_usuario.centro_de_costo 
                        + ") Sugirió una solución para la guía " 
                        + data.guia + ": " + $("#solucion-novedad-"+data.guia).val(),
                        hora: hora,
                        guia: data.guia,
                        id_heka: id_heka,
                        type: "novedad",
                        user_id: user_id,
                        usuario: datos_usuario.centro_de_costo,
                        visible_admin: true
                    })
                }).then(() => {
                    avisar("Solicitud Recibida", "Hemos Recibido tu solicitud, pronto estaremos atendiendo su novedad")
                })
            } else {
                avisar("¡Error!", "No se puede enviar una solución vacía en la guía: " + data.guia);
            }
        }
    })
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
        btnGestionar = extraData.novedad_solucionada ? "Revisar" : "Gestionar";
    }
    tr.innerHTML = `
        <td>${data.numeroGuia}</td>

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
                ${diferenciaDeTiempo(momento_novedad[mov.fechaMov] || new Date(), new Date())} días
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
    }

    $("#gestionar-guia-"+data.numeroGuia).click(() => {
        extraData.id_heka = id_heka;
        gestionarNovedadModal(data, extraData);
    })
    
    $("#solucionar-guia-"+data.numeroGuia).click(async () => {
        $("#solucionar-guia-"+data.numeroGuia).html(`
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Cargando...
        `);

        firebase.firestore().collection("usuarios").doc(id_user).collection("guias").doc(id_heka)
        .update({
            novedad_solucionada: true
        }).then(() => {
            firebase.firestore().collection("notificaciones").doc(id_heka).delete();
            $("#solucionar-guia-"+data.numeroGuia).html("Solucionada");
            avisar("Guía Gestionada", "La guía " +data.numeroGuia+ " ha sido actualizada exitósamente como solucionada");
        })


        return; 
        /* ESPACIO APRTADO, PARA CUANDO SE HABILITE RESPUESTA A NOVEDAD DEL USUARIO
            mientras tanto, solo va a resolver la novedad
        */
        const { value: text } = await Swal.fire({
            input: 'textarea',
            inputLabel: 'Respuesta',
            inputPlaceholder: 'Escribe tu mensaje',
            inputAttributes: {
              'aria-label': 'Escribe tu respuesta'
            },
            showCancelButton: true
          })

          
          if (text == undefined) {
          } else if (text) {
            avisar("Se enviará mensaje al usuario", text);
            if(extraData.seguimiento) {
                extraData.seguimiento.push({
                    gestion: "Asistencia Logística dice: " + text.trim(),
                    fecha: new Date()
                })
            } else {
                extraData.seguimiento = [{
                    gestion: "Asistencia Logística dice: " + text.trim(),
                    fecha: new Date()
                }]
            }

            console.log(extraData)
            return

            usuarioDoc.collection("guias").doc(id_heka).update({
                seguimiento: extraData.seguimiento,
                novedad_solucionada: true
            }).then(() => {
                firebase.firestore().collection("notificaciones").doc(id_heka).delete();
                
                enviarNotificacion({
                    visible_user: true,
                    user_id: id_user,
                    mensaje: "Respuesta a Solución de la guía número " + extraData.numeroGuia + ": " + text.trim(),
                    href: "novedades"
                })
            })
          } else {
            firebase.firestore().collection("usuarios").doc(id_user).collection("guias").doc(id_heka)
            .update({
                novedad_solucionada: true
            }).then(() => {
                firebase.firestore().collection("notificaciones").doc(id_heka).delete();
                $("#solucionar-guia-"+data.numeroGuia).html("Solucionada");
                avisar("Guía Gestionada", "La guía " +data.numeroGuia+ " ha sido actualizada exitósamente como solucionada");
            })
          }


    })
}

function traducirMovimientoGuia(transportadora) {
    let traductor = new Object();
    switch (transportadora) {
        case "INTERRAPIDISIMO":
            return {
                novedad: "Motivo",
                fechaMov: "Fecha Cambio Estado",
                observacion: "Observacion",
                descripcionMov: "Descripcion Estado",
                ubicacion: "Ciudad"
            }
            break;
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
    let movimiento = new Object();
    for(let i = last; i >= 0; i--) {
        if(transp === "INTERRAPIDISIMO") {

        } else {
            if(movimientos[i].TipoMov === "1") {
                movimiento = movimientos[i];
            } else {
                break;
            }
        }
    }

    console.log(movimiento)
    return movimiento;
}

function revisarNovedad(mov, transp) {
    if(transp === "INTERRAPIDISIMO") {
        return mov.Motivo;
    } else {
        return mov.TipoMov === "1";
    }
}

//dataN = data de la novedad, dataG = data de la guía
function gestionarNovedadModal(dataN, dataG) {
    console.log(dataN);
    console.log(dataG)
    const ultimo_mov = dataN.movimientos[dataN.movimientos.length - 1]
    //Acá estableceré la información general de la guía
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
                <p>Estado: <span class="${revisarNovedad(ultimo_mov, dataN.transportadora) ? "text-danger" : "text-primary"}">
                  ${revisarNovedad(ultimo_mov, dataN.transportadora) ? "En novedad" : dataN.estadoActual}
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
                    <p>Direccion: <span>${dataG.direccionR}</span></p>
                    ${administracion ? `<p>Centro de Costo: <span>${dataG.centro_de_costo}</span></p>` : ""}
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
                        <a href="https://api.whatsapp.com/send?phone=57${dataG.telefonoD.toString().replace(/\s/g, "")}" target="_blank">${dataG.telefonoD}</a>, 
                        <a href="https://api.whatsapp.com/send?phone=57${dataG.celularD.toString().replace(/\s/g, "")}" target="_blank">${dataG.celularD}</a>
                    </span></p>
                </div>
                </div>
            </div>
        `,
        gestionar = `
        <div class="col mb-3">
            <p>Escribe aquí tu solución a la novedad</p>
            <textarea type="text" class="form-control" name="solucion-novedad" id="solucion-novedad-${dataN.numeroGuia}"></textarea>
            <button class="btn btn-success m-2" id="solucionar-novedad-${dataN.numeroGuia}">Enviar Solución</button>
        </div>
        `;

    info_gen.classList.add("row");
    info_gen.innerHTML = info_guia + info_rem + info_dest;


    //Acá etableceré la información de movimientos y gestiones anteriores de la guía
    let detalles = document.createElement("div"),
        mensajeGetionada = dataG.novedad_solucionada ? "<p class='text-success text-center'>Esta guía ya ha sido gestionada en base a la última solución enviada.</p>" : "",
        desplegadores = new DOMParser().parseFromString(`
        <div class="col-12">
        ${mensajeGetionada}
        <div class="btn-group mb-3 col-12" role="group">
            <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#historial-estados-gestionarNovedad" aria-expanded="false" aria-controls="historial-estados-gestionarNovedad">Historial Estados</button>
            <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#seguimiento-gestionarNovedad" aria-expanded="false" aria-controls="seguimiento-gestionarNovedad">Seguimiento</button>
        </div></div>
        `, "text/html").body.firstChild,
        historial_estado = new DOMParser().parseFromString(`
        <div class="collapse multi-collapse col-12 col-md mb-4" id="historial-estados-gestionarNovedad">
            <ul class="list-group border-left-primary"></ul>
        </div>
        `, "text/html").body.firstChild,
        seguimiento = new DOMParser().parseFromString(`
        <div class="collapse multi-collapse col-12 col-md" id="seguimiento-gestionarNovedad">
            <ul class="list-group border-left-primary"></ul>
        </div>
        `, "text/html").body.firstChild;
    
    const movTrad = traducirMovimientoGuia(dataN.transportadora);

    if(dataN.movimientos) {
        for(let i = dataN.movimientos.length - 1; i >= 0; i--){
            let mov = dataN.movimientos[i];
            let li = document.createElement("li");
            let enNovedad = revisarNovedad(mov, dataN.transportadora);
        
            li.innerHTML = `
            <span class="badge badge-primary badge-pill mr-2 d-flex align-self-start">${i+1}</span>
            <div class="d-flexd-flex flex-column w-100">
            <small class="d-flex justify-content-between">
                <h6 class="text-danger">${enNovedad ? "<i class='fa fa-exclamation-triangle mr-2'></i>En novedad" : ""}</h6>
                <h6>${mov[movTrad.fechaMov]}</h6>
            </small>
            <h4>${mov[movTrad.descripcionMov]}</h4>
            <p class="mb-1">
                <b>${mov[movTrad.observacion]}</b>
            </p>
            <p class="mb-1"><i class="fa fa-map-marker-alt mr-2 text-primary"></i>${mov[movTrad.ubicacion]}</p>
            <p>
                <span class="text-danger">${mov[movTrad.novedad]}</span>
            </p>
            </div>
            `
            li.setAttribute("class", "list-group-item d-flex");
            historial_estado.children[0].appendChild(li);
        }
    }

    if(dataG.seguimiento) {
        for(let i = dataG.seguimiento.length - 1; i >= 0; i--) {
            let seg = dataG.seguimiento[i];
            let li = document.createElement("li");
        
            li.innerHTML = `
            <span class="badge badge-primary badge-pill mr-2 d-flex align-self-start">${i+1}</span>
            <div class="d-flexd-flex flex-column w-100">
            <small class="d-flex justify-content-between">
                <h6>${genFecha("LR", seg.fecha.toMillis())}</h6>
                <h6>${seg.fecha.toDate().toString().match(/\d\d:\d\d/)[0]}</h6>
            </small>
            <p>
                ${seg.gestion}
            </p>
            </div>
            `
            li.setAttribute("class", "list-group-item d-flex");
            seguimiento.children[0].appendChild(li);
        }
    }

    detalles.classList.add("row");
    detalles.append(desplegadores, historial_estado, seguimiento);

    
    document.getElementById("contenedor-gestionarNovedad").innerHTML = ""
    document.getElementById("contenedor-gestionarNovedad").append(info_gen, detalles);
    
    // Funciones para despues que cargue todo
    if(!administracion) {
        info_gen.innerHTML += gestionar;
        let p = document.createElement("p");
        p.classList.add("text-danger");
        let idSolucion = "#solucion-novedad-"+dataN.numeroGuia;
        let btn_solucionar = $("#solucionar-novedad-"+dataN.numeroGuia);

        btn_solucionar.parent().append(p);

        $(idSolucion).on("input", (e) => {
            if(e.target.value) {
                btn_solucionar.prop("disabled", false);
                btn_solucionar.text("Enviar Solución");
                p.innerHTML = "";
            }
        })
        
        btn_solucionar.click((e) => {
            e.target.disabled = true;
            e.target.innerHTML = "";
            e.target.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Cargando...`
            if(!$(idSolucion).val()) {
               p.innerText = "Error! No puedes enviar una solución vacía.";
               p.classList.replace("text-success", "text-danger");
            } else {
                console.log($(idSolucion));
                if(dataG.seguimiento) {
                    dataG.seguimiento.push({
                        gestion: $(idSolucion).val(),
                        fecha: new Date()
                    })
                } else {
                    dataG.seguimiento = [{
                        gestion: $(idSolucion).val(),
                        fecha: new Date()
                    }]
                }
    
                usuarioDoc.collection("guias").doc(dataG.id_heka).update({
                    seguimiento: dataG.seguimiento,
                    novedad_solucionada: false
                }).then(() => {
                    p.innerText = "Sugerencia enviada exitósamente";
                    p.classList.replace("text-danger", "text-success");

                    let momento = new Date().getTime();
                    let hora = new Date().getMinutes() < 10 ? new Date().getHours() + ":0" + new Date().getMinutes() : new Date().getHours() + ":" + new Date().getMinutes();
    
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
            }
        })
    }
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
$("#switch-habilitar-filtrado-pagos").change((e) => {
    $("#filtrador-pagos").toggleClass("d-none")
    e.target.checked ? $("#filtrador-pagos").show("fast") : $("#filtrador-pagos").hide("fast")
});

function enviarNotificacion(options) {
    //Este es el patrón utilizado para el objeto que se ingresa en las notificaciones
    let example_data = {
        visible_user: true,
        visible_admin: false,
        icon: ["exclamation", "danger"],
        detalles: arrErroresUsuario,
        user_id: vinculo.id_user,
        mensaje: "Mensaje a mostrar en la notificación",
        href: "id destino"
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

function actualizarSaldo(data) {
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
        medio: "Usuario ó admin realizó X cambio"
    }

    firebase.firestore().collection("usuarios").doc(data.user_id)
    .collection("informacion").doc("heka").update({
        saldo: data.saldo
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
    })
};


function verDetallesGuia() {
    let id = this.getAttribute("data-id");
    usuarioDoc.collection("guias").doc(id)
    .get().then(doc => {
        let data = doc.data();
        let html = "<table class='table table-bordered'>"
        let mostrador = [["id_heka", "numeroGuia", "estado", "type", "fecha", "nombreD", "direccionD", "ciudadD", "departamentoD", "seguro", "valor", "alto", "largo", "ancho", "peso", "costo_envio", "telefonoD"],
        ["Identificador Guía", "Número de Guía", "Estado", "Tipo de envío", "Fecha de creación", "Nombre del Destinatario", "Dirección", "Ciudad", "Departamento", "Valor Declarado", "Recaudo", "Alto", "Largo", "Ancho", "Peso", "Costo del envío", "Celular"]]

        mostrador[0].forEach((v, n) => {
            let info = data[v] || "No registra";
            html += "<tr><td class='text-left'>" + mostrador[1][n] + "</td> <td><b>" + info + "</b></td></tr>";
        })
        html += "</table>";
        Swal.fire({
            title: "Detalles de Guía",
            html
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

//guar la base64 en el path (ruta) ingresado. devuelve true si fue guardado con éxito, caso contrario devuelve false
async function guardarBase64ToStorage(base64, path) {
    return await firebase.storage().ref().child(path)
    .putString(base64, "base64").then(snapshot => {
        console.log(snapshot);
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

const pruebaGuia = [
    {
        "debe": -15350,
        "dice_contener": "calzado",
        "correoD": "notiene@gmail.com",
        "id_user": "1090493242",
        "recoleccion_esporadica": 0,
        "celularD": "3024599821",
        "alto": "15",
        "tipo_doc_dest": "2",
        "largo": "15",
        "fecha": "2021-08-31",
        "direccionD": "carrera 82 a # 35 13  simon bolivar ",
        "telefonoD": "3024599821",
        "observaciones": "",
        "ancho": "15",
        "detalles": {
            "seguro": 85000,
            "peso_con_volumen": 1,
            "recaudo": 85000,
            "peso_liquidar": 3,
            "peso_real": 3,
            "flete": 10000,
            "comision_trasportadora": 3000,
            "comision_heka": 2350,
            "total": 15350
        },
        "nombreR": "NATALIA MENDOZA",
        "timeline": 1630438053690,
        "valor": 85000,
        "id_heka": "324216624",
        "correoR": "nataandrea_10@hotmail.com",
        "dane_ciudadR": "54001000",
        "nombreD": "sergio perez - may s ",
        "estado": "ENTREGADO",
        "ciudadR": "CUCUTA",
        "transportadora": "SERVIENTREGA",
        "dane_ciudadD": "05001000",
        "direccionR": "Calle 23 número 3 49 apártamento 201 Tasajero los patios",
        "seguro": 85000,
        "celularR": "3223727739",
        "enviado": true,
        "centro_de_costo": "SellerNatalia",
        "identificacionD": 123,
        "ciudadD": "MEDELLIN",
        "departamentoR": "NORTE DE SANTANDER",
        "peso": 3,
        "departamentoD": "ANTIOQUIA",
        "ultima_actualizacion": {
            "seconds": 1631037600,
            "nanoseconds": 2000000
        },
        "type": "PAGO CONTRAENTREGA",
        "numeroGuia": "2118879519",
        "costo_envio": 15350
    },
    {
        "debe": -18060,
        "dane_ciudadD": "05001000",
        "ciudadR": "CUCUTA",
        "transportadora": "SERVIENTREGA",
        "departamentoD": "ANTIOQUIA",
        "correoD": "notiene@gmail.com",
        "costo_envio": 18060,
        "valor": 160000,
        "ultima_actualizacion": {
            "seconds": 1631426400,
            "nanoseconds": 1000000
        },
        "timeline": 1630437568271,
        "ciudadD": "MEDELLIN",
        "enviado": true,
        "alto": "15",
        "estado": "ENTREGADO",
        "fecha": "2021-08-31",
        "celularR": "3223727739",
        "detalles": {
            "recaudo": 160000,
            "peso_con_volumen": 1,
            "total": 18060,
            "comision_heka": 3100,
            "seguro": 160000,
            "comision_trasportadora": 4960,
            "peso_real": 3,
            "peso_liquidar": 3,
            "flete": 10000
        },
        "peso": 3,
        "direccionR": "Calle 23 número 3 49 apártamento 201 Tasajero los patios",
        "seguimiento_finalizado": false,
        "centro_de_costo": "SellerNatalia",
        "departamentoR": "NORTE DE SANTANDER",
        "nombreR": "NATALIA MENDOZA",
        "identificacionD": 123,
        "type": "PAGO CONTRAENTREGA",
        "numeroGuia": "2118879515",
        "celularD": "3145881170",
        "nombreD": "Leidy Alexandra Ruiz Echavarría sa ",
        "correoR": "nataandrea_10@hotmail.com",
        "largo": "15",
        "observaciones": "",
        "telefonoD": "3145881170",
        "ancho": "15",
        "id_heka": "324216615",
        "dane_ciudadR": "54001000",
        "direccionD": "reclama en oficina  . ",
        "tipo_doc_dest": "2",
        "seguro": 160000,
        "dice_contener": "calzado",
        "id_user": "1090493242",
        "recoleccion_esporadica": 0
    },
    {
        "id_user": "1090493242",
        "identificacionD": 123,
        "estado": "EN PROCESAMIENTO",
        "correoD": "notiene@gmail.com",
        "fecha": "2021-08-14",
        "correoR": "nataandrea_10@hotmail.com",
        "nombreD": "miguel angel tovar ramirez - sa ",
        "id_heka": "324213716",
        "ciudadD": "RIVERA",
        "alto": "15",
        "tipo_doc_dest": "2",
        "celularR": "3223727739",
        "numeroGuia": "2118876764",
        "largo": "15",
        "seguimiento_finalizado": false,
        "centro_de_costo": "SellerNatalia",
        "peso": 3,
        "recoleccion_esporadica": 0,
        "timeline": 1628957471706,
        "celularD": "3142880651",
        "ciudadR": "CUCUTA",
        "dice_contener": "calzado",
        "telefonoD": "3142880651",
        "ultima_actualizacion": {
            "seconds": 1631556000,
            "nanoseconds": 2000000
        },
        "costo_envio": 15775,
        "valor": 85000,
        "seguro": 85000,
        "observaciones": "",
        "direccionR": "Calle 23 número 3 49 apártamento 201 Tasajero los patios",
        "enviado": true,
        "ancho": "15",
        "direccionD": "carrera 6 # 4 50  centro ",
        "departamentoD": "HUILA",
        "departamentoR": "NORTE DE SANTANDER",
        "type": "PAGO CONTRAENTREGA",
        "nombreR": "NATALIA MENDOZA",
        "debe": -15775,
        "detalles": {
            "peso_con_volumen": 1,
            "comision_heka": 1275,
            "peso_liquidar": 3,
            "seguro": 85000,
            "flete": 11500,
            "peso_real": 3,
            "recaudo": 85000,
            "total": 15775,
            "comision_trasportadora": 3000
        }
    },
    {
        "seguro": 170000,
        "dane_ciudadD": "27006000",
        "celularR": "3223727739",
        "tipo_doc_dest": "2",
        "direccionR": "Calle 23 número 3 49 apártamento 201 Tasajero los patios",
        "identificacionD": 123,
        "numeroGuia": "230009514158",
        "debe": -30850,
        "ciudadD": "ACANDI",
        "id_user": "1090493242",
        "peso": 1,
        "fecha": "2021-08-31",
        "telefonoD": "3225052387",
        "dane_ciudadR": "54001000",
        "dice_contener": "calzado",
        "detalles": {
            "peso_liquidar": 1,
            "total": 30850,
            "flete": 15750,
            "comision_trasportadora": 11900,
            "recaudo": 170000,
            "seguro": 170000,
            "comision_heka": 3200,
            "peso_real": 1,
            "peso_con_volumen": 1
        },
        "departamentoD": "CHOCO",
        "largo": "15",
        "departamentoR": "NORTE DE SANTANDER",
        "recoleccion_esporadica": 0,
        "timeline": 1630435615816,
        "ciudadR": "CUCUTA",
        "seguimiento_finalizado": false,
        "celularD": "3225052387",
        "nombreR": "NATALIA MENDOZA",
        "alto": "15",
        "nombreD": "elver javier gutierez castro tot",
        "id_heka": "324216597",
        "ancho": "15",
        "correoR": "nataandrea_10@hotmail.com",
        "direccionD": "reclama en oficina  - ",
        "centro_de_costo": "SellerNatalia",
        "type": "PAGO CONTRAENTREGA",
        "ultima_actualizacion": {
            "seconds": 1631554135,
            "nanoseconds": 593000000
        },
        "transportadora": "INTERRAPIDISIMO",
        "costo_envio": 30850,
        "estado": "Viajando en Ruta Regional",
        "enviado": true,
        "correoD": "notiene@gmail.com",
        "valor": 170000,
        "observaciones": ""
    },
    {
        "valor": "160000",
        "novedad_solucionada": true,
        "departamentoR": "NORTE DE SANTANDER",
        "fecha": "2021-04-30",
        "largo": "15",
        "celularR": "3223727739",
        "dice_contener": "calzado",
        "ultima_actualizacion": {
            "seconds": 1625256187,
            "nanoseconds": 27000000
        },
        "correoD": "notiene@gmail.com",
        "alto": "15",
        "enviado": true,
        "costo_envio": 21100,
        "ciudadR": "CUCUTA",
        "correoR": "nataandrea_10@hotmail.com",
        "timeline": 1619740800000,
        "estado": "ENTREGADO",
        "departamentoD": "CUNDINAMARCA",
        "observaciones": "",
        "id_heka": "1102",
        "centro_de_costo": "SellerNatalia",
        "seguimiento": [
            {
                "fecha": {
                    "seconds": 1621302408,
                    "nanoseconds": 420000000,
                    toMillis: () => 1621302408420
                },
                "gestion": "Ofrecer nuevamente el cliente estara atento a la entrega "
            }
        ],
        "id_user": "1090493242",
        "nombreD": "fidel andres caicedo - ox",
        "numeroGuia": "2102567626",
        "detalles": {
            "peso_con_volumen": 1,
            "total": 21100,
            "comision_heka": 4640,
            "seguro": "160000",
            "flete": 11500,
            "peso_real": 3,
            "recaudo": "160000",
            "peso_liquidar": 3,
            "comision_trasportadora": 4960
        },
        "direccionR": "CALLE 2 NUMERO 10 36 EL PORTAL DE LOS PATIOS",
        "tipo_doc_dest": "2",
        "nombreR": "NATALIA MENDOZA",
        "direccionD": "carrera 98 b bis 42 a sur 13 localidad kennedy  la ribera  ",
        "peso": "3",
        "identificacionD": "10998657768",
        "telefonoD": "3053238384",
        "ancho": "15",
        "celularD": "3053238384",
        "recoleccion_esporadica": 0,
        "ciudadD": "BOGOTA"
    }
]

const movs = [
    {
        "numeroGuia": "2118879519",
        "fechaEnvio": "08/31/2021 14:32:00",
        "fecha": "",
        "nombreD": "sergio perez - may s ",
        "id_heka": "324216624",
        "estadoActual": "EN PROCESAMIENTO",
        "movimientos": [
            {
                "IdViewCliente": "1",
                "DesTipoMov": "",
                "IdProc": "1",
                "OriMov": "BOGOTA (CUNDINAMARCA)",
                "FechaProb": "01/01/0001 00:00",
                "IdConc": "0",
                "NomMov": "GUIA GENERADA",
                "DesMov": "BOGOTA (CUNDINAMARCA)",
                "NomConc": "",
                "TipoMov": "0",
                "FecMov": "08/31/2021 14:32:00"
            },
            {
                "FecMov": "09/01/2021 20:36:18",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "TipoMov": "0",
                "IdConc": "0",
                "IdProc": "6",
                "IdViewCliente": "1",
                "FechaProb": "12/01/2021 00:00",
                "DesTipoMov": "",
                "DesMov": "CUCUTA (NORTE DE SANTANDER)",
                "NomConc": ""
            },
            {
                "IdConc": "0",
                "IdViewCliente": "1",
                "NomMov": "SALIO A CIUDAD DESTINO",
                "TipoMov": "0",
                "DesTipoMov": "",
                "FechaProb": "12/01/2021 00:00",
                "IdProc": "12",
                "FecMov": "09/01/2021 20:48:19",
                "NomConc": "",
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)"
            },
            {
                "IdViewCliente": "1",
                "IdConc": "0",
                "NomConc": "",
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "FecMov": "09/03/2021 08:23:12",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "DesTipoMov": "",
                "FechaProb": "11/03/2021 00:00",
                "IdProc": "14",
                "TipoMov": "0"
            },
            {
                "TipoMov": "0",
                "FecMov": "09/04/2021 07:20:39",
                "FechaProb": "12/04/2021 00:00",
                "NomConc": "SALIDA A ZONA",
                "IdProc": "9",
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "IdViewCliente": "1",
                "DesTipoMov": "",
                "NomMov": "EN ZONA DE DISTRIBUCION",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "IdConc": "1"
            },
            {
                "DesTipoMov": "DIRECCION ERRADA",
                "FecMov": "09/04/2021 09:44:33",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "IdConc": "19",
                "NomConc": "DATOS ADICIONALES A LA DIRECCION",
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "TipoMov": "1",
                "FechaProb": "12/04/2021 00:00",
                "IdProc": "25",
                "IdViewCliente": "1",
                "NomMov": "NOTIFICACION DE DEVOLUCION"
            },
            {
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "NomConc": "DATOS ADICIONALES A LA DIRECCION",
                "IdConc": "19",
                "FecMov": "09/04/2021 15:25:50",
                "IdProc": "10",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "IdViewCliente": "1",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "DesTipoMov": "DIRECCION ERRADA",
                "TipoMov": "1",
                "FechaProb": "12/04/2021 00:00"
            },
            {
                "IdViewCliente": "1",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "NomConc": "DATOS ADICIONALES A LA DIRECCION",
                "IdConc": "19",
                "FecMov": "09/04/2021 15:25:50",
                "TipoMov": "1",
                "FechaProb": "12/04/2021 00:00",
                "DesTipoMov": "REHUSADO",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "IdProc": "10",
                "DesMov": "MEDELLIN (ANTIOQUIA)"
            },
            {
                "NomConc": "C.O.D RECLAMO OFICINA",
                "IdProc": "9",
                "TipoMov": "0",
                "FecMov": "09/06/2021 13:20:05",
                "IdViewCliente": "1",
                "NomMov": "EN ZONA DE DISTRIBUCION",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "FechaProb": "11/06/2021 00:00",
                "DesMov": "",
                "IdConc": "4",
                "DesTipoMov": ""
            }
        ],
        "direccionD": "carrera 82 a 35 13 simon bolivar",
        "ciudadD": "MEDELLIN - ANTIOQUIA"
    },
    {
        "fechaEnvio": "08/31/2021 14:32:00",
        "fecha": "09/11/2021 06:00:00",
        "id_heka": "324216615",
        "direccionD": "reclama en oficina .",
        "numeroGuia": "2118879515",
        "estadoActual": "ENTREGADO",
        "movimientos": [
            {
                "NomMov": "GUIA GENERADA",
                "DesTipoMov": "",
                "DesMov": "BOGOTA (CUNDINAMARCA)",
                "OriMov": "BOGOTA (CUNDINAMARCA)",
                "IdViewCliente": "1",
                "FechaProb": "01/01/0001 00:00",
                "TipoMov": "0",
                "FecMov": "08/31/2021 14:31:59",
                "IdProc": "1",
                "NomConc": "",
                "IdConc": "0"
            },
            {
                "FechaProb": "01/01/0001 00:00",
                "IdConc": "0",
                "DesMov": "CUCUTA (NORTE DE SANTANDER)",
                "IdViewCliente": "1",
                "IdProc": "6",
                "TipoMov": "0",
                "NomConc": "",
                "FecMov": "08/31/2021 20:05:17",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "DesTipoMov": ""
            },
            {
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "TipoMov": "0",
                "IdProc": "12",
                "FechaProb": "01/01/0001 00:00",
                "NomMov": "SALIO A CIUDAD DESTINO",
                "IdViewCliente": "1",
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "IdConc": "0",
                "DesTipoMov": "",
                "NomConc": "",
                "FecMov": "08/31/2021 21:36:03"
            },
            {
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "IdProc": "14",
                "IdViewCliente": "1",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "FechaProb": "11/02/2021 00:00",
                "TipoMov": "0",
                "IdConc": "0",
                "DesTipoMov": "",
                "NomConc": "",
                "FecMov": "09/02/2021 09:37:24"
            },
            {
                "TipoMov": "0",
                "DesTipoMov": "",
                "NomMov": "EN ZONA DE DISTRIBUCION",
                "IdConc": "4",
                "FechaProb": "11/02/2021 00:00",
                "FecMov": "09/02/2021 10:59:54",
                "IdViewCliente": "1",
                "NomConc": "C.O.D RECLAMO OFICINA",
                "IdProc": "9",
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "OriMov": "MEDELLIN (ANTIOQUIA)"
            },
            {
                "FecMov": "09/11/2021 06:00:00",
                "FechaProb": "11/11/2021 00:00",
                "NomConc": "",
                "OriMov": "MEDELLIN (ANTIOQUIA)",
                "TipoMov": "0",
                "IdProc": "11",
                "IdViewCliente": "1",
                "DesTipoMov": "",
                "DesMov": "MEDELLIN (ANTIOQUIA)",
                "NomMov": "ENTREGA VERIFICADA",
                "IdConc": "0"
            }
        ],
        "ciudadD": "MEDELLIN - ANTIOQUIA",
        "nombreD": "Leidy Alexandra Ruiz Echavarria sa "
    },
    {
        "nombreD": "miguel angel tovar ramirez - sa ",
        "id_heka": "324213716",
        "direccionD": "carrera 6 4 50 centro",
        "fecha": "",
        "numeroGuia": "2118876764",
        "estadoActual": "EN PROCESAMIENTO",
        "ciudadD": "RIVERA - HUILA",
        "fechaEnvio": "08/14/2021 11:52:00",
        "movimientos": [
            {
                "NomMov": "GUIA GENERADA",
                "TipoMov": "0",
                "FecMov": "08/14/2021 11:51:36",
                "NomConc": "",
                "OriMov": "BOGOTA (CUNDINAMARCA)",
                "DesMov": "BOGOTA (CUNDINAMARCA)",
                "IdProc": "1",
                "FechaProb": "01/01/0001 00:00",
                "IdConc": "0",
                "IdViewCliente": "1",
                "DesTipoMov": ""
            },
            {
                "IdProc": "6",
                "FecMov": "08/14/2021 18:16:42",
                "TipoMov": "0",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "IdViewCliente": "1",
                "DesTipoMov": "",
                "DesMov": "CUCUTA (NORTE DE SANTANDER)",
                "NomConc": "",
                "IdConc": "0",
                "FechaProb": "01/01/0001 00:00"
            },
            {
                "FechaProb": "01/01/0001 00:00",
                "IdViewCliente": "1",
                "DesMov": "BOGOTA (CUNDINAMARCA)",
                "IdProc": "12",
                "TipoMov": "0",
                "IdConc": "0",
                "FecMov": "08/14/2021 19:00:31",
                "NomConc": "",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "NomMov": "SALIO A CIUDAD DESTINO",
                "DesTipoMov": ""
            },
            {
                "DesTipoMov": "",
                "DesMov": "BOGOTA (CUNDINAMARCA)",
                "IdProc": "14",
                "FechaProb": "01/01/0001 00:00",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "NomConc": "",
                "FecMov": "08/17/2021 01:02:09",
                "IdViewCliente": "1",
                "OriMov": "BOGOTA (CUNDINAMARCA)",
                "IdConc": "0",
                "TipoMov": "0"
            },
            {
                "FecMov": "08/17/2021 21:02:23",
                "TipoMov": "0",
                "IdProc": "12",
                "FechaProb": "01/01/0001 00:00",
                "IdViewCliente": "1",
                "NomConc": "",
                "OriMov": "BOGOTA (CUNDINAMARCA)",
                "DesTipoMov": "",
                "IdConc": "0",
                "NomMov": "SALIO A CIUDAD DESTINO",
                "DesMov": "NEIVA (HUILA)"
            },
            {
                "DesTipoMov": "",
                "DesMov": "NEIVA (HUILA)",
                "IdConc": "0",
                "TipoMov": "0",
                "IdViewCliente": "1",
                "OriMov": "NEIVA (HUILA)",
                "FechaProb": "01/01/0001 00:00",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "IdProc": "14",
                "NomConc": "",
                "FecMov": "08/18/2021 05:29:24"
            },
            {
                "NomConc": "SALIDA A ZONA",
                "IdViewCliente": "1",
                "IdConc": "1",
                "FecMov": "08/18/2021 08:43:48",
                "FechaProb": "01/01/0001 00:00",
                "TipoMov": "0",
                "DesMov": "TERUEL (HUILA)",
                "DesTipoMov": "",
                "IdProc": "9",
                "OriMov": "NEIVA (HUILA)",
                "NomMov": "EN ZONA DE DISTRIBUCION"
            },
            {
                "NomConc": "SE TRASLADO",
                "NomMov": "NOTIFICACION DE DEVOLUCION",
                "DesMov": "NEIVA (HUILA)",
                "TipoMov": "1",
                "FechaProb": "01/01/0001 00:00",
                "DesTipoMov": "NO RESIDE",
                "IdViewCliente": "1",
                "OriMov": "NEIVA (HUILA)",
                "IdConc": "5",
                "FecMov": "08/18/2021 10:43:00",
                "IdProc": "25"
            },
            {
                "DesTipoMov": "NO RECLAMADO",
                "IdProc": "10",
                "IdConc": "5",
                "DesMov": "NEIVA (HUILA)",
                "FechaProb": "01/01/0001 00:00",
                "NomConc": "SE TRASLADO",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "IdViewCliente": "1",
                "OriMov": "NEIVA (HUILA)",
                "TipoMov": "1",
                "FecMov": "08/18/2021 19:21:21"
            },
            {
                "NomConc": "SE TRASLADO",
                "FechaProb": "01/01/0001 00:00",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "DesTipoMov": "NO RESIDE",
                "IdViewCliente": "1",
                "TipoMov": "1",
                "OriMov": "NEIVA (HUILA)",
                "DesMov": "NEIVA (HUILA)",
                "IdProc": "10",
                "FecMov": "08/18/2021 19:21:21",
                "IdConc": "5"
            },
            {
                "IdConc": "9",
                "OriMov": "NEIVA (HUILA)",
                "DesMov": "RIVERA (HUILA)",
                "DesTipoMov": "",
                "TipoMov": "0",
                "FechaProb": "01/01/0001 00:00",
                "IdViewCliente": "1",
                "NomConc": "EMPRESARIO SATELITE C.O.D. Y/O LPC",
                "FecMov": "08/24/2021 09:06:37",
                "IdProc": "9",
                "NomMov": "EN ZONA DE DISTRIBUCION"
            },
            {
                "IdViewCliente": "1",
                "TipoMov": "0",
                "FechaProb": "01/01/0001 00:00",
                "IdConc": "0",
                "NomConc": "",
                "FecMov": "08/24/2021 11:05:38",
                "OriMov": "NEIVA (HUILA)",
                "IdProc": "31",
                "DesTipoMov": "",
                "DesMov": "RIVERA (HUILA)",
                "NomMov": "ENVIO PARA ENTREGA EN OFICINA"
            },
            {
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "OriMov": "RIVERA (HUILA)",
                "IdConc": "7",
                "DesMov": "RIVERA (HUILA)",
                "DesTipoMov": "DIRECCION ERRADA",
                "IdProc": "10",
                "FechaProb": "01/01/0001 00:00",
                "FecMov": "09/04/2021 14:50:06",
                "TipoMov": "1",
                "NomConc": "NO RECLAMO EN OFICINA",
                "IdViewCliente": "1"
            },
            {
                "NomConc": "NO RECLAMO EN OFICINA",
                "FechaProb": "01/01/0001 00:00",
                "OriMov": "RIVERA (HUILA)",
                "DesMov": "RIVERA (HUILA)",
                "IdProc": "10",
                "IdViewCliente": "1",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "DesTipoMov": "NO RECLAMADO",
                "FecMov": "09/04/2021 14:50:06",
                "IdConc": "7",
                "TipoMov": "1"
            },
            {
                "IdProc": "10",
                "NomConc": "NO RECLAMO EN OFICINA",
                "IdConc": "7",
                "TipoMov": "1",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "FechaProb": "01/01/0001 00:00",
                "FecMov": "09/04/2021 14:50:06",
                "OriMov": "RIVERA (HUILA)",
                "DesMov": "RIVERA (HUILA)",
                "DesTipoMov": "NO RESIDE",
                "IdViewCliente": "1"
            }
        ]
    },
    {
        "transportadora": "INTERRAPIDISIMO",
        "estadoActual": "Viajando en Ruta Regional",
        "fechaEnvio": "2/09/2021 3:11:17 p.m.",
        "fecha": "2/09/2021 3:11:17 p.m.",
        "numeroGuia": "230009514158",
        "movimientos": [
            {
                "Motivo": "",
                "Observacion": "CARGA MASIVA DE MENSAJERIA",
                "Usuario": "cliente.cetina",
                "Descripcion Tipo Impreso": "",
                "Numero Tipo Impreso": "",
                "Descripcion Estado": "Envío Admitido",
                "Ciudad": "LOS PATIOS\\NORT\\COL",
                "Fecha Cambio Estado": "31/08/2021 2:36:47 p.m.",
                "Mensajero": "",
                " ": ""
            },
            {
                "Descripcion Tipo Impreso": "",
                "Descripcion Estado": "Ingresado a Bodega",
                "Numero Tipo Impreso": "",
                "Motivo": "",
                "Observacion": "",
                "Ciudad": "CUCUTA",
                "Mensajero": "",
                "Usuario": "alexisjsayagom",
                " ": "",
                "Fecha Cambio Estado": "31/08/2021 6:52:36 p.m."
            },
            {
                "Observacion": "",
                "Ciudad": "CUCUTA",
                "Usuario": "alexisjsayagom",
                "Descripcion Tipo Impreso": "",
                "Descripcion Estado": "Viajando en Ruta Nacional",
                "Numero Tipo Impreso": "",
                "Mensajero": "",
                " ": "",
                "Motivo": "",
                "Fecha Cambio Estado": "31/08/2021 6:57:49 p.m."
            },
            {
                "Descripcion Estado": "Ingresado a Bodega",
                "Usuario": "DarwinsonGBlanco",
                "Numero Tipo Impreso": "",
                "Ciudad": "BUCARAMANGA",
                "Observacion": "",
                "Descripcion Tipo Impreso": "",
                "Fecha Cambio Estado": "1/09/2021 5:24:20 p.m.",
                "Motivo": "",
                "Mensajero": "",
                " ": ""
            },
            {
                "Mensajero": "",
                "Fecha Cambio Estado": "1/09/2021 5:24:21 p.m.",
                "Motivo": "",
                " ": "",
                "Observacion": "",
                "Descripcion Estado": "Viajando en Ruta Nacional",
                "Ciudad": "BUCARAMANGA",
                "Numero Tipo Impreso": "",
                "Descripcion Tipo Impreso": "",
                "Usuario": "DarwinsonGBlanco"
            },
            {
                " ": "",
                "Mensajero": "",
                "Fecha Cambio Estado": "2/09/2021 10:44:56 a.m.",
                "Usuario": "JohnJMorenoP",
                "Numero Tipo Impreso": "",
                "Descripcion Estado": "Ingresado a Bodega",
                "Ciudad": "MEDELLIN",
                "Observacion": "",
                "Motivo": "",
                "Descripcion Tipo Impreso": ""
            },
            {
                "Numero Tipo Impreso": "",
                "Fecha Cambio Estado": "2/09/2021 3:11:17 p.m.",
                " ": "",
                "Ciudad": "MEDELLIN",
                "Observacion": "",
                "Descripcion Tipo Impreso": "",
                "Descripcion Estado": "Viajando en Ruta Regional",
                "Motivo": "",
                "Usuario": "mauricioguzmang",
                "Mensajero": ""
            }
        ],
        "id_heka": "324216597"
    },
    {
        "movimientos": [
            {
                "NomMov": "GUIA GENERADA",
                "DesMov": "BOGOTA (CUNDINAMARCA)",
                "FecMov": "04/30/2021 14:56:51",
                "IdConc": "0",
                "IdViewCliente": "1",
                "FechaProb": "01/01/0001 00:00",
                "DesTipoMov": "",
                "NomConc": "",
                "OriMov": "BOGOTA (CUNDINAMARCA)",
                "TipoMov": "0",
                "IdProc": "1"
            },
            {
                "FechaProb": "01/01/0001 00:00",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "IdViewCliente": "1",
                "IdProc": "6",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "IdConc": "0",
                "NomConc": "",
                "DesMov": "CUCUTA (NORTE DE SANTANDER)",
                "TipoMov": "0",
                "DesTipoMov": "",
                "FecMov": "04/30/2021 17:30:45"
            },
            {
                "DesMov": "BUCARAMANGA (SANTANDER)",
                "IdViewCliente": "1",
                "DesTipoMov": "",
                "IdConc": "0",
                "FechaProb": "01/01/0001 00:00",
                "NomMov": "SALIO A CIUDAD DESTINO",
                "NomConc": "",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "TipoMov": "2",
                "IdProc": "12",
                "FecMov": "04/30/2021 19:58:24"
            },
            {
                "DesMov": "BUCARAMANGA (SANTANDER)",
                "IdProc": "14",
                "IdConc": "0",
                "IdViewCliente": "1",
                "FecMov": "05/03/2021 15:17:39",
                "FechaProb": "08/03/2021 00:00",
                "TipoMov": "0",
                "NomConc": "",
                "DesTipoMov": "",
                "OriMov": "BUCARAMANGA (SANTANDER)",
                "NomMov": "INGRESO AL CENTRO LOGISTICO"
            },
            {
                "FechaProb": "08/03/2021 00:00",
                "IdViewCliente": "1",
                "TipoMov": "2",
                "IdConc": "0",
                "NomConc": "",
                "IdProc": "12",
                "NomMov": "SALIO A CIUDAD DESTINO",
                "OriMov": "BUCARAMANGA (SANTANDER)",
                "DesTipoMov": "",
                "DesMov": "BARRANQUILLA (ATLANTICO)",
                "FecMov": "05/03/2021 19:45:06"
            },
            {
                "TipoMov": "0",
                "IdProc": "14",
                "DesMov": "BARRANQUILLA (ATLANTICO)",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "DesTipoMov": "",
                "NomConc": "",
                "IdConc": "0",
                "FecMov": "05/05/2021 09:55:10",
                "IdViewCliente": "1",
                "FechaProb": "07/05/2021 00:00",
                "OriMov": "BARRANQUILLA (ATLANTICO)"
            },
            {
                "FechaProb": "07/07/2021 00:00",
                "IdViewCliente": "1",
                "NomMov": "EN ZONA DE DISTRIBUCION",
                "IdProc": "9",
                "FecMov": "05/07/2021 03:17:24",
                "IdConc": "9",
                "DesTipoMov": "",
                "DesMov": "BOSCONIA (CESAR)",
                "TipoMov": "0",
                "NomConc": "EMPRESARIO SATELITE C.O.D. Y/O LPC",
                "OriMov": "BARRANQUILLA (ATLANTICO)"
            },
            {
                "IdViewCliente": "1",
                "TipoMov": "0",
                "DesMov": "EL COPEY (CESAR)",
                "NomMov": "ENVIO PARA ENTREGA EN OFICINA",
                "FecMov": "05/07/2021 09:16:02",
                "FechaProb": "07/07/2021 00:00",
                "IdConc": "0",
                "OriMov": "BARRANQUILLA (ATLANTICO)",
                "NomConc": "",
                "DesTipoMov": "",
                "IdProc": "31"
            },
            {
                "TipoMov": "1",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "FechaProb": "07/07/2021 00:00",
                "DesTipoMov": "DIRECCION ERRADA",
                "IdViewCliente": "1",
                "NomConc": "NO PRESTAMOS SERVICIO",
                "FecMov": "05/07/2021 16:57:38",
                "IdConc": "2",
                "OriMov": "EL COPEY (CESAR)",
                "DesMov": "EL COPEY (CESAR)",
                "IdProc": "10"
            },
            {
                "DesMov": "EL COPEY (CESAR)",
                "TipoMov": "1",
                "IdViewCliente": "1",
                "FecMov": "05/07/2021 16:57:38",
                "FechaProb": "07/07/2021 00:00",
                "DesTipoMov": "OTROS",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "NomConc": "NO PRESTAMOS SERVICIO",
                "OriMov": "EL COPEY (CESAR)",
                "IdProc": "10",
                "IdConc": "2"
            },
            {
                "NomConc": "NO PRESTAMOS SERVICIO",
                "DesTipoMov": "DIRECCION ERRADA",
                "FechaProb": "01/01/0001 00:00",
                "OriMov": "BARRANQUILLA (ATLANTICO)",
                "IdConc": "2",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "IdProc": "10",
                "TipoMov": "1",
                "FecMov": "05/19/2021 12:18:14",
                "DesMov": "BARRANQUILLA (ATLANTICO)",
                "IdViewCliente": "1"
            },
            {
                "NomConc": "NO PRESTAMOS SERVICIO",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "FechaProb": "01/01/0001 00:00",
                "FecMov": "05/19/2021 12:18:14",
                "OriMov": "BARRANQUILLA (ATLANTICO)",
                "DesTipoMov": "OTROS",
                "TipoMov": "1",
                "IdProc": "10",
                "IdViewCliente": "1",
                "DesMov": "BARRANQUILLA (ATLANTICO)",
                "IdConc": "2"
            },
            {
                "IdProc": "9",
                "DesMov": "EL DIFICIL (MAGDALENA)",
                "DesTipoMov": "",
                "IdViewCliente": "1",
                "FechaProb": "01/01/0001 00:00",
                "NomConc": "EMPRESARIO SATELITE C.O.D. Y/O LPC",
                "OriMov": "BARRANQUILLA (ATLANTICO)",
                "NomMov": "EN ZONA DE DISTRIBUCION",
                "IdConc": "9",
                "TipoMov": "0",
                "FecMov": "05/21/2021 03:16:03"
            },
            {
                "DesTipoMov": "",
                "FecMov": "05/21/2021 08:53:10",
                "FechaProb": "01/01/0001 00:00",
                "IdConc": "0",
                "NomConc": "",
                "DesMov": "EL COPEY (CESAR)",
                "OriMov": "BARRANQUILLA (ATLANTICO)",
                "IdProc": "31",
                "NomMov": "ENVIO PARA ENTREGA EN OFICINA",
                "IdViewCliente": "1",
                "TipoMov": "0"
            },
            {
                "IdViewCliente": "1",
                "OriMov": "BARRANQUILLA (ATLANTICO)",
                "FecMov": "06/15/2021 21:46:27",
                "NomMov": "INGRESO AL CENTRO LOGISTICO POR DEVOLUCION",
                "NomConc": "NO HAY QUIEN RECIBA",
                "DesMov": "BARRANQUILLA (ATLANTICO)",
                "IdConc": "4",
                "DesTipoMov": "",
                "FechaProb": "01/01/0001 00:00",
                "TipoMov": "0",
                "IdProc": "10"
            },
            {
                "NomMov": "SALIO A CIUDAD DESTINO",
                "OriMov": "BARRANQUILLA (ATLANTICO)",
                "FecMov": "06/16/2021 01:59:45",
                "NomConc": "",
                "FechaProb": "01/01/0001 00:00",
                "DesMov": "BUCARAMANGA (SANTANDER)",
                "IdProc": "12",
                "IdViewCliente": "1",
                "TipoMov": "2",
                "DesTipoMov": "",
                "IdConc": "0"
            },
            {
                "DesTipoMov": "",
                "FechaProb": "01/01/0001 00:00",
                "OriMov": "BUCARAMANGA (SANTANDER)",
                "FecMov": "06/16/2021 17:56:27",
                "IdConc": "0",
                "IdProc": "14",
                "DesMov": "BUCARAMANGA (SANTANDER)",
                "NomConc": "",
                "TipoMov": "0",
                "IdViewCliente": "1",
                "NomMov": "INGRESO AL CENTRO LOGISTICO"
            },
            {
                "IdProc": "12",
                "OriMov": "BUCARAMANGA (SANTANDER)",
                "TipoMov": "0",
                "IdConc": "0",
                "FecMov": "06/16/2021 23:04:03",
                "FechaProb": "01/01/0001 00:00",
                "DesTipoMov": "",
                "IdViewCliente": "1",
                "NomMov": "SALIO A CIUDAD DESTINO",
                "NomConc": "",
                "DesMov": "CUCUTA (NORTE DE SANTANDER)"
            },
            {
                "DesMov": "CUCUTA (NORTE DE SANTANDER)",
                "NomConc": "",
                "DesTipoMov": "",
                "FecMov": "06/17/2021 08:14:58",
                "IdViewCliente": "1",
                "IdProc": "14",
                "NomMov": "INGRESO AL CENTRO LOGISTICO",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "TipoMov": "0",
                "IdConc": "0",
                "FechaProb": "01/01/0001 00:00"
            },
            {
                "NomMov": "EN ZONA DE DISTRIBUCION",
                "IdViewCliente": "1",
                "DesMov": "CUCUTA (NORTE DE SANTANDER)",
                "IdConc": "1",
                "FecMov": "06/17/2021 09:12:44",
                "TipoMov": "0",
                "IdProc": "9",
                "NomConc": "SALIDA A ZONA",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "FechaProb": "01/01/0001 00:00",
                "DesTipoMov": ""
            },
            {
                "TipoMov": "0",
                "OriMov": "CUCUTA (NORTE DE SANTANDER)",
                "IdProc": "11",
                "IdViewCliente": "1",
                "FechaProb": "01/01/0001 00:00",
                "DesMov": "CUCUTA (NORTE DE SANTANDER)",
                "NomConc": "",
                "DesTipoMov": "",
                "IdConc": "0",
                "FecMov": "06/17/2021 21:00:54",
                "NomMov": "ENTREGA VERIFICADA"
            }
        ],
        "ciudadD": "EL COPEY - CESAR",
        "nombreD": "luz elena cardona mosquera - yo ",
        "numeroGuia": "2102567626",
        "fecha": "06/17/2021 21:00:54",
        "estadoActual": "ENTREGADO",
        "id_heka": "1102",
        "direccionD": "mz 6 casa16 villa azul",
        "fechaEnvio": "04/30/2021 14:57:00"
    }
]



movs.forEach((mov, i) => {
    tablaMovimientosGuias(mov, pruebaGuia[i], "usuario", pruebaGuia[i].id_heka, "id_user")
})