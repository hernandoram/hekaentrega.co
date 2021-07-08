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
        <th>
            <div class="form-check text-center">
                <input class="form-check-input position-static" type="checkbox" value="option1" 
                data-id="${id}" data-numeroGuia="${datos.numeroGuia}"
                data-prueba="${datos.prueba}" data-id_archivoCargar="${datos.id_archivoCargar}"
                data-type="${datos.type}"
                data-funcion="activar-desactivar" aria-label="..." disabled>
            </div>
        </th>
        <th class="d-flex justify-content-around flex-wrap">
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
        </th>

        <th>${id}</th>
        <th></th>
        <th></th>
        <th>${datos.type || "Pago Contraentrega"}</th>
        <th>${datos.fecha}</th>
        <th>${datos.nombreR}</th>
        <th>${datos.ciudadD}</th>
        <th>${datos.nombreD}</th>
        <th>$${convertirMiles(datos.seguro || datos.valor)}</th>
        <th>$${convertirMiles(datos.valor)}</th>
        <th>$${convertirMiles(datos.costo_envio)}</th>

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
    return `<div class="col-md-4 mb-4">
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
    <div class="card border-bottom-${tipo_aviso || "info"} shadow h-100 py-2" id="${id}">
        <div class="card-body">
            <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                    <div class="h4 font-weight-bold text-${tipo_aviso || "info"} text-uppercase mb-2">${data.nombre_usuario}</div>
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
            data-id_guia="${id}" data-user="${data.id_user}" data-nombre="${data.nombre_usuario}">
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
                boton_eliminar_guia.disabled = true;
                boton_eliminar_guia.display = "none";
                firebase.firestore().collection("usuarios").doc(localStorage.user_id).collection("guias")
                .doc(id).delete().then((res) => {
                    console.log(res);
                    console.log("Document successfully deleted!");
                    avisar("Guia Eliminada", "La guia Número " + id + " Ha sido eliminada", "alerta");
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
                            
                            historialGuias();
                        }
                    })
                }).catch((error) => {
                    console.error("Error removing document: ", error);
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
                        let nombre_relacion = doc.data().nombre_relacion ? doc.data().nombre_relacion : "undefined"
                        let nombre_guias = doc.data().nombre_guias ? doc.data().nombre_guias : "undefined"
                        descargarDocumentos(user_id, doc.id, doc.data().guias.toString(), 
                        nombre_guias, nombre_relacion);
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

// tablaPagos([{
//     REMITENTE: "Seller Ej",
//     "ENVÍO TOTAL": "1000",
//     GUIA: "20293029",
//     RECAUDO: "55000",
//     FECHA: "22-02-2021",
//     "TOTAL A PAGAR": 60000
// },{
//     REMITENTE: "SellerEj",
//     "ENVÍO TOTAL": "2000",
//     GUIA: "20393",
//     RECAUDO: "30493",
//     FECHA: "22-03-2021",
//     "TOTAL A PAGAR": 60000  
// }], "visor_pagos");


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
                        cargarDocumentos("sin gestionar");
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

function tablaMovimientosGuias(data, extraData, usuario, id_heka, id_user){
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
    thead.classList.add("text-light", "bg-gradient-primary");
    thead.innerHTML = `<tr>
        <th>Guía</th>
        <th class="text-center">Detalles</th>
        <th>Gestionar</th>
    </tr>`
    
    encabezado.setAttribute("href", "#estadoGuias-" + usuario.replace(/\s/g, ""));  
    encabezado.setAttribute("aria-controls", "estadoGuias-" +usuario.replace(/\s/g, ""));
    encabezado.textContent = usuario;
    cuerpo.setAttribute("id", "estadoGuias-" + usuario.replace(/\s/g, ""));
    cuerpo.setAttribute("data-usuario", usuario.replace(/\s/g, ""));

    tr.setAttribute("id", "estadoGuia"+data.numeroGuia);
    if(data.movimientos[data.movimientos.length - 1].IdConc != 0) {
        tr.classList.add("text-danger");
    }
    
    let btnGestionar, btn_solucionar = ""
    if(administracion) {
        btnGestionar = "Revisar";
        btn_solucionar = `
            <button class="btn btn-${extraData.novedad_solucionada ? "secondary" : "success"} m-2 col-12 col-md-6" 
            id="solucionar-guia-${data.numeroGuia}">
                ${extraData.novedad_solucionada ? "Solucionada" : "Solucionar"}
            </button>
        `;
    } else {
        btnGestionar = extraData.novedad_solucionada ? "Revisar" : "Gestionar";
    }
    tr.innerHTML = `
        <td>${data.numeroGuia}</td>
        <td>
            <h5>Último movimiento: <small>${data.movimientos[data.movimientos.length -1].NomMov} - ${data.movimientos[data.movimientos.length -1].FecMov}</small></h5>
            ${extraData.seguimiento ? 
                '<h5>Última Gestión: <small>'+extraData.seguimiento[extraData.seguimiento.length -1].gestion+ ' - ' + genFecha("LR", extraData.seguimiento[extraData.seguimiento.length -1].fecha.toMillis() || "").replace(/-/g, "/")+'</small></h5>' : ""
            }
        </td>
        <td class="row justify-content-center">
            <button class="btn btn-${extraData.novedad_solucionada ? "secondary" : "primary"} m-2 col" 
            id="gestionar-guia-${data.numeroGuia}"
            data-toggle="modal" data-target="#modal-gestionarNovedad"}>
                ${btnGestionar}
            </button>
            ${btn_solucionar}
        </td>
    `;


    

    if(document.querySelector("#estadoGuia" + data.numeroGuia)) {
        console.log("Condicional 1")
        document.querySelector("#estadoGuia" + data.numeroGuia).innerHTML = "";
        document.querySelector("#estadoGuia" + data.numeroGuia).innerHTML = tr.innerHTML
    } else if(document.querySelector("#estadoGuias-" + usuario.replace(/\s/g, ""))){
        $("#tabla-estadoGuias-"+usuario.replace(/\s/g, "")).DataTable().destroy();
        console.log(document.querySelector("#estadoGuias-" + usuario.replace(/\s/g, "")).querySelector("tbody"))
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
    
    $("#solucionar-guia-"+data.numeroGuia).click(() => {
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
    })
}

//dataN = data de la novedad, dataG = data de la guía
function gestionarNovedadModal(dataN, dataG) {
    //Acá estableceré la información general de la guía
    let info_gen = document.createElement("div"),
        info_guia = `
            <div class="col-6 col-md mb-3">
            <div class="card">
            <div class="card-header">
                <h5>Datos de la guía</h5>
            </div>
            <div class="card-body">
                <p>Número de guía: <span>${dataN.numeroGuia}</span></p>
                <p>Fecha de envío: <span>${dataN.fechaEnvio}</span></p>
                <p>Estado: <span class="${dataN.movimientos[dataN.movimientos.length - 1].TipoMov != "0" ? "text-danger" : "text-primary"}">
                  ${dataN.movimientos[dataN.movimientos.length - 1].TipoMov != "0" ? "En novedad" : dataN.estadoActual}
                </span></p>
                <p>Peso: <span>${dataG.detalles.peso_liquidar} Kg</span></p>
                <p>Dice contener: <span>${dataG.dice_contener}</p>
            </div>
            </div>
        </div>
        `,
        info_rem = `
            <div class="col-6 col-md mb-3">
                <div class="card">
                <div class="card-header">
                    <h5>Datos Remitente</h5>
                </div>
                <div class="card-body">
                    <p>Nombre: <span>${dataG.nombreR}</span></p>
                    <p>Direccion: <span>${dataG.direccionR}</span></p>
                    <p>Ciudad: <span>${dataG.ciudadR}</span></p>
                    <p>teléfono: <span>${dataG.celularR}</span></p>

                </div>
                </div>
            </div>
        `,
        info_dest = `
            <div class="col col-md mb-3">
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
        <div class="col-6 col-md mb-3">
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
    
    if(dataN.movimientos) {
        for(let i = dataN.movimientos.length - 1; i >= 0; i--){
            let mov = dataN.movimientos[i];
            let li = document.createElement("li");
        
            li.innerHTML = `
            <span class="badge badge-primary badge-pill mr-2 d-flex align-self-start">${i+1}</span>
            <div class="d-flexd-flex flex-column w-100">
            <small class="d-flex justify-content-between">
                <h6 class="text-danger">${mov.TipoMov == "1" ? "En novedad" : ""}</h6>
                <h6>${mov.FecMov}</h6>
            </small>
            <h5>${mov.NomMov}</h5>
            <p>
                <b>${mov.DesTipoMov}</b></br>
                <span class="text-danger">${mov.NomConc}</span>
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

    // let n = {
    //     visible_user: true,
    //     visible_admin: false,
    //     icon: ["exclamation", "danger"],
        
    //     detalles: arrErroresUsuario,
    //     user_id: vinculo.id_user
    // }
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
// enviarNotificacion({
//     mensaje: "This is my massage",
//     visible_admin: true,
//     icon: ["opt1", "opt2"],
//     user_id: "identifier"
// });

