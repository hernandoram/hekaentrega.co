if(administracion){
    if(localStorage.getItem("acceso_admin")){
        if($("#documentos")){
            cargarDocumentos("sin gestionar");
            $("#buscador-documentos").on("click", () => {
                cargarDocumentos("fecha");
            })
        
            $('[href="#documentos"]').on("click", () => {
                cargarDocumentos("sin gestionar");
            })
        }

        document.getElementById("btn_actualizador").addEventListener("click", (e) => {
            e.preventDefault();
            actualizarEstado();
        });

        document.getElementById("btn-cargar_pagos").addEventListener("click", (e) => {
            e.preventDefault();
            cargarPagos();
        })

    } else {
        let inputs = document.querySelectorAll("input");
        let botones = document.querySelectorAll("button")
        for(let inp of inputs){
            inp.disabled = true;
        }
    
        for(let boton of botones){
            boton.disabled = true;
        }
    
        avisar("Acceso Denegado", "No tienes acceso a esta plataforma, espera unos segundos o da click en este mensaje y serás redirigido", "advertencia", "plataforma2.html")
    }
}
revisarNotificaciones();

$("#check-select-all-guias").change((e) => {
    let checks = document.getElementById("tabla-guias").querySelectorAll("input");
    for(let check of checks){
        if(!check.disabled) {
            if(e.target.checked) {
                check.checked = true;
            } else {
                check.checked = false;
            }
        }
    }

})

/* Referencia de funciones utilizadas en este Script
 * MostrarDocumentos(), genFecha() ===> render.js
 */

function crearDocumentos() {
   
    let checks = document.getElementById("tabla-guias").querySelectorAll("input");
    let guias = [], id_user = localStorage.user_id, arrGuias = new Array();
    for(let check of checks){
        if(check.checked && !check.disabled){
            guias.push(check.getAttribute("data-id"));
            arrGuias.push({
                numeroGuia: check.getAttribute("data-numeroGuia"),
                id_heka:  check.getAttribute("data-id"),
                id_archivoCargar: check.getAttribute("data-id_archivoCargar"),
                prueba:  check.getAttribute("data-prueba") == "true" ? true : false,
                type: check.getAttribute("data-type")
            });
            let tipos_diferentes = arrGuias.some((v, i, arr) => {
                return v.type != arr[i? i - 1 :i].type
            });

            if(tipos_diferentes) {
                return avisar("!error!", "No se pudo procesar la información, los tipos de guías seleccionados no coinciden.", "advertencia");
            }
        }
    }

    checks.forEach((check) => {
        if(check.checked && !check.disabled){
            check.checked = false;
            check.disabled = true;
        }
    })

    console.log(guias);
    
    // Add a new document with a generated id.
    if(guias.length == 0){
        avisar("No se Pudo enviar su documento", "Asegurece de haber seleccionado al menos una guía", "aviso");
    } else {
        swal.fire({
            title: "Creando Documentos",
            html: "Estamos trabajando en ello, por favor espere...",
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick: false,
            allowEnterKey: false,
            showConfirmButton: false,
            allowEscapeKey: true
        })
        document.getElementById("enviar-documentos").setAttribute("disabled", "true");
        let documentReference = firebase.firestore().collection("documentos");
        documentReference.add({
            id_user: id_user,
            nombre_usuario: datos_usuario.nombre_completo,
            fecha: genFecha(),
            timeline: new Date().getTime(),
            descargar_relacion_envio: false, descargar_guias: false,
            type: arrGuias[0].type
        })
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
            arrGuias.sort((a,b) => {
                return a.numeroGuia > b.numeroGuia ? 1 : -1
            })
            if(generacion_automatizada) {
                generarDocumentos(arrGuias, {
                    id_user, 
                    prueba: estado_prueba,
                    id_doc: docRef.id
                })
            } else {
                documentReference.doc(docRef.id)
                .update({
                    descargar_guias: false,
                    descargar_relacion_envio: false,
                    guias: arrGuias.map(v => v.id_heka).sort()
                })
                .then(() => {
                    for (let guia of arrGuias) {
                        usuarioDoc
                        .collection("guias").doc(guia.id_heka)
                        .update({
                            enviado: true,
                            estado: "Enviado"
                        });
                    }

                    Swal.fire({
                        icon: "success",
                        text: "Las Guías " + guias + " Serán procesadas por un asesor, y en apróximadamente 10 minutos los documentos serán subidos."
                    });
                    document.getElementById("enviar-documentos").removeAttribute("disabled");
                })
            }
        }).then(() => {
            if(!generacion_automatizada) {
                firebase.firestore().collection("notificaciones").add({
                    mensaje: `${datos_usuario.nombre_completo} ha creado un Documento con las Guías: ${guias.join(", ")}`,
                    fecha: genFecha(),
                    guias: guias,
                    usuario: datos_usuario.nombre_completo,
                    timeline: new Date().getTime(),
                    type: "documento",
                    visible_admin: true
                }).then(() => {
                    document.getElementById("enviar-documentos").removeAttribute("disabled");
                })
            }
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
    }
}

function base64ToArrayBuffer(base64) {
    let binario = window.atob(base64);
    let bytes = new Uint8Array(binario.length);
    for(let i = 0; i < binario.length; i++) {
        let ascii = binario.charCodeAt(i);
        bytes[i] = ascii;
    }

    return bytes;
}

function generarDocumentos(arrGuias, vinculo) {
    fetch("/servientrega/crearDocumentos", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify([arrGuias, vinculo])
    }).then(res => {
        console.log(res);
        if(!res.ok) {
            throw new Error(res.status + " " + res.statusText);
        }
        if(res.status == 422) {
            throw new Error("No hubo guía que procesar.");
        }
        return res.json()
    })
    .then(respuesta => {
        console.log(respuesta);
        Swal.fire({
            icon: "success",
            text: respuesta
        });

        document.getElementById("enviar-documentos").removeAttribute("disabled");
    })
    .catch(error => {
        console.log(error);
        Swal.fire({
            icon: "error",
            text: "Hubo un error al crear los documentos: " + error.message
        });
        firebase.firestore().collection("documentos").doc(vinculo.id_doc).delete();
        document.getElementById("enviar-documentos").removeAttribute("disabled");
    })
}

let documento = [], guias = [];

//muestra los documento al admin y le otorga funcionalidad a los botones
function cargarDocumentos(filter) {
    $("#buscador-documentos").html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Cargando...
    `)
    let documentos = document.getElementById("mostrador-documentos");
    let reference = firebase.firestore().collection("documentos"), docFiltrado;
    let fecha_inicio = Date.parse(value("docs-fecha-inicio").replace(/\-/g, "/")),
        fecha_final = Date.parse(value("docs-fecha-final").replace(/\-/g, "/")) + 8.64e7;
    switch(filter) {
        case "fecha":
            docFiltrado = reference.orderBy("timeline", "desc").startAt(fecha_final).endAt(fecha_inicio);
            break;
        case "sin gestionar":
            docFiltrado = reference.where("descargar_relacion_envio", "==", false);
            break;
        default:
            docFiltrado = reference.where("guias", "array-contains-any", filter);

    }
    docFiltrado.get().then((querySnapshot) => {
        documentos.innerHTML = "";
        console.log(querySnapshot.size);
        let users = new Array();
        let counter_guias = 0;
        let counter_convencional = 0, counter_pagoContraentrega = 0;
        querySnapshot.forEach((doc) => {
            doc.data().type == "CONVENCIONAL" ? counter_convencional++ : counter_pagoContraentrega ++
            if(!users.includes(doc.data().id_user)) users.push(doc.data().id_user);
            counter_guias += doc.data().guias.length;
            
            if(doc.data().descargar_relacion_envio || doc.data().descargar_guias){
                //si tiene la informacion completa cambia el modo es que se ve la tarjeta y habilita mas funciones
                documentos.innerHTML += mostrarDocumentos(doc.id, doc.data(), "warning");
                let descargador_completo = document.getElementById("descargar-docs"+doc.id);
                descargador_completo.classList.remove("fa", "fa-file");
                descargador_completo.classList.add("fas", "fa-file-alt");
                descargador_completo.style.cursor = "alias";
                if(doc.data().descargar_relacion_envio) {
                    let nombre_relacion = doc.data().nombre_relacion ? doc.data().nombre_relacion : "Relacion_" + doc.data().guias.slice(0,5).toString();
                    $("#mostrar-relacion-envio" + doc.id).text(nombre_relacion);
                }

                if(doc.data().descargar_guias) {
                    let nombre_guias = doc.data().nombre_guias ? doc.data().nombre_guias : "Guias_" + doc.data().guias.slice(0,5).toString();
                    $("#mostrar-guias" + doc.id).text(nombre_guias);
                }
                
            } else {
                documentos.innerHTML += mostrarDocumentos(doc.id, doc.data());
            }
        })
        showStatistics("#mostrador-documentos", [
            ["Usuarios", users.length, "users"],
            ["Guías / Documentos", counter_guias +" / "+ querySnapshot.size, "file-alt"],
            ["Pago Contraentrega", counter_pagoContraentrega, "hand-holding-usd"],
            ["Convencional", counter_convencional, "hand-holding"]
        ])
    }).then(() => {
        //Luego de cargar todo, agrega funciones a los botones
        let botones = document.querySelectorAll('[data-funcion="descargar"]');
        let descargador_completo = document.querySelectorAll('[data-funcion="descargar-docs"]');
        let visor_guias = document.querySelectorAll("[data-mostrar='texto']");
        //para el boton Que carga documentos
        for(let boton of botones){
            boton.addEventListener("click", (e) => {
                boton.disabled = true;
                let idUser = e.target.parentNode.getAttribute("data-user");
                let guias = e.target.parentNode.getAttribute("data-guias").split(",");
                let nombre = e.target.parentNode.getAttribute("data-nombre");
                documento = [];
                cargarDocumento(idUser, guias).then(() =>{
                    $(document).ready(function(){
                        let data = documento;
                        if(data == '')
                            return;
                        descargarGuiasGeneradas(data, nombre + " " + guias.slice(0, 5).join("_"), guias);
                    });
                }).then(() => {
                    boton.disabled = false;
                })
            })
        }


        // Cuando esta habilitado, permite descarga el documento que ha sido enviado
        for(let descargar of descargador_completo){
            descargar.addEventListener("click", (e) => {
                
                let user_id = e.target.getAttribute("data-user"),
                    id = e.target.getAttribute("data-id_guia"),
                    guias =  e.target.getAttribute("data-guias"),
                    nombre_guias =  e.target.getAttribute("data-nombre_guias"),
                    nombre_relacion =  e.target.getAttribute("data-nombre_relacion");
                

                descargarDocumentos(user_id, id, guias, nombre_guias, nombre_relacion);
            })
        }

        for(let element of visor_guias) {
            element.addEventListener("click", () => {
                element.classList.toggle("text-truncate");
                element.style.cursor = "zoom-out";
                if(element.classList.contains("text-truncate")) element.style.cursor = "zoom-in";
            })
        };
    }).then(() => {
        subirDocumentos()
        $("#buscador-documentos").text("Buscar");
        if(documentos.innerHTML == ""){
            documentos.innerHTML = `<div class="col-2"></div>
            <p class="col card m-3 p-3 border-danger text-danger text-center">
            No Hay documentos para tu búsqueda</p><div class="col-2"></div>`;
        }
    });

}

/*Funcion que tomará un identificador como primer arg, creará un div que 
me muestre cierta información que irá siento alterada cada vez que se
llame el método
*/

function showStatistics(query, arr, insertAfter) {
    let html = document.querySelector(query);
    let div = document.createElement("div");
    div.setAttribute("id", "mostrador-total-" + query)
    div.classList.add("row");

    if(document.getElementById("mostrador-total-" + query)){
        div = document.getElementById("mostrador-total-" + query);
    }

    div.innerHTML = "";
    for(let card of arr) {
       div.innerHTML  += `<div class="col-12 col-sm-6 col-md mb-4">
            <div class="card border-left-${card[3] || "primary"} shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                        <div class="col mr-2">
                            <div class="text-xs font-weight-bold text-${card[3] || "primary"} text-uppercase mb-1">${card[0]}</div>
                            <div class="h5 mb-0 font-weight-bold text-gray-800">${card[1]}</div>
                        </div>
                        <div class="col-auto">
                            <i class="fas fa-${card[2]} fa-2x text-gray-300"></i>
                        </div>
                    
                    </div>
                </div>
            </div>
        </div>`
    }
    
    if(insertAfter) {
        html.appendChild(div);
    } else {
        html.parentNode.insertBefore(div, html)
    }
}

//En invocada cada vez que se va a cargar un documento
async function cargarDocumento(id_user, arrGuias) {
    guias = arrGuias;
    for(let guia of guias){
        await firebase.firestore().collection("usuarios").doc(id_user).collection("guias").doc(guia)
        .get().then((doc) => {
            if(doc.exists){
                documento.push(doc.data());
            }
        })
    }

}

//Me convierte el conjunto de guias descargadas en archivo CsV
function descargarGuiasGeneradas(JSONData, ReportTitle, guias) {
    console.log(JSONData)
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

    //Aca esta organizado el encabezado
    let CSV = '';
    CSV = 'sep=,' + '\r\n';
    let encabezado = "Ciudad/Cód DANE de Origen,Tiempo de Entrega,Documento de Identificación,Nombre del Destinatario,Dirección,Ciudad/Cód DANE de destino,Departamento,Teléfono,Correo Electrónico Destinatario,Celular,Departamento de Origen,Direccion Remitente,Nombre de la Unidad de Empaque,Dice Contener,Valor declarado,Número de Piezas,Cantidad,Alto,Ancho,Largo,Peso,Producto,Forma de Pago,Medio de Transporte,Campo personalizado 1,Unidad de longitud,Unidad de peso,Centro de costo,Recolección Esporádica,Tipo de Documento,Nombre contacto remitente,Correo electrónico del remitente,Numero de telefono movil del remitente.,Valor a cobrar por el Producto";
    CSV += encabezado + '\r\n';
    
    console.log(arrData.length);
    //Se actulizara cada cuadro por fila, ***se comenta cual es el campo llenado en cada una***
    for (var i = 0; i < arrData.length; i++) {
        for(let campo in arrData[i]) {
            arrData[i][campo] = arrData[i][campo].toString().replace(/,/g, "-");
        }
        let row = "";
        //Ciudad/Cód DANE de Origen
        row += '"' + arrData[i].ciudadR + '",';
        //Tiempo de Entrega
        row += 1+",";
        // Documento de Identificación
        row += '"' + arrData[i].identificacionD + '",';
        // Nombre del Destinatario
        row += '"' + arrData[i].nombreD + '",';
        //Dirección
        row += '"' + arrData[i].direccionD + '",';
        // Ciudad/Cód DANE de destino
        row += '"' + arrData[i].ciudadD + '",';
        //Departamento
        row += '"' + arrData[i].departamentoD + '",';
        //Teléfono
        row += '"' + arrData[i].telefonoD + '",';
        //Correo Electrónico Destinatario
        row += '"' + arrData[i].correoD + '",';
        //Celular
        row += '"' + arrData[i].celularD + '",';
        //Departamento de Origen
        row += '"' + arrData[i].departamentoR + '",';
        //Direccion Remitente
        row += '"' + arrData[i].direccionR + '",';
        // Nombre de la Unidad de Empaque
        row += 'heka,';
        //Dice Contener
        row += '"' + arrData[i].dice_contener + '",';
        // Valor declarado
        row += ',';
        // Número de Piezas
        row += '1,';
        // Cantidad
        row += '1,';
        //Alto
        row += '"' + arrData[i].alto + '",';
        //Ancho
        row += '"' + arrData[i].ancho + '",';
        // Largo
        row += '"' + arrData[i].largo + '",';
        //Peso
        row += '"' + arrData[i].peso + '",';
        //Producto
        row += '2,';
        //Forma de Pago
        row += '2,';
        //Medio de Transporte
        row += '1,';
        // Campo personalizado 1
        row += '"' + guias[i] + '",';
        // Unidad de longitud
        row += 'cm,';
        // Unidad de peso
        row += 'kg,';
        //Centro de costo
        row += '"' + arrData[i].centro_de_costo + '",';
        //Recolección Esporádica
        row += '"' + arrData[i].recoleccion_esporadica + '",';
        // Tipo de Documento
        row += '"' + arrData[i].tipo_doc_dest + '",';
        // Nombre contacto remitente
        row += '"' + arrData[i].nombreR + '",';
        // Correo electrónico del remitente
        row += '"' + arrData[i].correoR + '",';
        // Numero de telefono movil del remitente.
        row += '"' + arrData[i].celularR + '",';
        // Valor a cobrar por el Producto
        row += '"' + arrData[i].valor + '",';

        row.slice(0, row.length - 1);
        
        //agg un salto de linea por cada fila
        CSV += row + '\r\n';
        console.log(row)
    }
    
    if (CSV == '') {        
        alert("Datos invalidos");
        return;
    }   
    
    //nombre del archivo por defecto
    var fileName = "heka_";
    //Toma los espacios en blanco en el nombre colocado y los reemplaza con guion bajo
    fileName += ReportTitle.replace(/ /g,"_");   
    
    //Para formato CSV
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // un Tag link que no sera visible, pero redirigira al archivo para descargarlo en cuanto se active este funcion
    var link = document.createElement("a");    
    link.href = uri;
    
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function descargarInformeGuias(JSONData, ReportTitle) {
    console.log(JSONData)
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

    //Aca esta organizado el encabezado
    let CSV = '';
    CSV = 'sep=,' + '\r\n';
    let encabezado = "# Guía Heka,# Guía Servientrega,Centro de Costo,Comisión Heka,Comisión Servientrega,Flete,Recaudo,Total,Fecha";
    CSV += encabezado + '\r\n';
    
    console.log(arrData.length);
    //Se actulizara cada cuadro por fila, ***se comenta cual es el campo llenado en cada una***
    for (var i = 0; i < arrData.length; i++) {
        let row = "";
        // # Guia Heka
        row += '"' + arrData[i].id_heka + '",';
        // Numero Guia Servientrega
        row += '"' + arrData[i].numeroGuia + '",';
        // Centro de costo
        row += '"' + arrData[i].centro_de_costo + '",';
        // Comision heka
        row += '"' + arrData[i].detalles.comision_heka + '",';
        // Comision servientrega
        row += '"' + arrData[i].detalles.comision_trasportadora + '",';
        //Flete
        row += '"' + arrData[i].detalles.flete + '",';
        //Recaudo
        row += '"' + arrData[i].detalles.recaudo + '",';
        //Total
        row += '"' + arrData[i].detalles.total + '",';
        // Fecha
        row += '"' + arrData[i].fecha + '",';

        
        row.slice(0, row.length - 1);
        
        //agg un salto de linea por cada fila
        CSV += row + '\r\n';
        console.log(row)
    }
    
    if (CSV == '') {        
        alert("Datos invalidos");
        return;
    }   
    
    //nombre del archivo por defecto
    var fileName = "guias_";
    //Toma los espacios en blanco en el nombre colocado y los reemplaza con guion bajo
    fileName += ReportTitle.replace(/ /g,"_");   
    
    //Para formato CSV
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // un Tag link que no sera visible, pero redirigira al archivo para descargarlo en cuanto se active este funcion
    var link = document.createElement("a");    
    link.href = uri;
    
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function subirDocumentos(){
    let cargadores = document.getElementsByName('cargar-documentos');
    let botones_envio = document.querySelectorAll('[data-funcion="enviar"]');

    for(let cargador of cargadores){
        //verifica y muestra cada documetno cargado
        cargador.addEventListener("change", (e) => {
            console.log(e.target);
            console.log(e.target.files[0].name);
            let tipo_de_doumento = e.target.getAttribute("data-tipo");
            let id_doc = e.target.parentNode.getAttribute("data-id_guia");
            let mostrador_relacion = document.getElementById("mostrar-relacion-envio" + id_doc);
            let mostrador_guias = document.getElementById("mostrar-guias" + id_doc);
            if(tipo_de_doumento == "relacion-envio") {
                mostrador_relacion.innerHTML = "Relación de envíos: " + e.target.files[0].name
            } else {
                mostrador_guias.innerHTML = "Guías: " + e.target.files[0].name
            }
            
            if(mostrador_guias.textContent || mostrador_relacion.textContent){
                document.getElementById("subir" + id_doc).classList.remove("d-none")
            } else {
                document.getElementById("subir" + id_doc).classList.add("d-none")
            }

        })
    }

    for (let enviar of botones_envio) {
        enviar.addEventListener("click", async (e) => {
            //Toma los archivos cargados y los envia a storage
            enviar.disabled = true;
            let parent = e.target.parentNode
            let id_doc = parent.getAttribute("data-id_guia");
            let relacion_envio = document.getElementById("cargar-relacion-envio" + id_doc);
            let guias = document.getElementById("cargar-guias" + id_doc);
            let id_user = parent.getAttribute("data-user");
            let numero_guias = parent.getAttribute("data-guias").split(",");
            let nombre_usuario = parent.getAttribute("data-nombre");
            let nombre_documento = numero_guias[0] + ((numero_guias.length > 1) ?
                "_"+numero_guias[numero_guias.length - 1] : "");
            let nombre_guias = "Guias" + nombre_documento;
            let nombre_relacion = "Relacion" + nombre_documento;
            
            console.log(relacion_envio.files[0]);
            console.log(guias.files[0]);
            console.log(numero_guias);
            console.log(nombre_documento);
            
            var storageUser = firebase.storage().ref().child(id_user + "/" + id_doc);
            let guias_enviadas , relacion_enviada;
            //Sube los documentos a Storage y coloca el indice de busqueda en firestore().documentos
            if(relacion_envio.files[0]) {
                relacion_enviada = await storageUser.child(nombre_relacion + ".pdf")
                .put(relacion_envio.files[0]).then((querySnapshot) => {
                    firebase.firestore().collection("documentos").doc(id_doc).update({
                        descargar_relacion_envio: true, nombre_relacion
                    })
                    return true;
                });
            }
            
            if(guias.files[0]) {
                guias_enviadas = await storageUser.child(nombre_guias + ".pdf")
                .put(guias.files[0]).then((querySnapshot) => {
                    firebase.firestore().collection("documentos").doc(id_doc).update({
                        descargar_guias: true, nombre_guias
                    })
                    return true;
                })
            }
            
            if(guias_enviadas || relacion_enviada) {
                avisar("Documentos cargados con éxito", nombre_usuario + " ya puede descargar sus documentos");
                firebase.firestore().collection("notificaciones").add({
                    mensaje: `Se ha cargado un documento con las guias: ${numero_guias} a su cuenta.`,
                    fecha: genFecha(),
                    guias: numero_guias.split(","),
                    user_id: id_user,
                    visible_user: true,
                    timeline: new Date().getTime(),
                    type: "documento"
                })
            }

            enviar.disabled = false;

        })
    }

}


//Similar a historial de Guias, carga los documentos al usuario por fecha.
function actualizarHistorialDeDocumentos(timeline){
    // $('#tabla_documentos').DataTable().destroy();
    $("#btn-historial-docs").html(`<span class="spinner-border 
    spinner-border-sm" role="status" aria-hidden="true"></span>
    Cargando...`)
    if(user_id){     
        let fecha_inicio = timeline || Date.parse($("#docs-fecha-inicio").val().replace(/\-/g, "/")),
        fecha_final = timeline || Date.parse($("#docs-fecha-final").val().replace(/\-/g, "/"));
      var reference = firebase.firestore().collection("documentos")
      .where("id_user", "==", localStorage.user_id)
      .orderBy("timeline", "desc").startAt(fecha_final + 8.64e7).endAt(fecha_inicio)
      
      reference.get().then((querySnapshot) => {
        var tabla=[];
        console.log(localStorage.user_id)
        if(document.getElementById('body-documentos')){
          inHTML("body-documentos", "");
        }  

        //query que me carga la información en la tabla
        querySnapshot.forEach((doc) => {
            tabla.push(mostrarDocumentosUsuario(doc.id, doc.data()));
            //funcionalidad de botones para descargar guias y relaciones
            firebase.firestore().collection("documentos").doc(doc.id).onSnapshot((row) => {
              let nombre_guias = row.data().nombre_guias ? row.data().nombre_guias : "guias" + row.data().guias.toString();
              let nombre_relacion = row.data().nombre_relacion ? row.data().nombre_relacion : "relacion envio" + row.data().guias.toString();
              if(row.data().descargar_guias){
                  let btn_descarga = document.getElementById("boton-descargar-guias" + doc.id);
                btn_descarga.removeAttribute("disabled");
                btn_descarga.addEventListener("click", (e) => {
                  if(row.data().base64Guias && !row.data().nombre_guias) {
                     let base64 = row.data().base64Guias;
                     let buff = base64ToArrayBuffer(base64);
                     let blob = new Blob([buff], {type: "application/pdf"});
                     let url = URL.createObjectURL(blob);
                     window.open(url);
                  } else {
                      console.log(e.target.parentNode)
                      firebase.storage().ref().child(user_id + "/" + doc.id + "/" + nombre_guias + ".pdf")
                      .getDownloadURL().then((url) => {
                        console.log(url)
                        window.open(url, "_blank");
                      })
                  }
                })
              }
              if(row.data().descargar_relacion_envio){
                  let btn_descarga = document.getElementById("boton-descargar-relacion_envio" + doc.id);
                  btn_descarga.removeAttribute("disabled");
                  btn_descarga.addEventListener("click", (e) => {
                    if(row.data().base64Manifiesto && !row.data().nombre_relacion) {
                      let base64 = row.data().base64Manifiesto;
                      let buff = base64ToArrayBuffer(base64);
                      let blob = new Blob([buff], {type: "application/pdf"});
                      let url = URL.createObjectURL(blob);
                      window.open(url);
                    } else {
                        console.log(e.target.parentNode)
                        firebase.storage().ref().child(user_id + "/" + doc.id + "/" + nombre_relacion + ".pdf")
                        .getDownloadURL().then((url) => {
                          console.log(url)
                          window.open(url, "_blank");
                        })
                    }
                })
              }
            });   
              
        });
    
          var contarExistencia=0;
          for(let i=tabla.length-1;i>=0;i--){
            
            if(document.getElementById('body-documentos')){
              printHTML('body-documentos',tabla[i]);
            }
            contarExistencia++;
          }
    
          if(contarExistencia==0){
            if(document.getElementById('historial-docs')){
              document.getElementById('historial-docs').style.display='none';
            }
            if(document.getElementById('nohaydatosHistorialdocumentos')){
              document.getElementById('nohaydatosHistorialdocumentos').style.display='block';
              location.href='#nohaydatosHistorialdocumentos';
            }
          }else{
            if(document.getElementById('historial-docs')){
              document.getElementById('historial-docs').style.display='block';
            }
            if(document.getElementById('nohaydatosHistorialdocumentos')){
              document.getElementById('nohaydatosHistorialdocumentos').style.display='none';
            }
            // $(document).ready( function () {
            //   $('#tabla_documentos').DataTable();
            // });
          }
      }).then(() => {
          let view_guide = document.querySelectorAll('[data-mostrar="texto"]');
          for(let element of view_guide) {
            element.addEventListener("click", () => {
                element.classList.toggle("text-truncate");
                element.style.cursor = "zoom-out";
                if(element.classList.contains("text-truncate")) element.style.cursor = "zoom-in";
            })
          }
        $("#btn-historial-docs").html("Buscar")
      });
    } 
}

function descargarDocumentos(user_id, id_doc, guias, nombre_guias, nombre_relacion){
    nombre_guias = nombre_guias == "undefined" ? "guias" + guias : nombre_guias;
    nombre_relacion = nombre_relacion == "undefined" ? "relacion envio" + guias : nombre_relacion;

    firebase.firestore().collection("documentos").doc(id_doc).get()
    .then(doc => {
        if(doc.exists) {
            if(doc.data().base64Guias && !doc.data().nombre_guias) {
                let base64 = doc.data().base64Guias;
                let buff = base64ToArrayBuffer(base64);
                let blob = new Blob([buff], {type: "application/pdf"});
                let url = URL.createObjectURL(blob);
                window.open(url);  
            } else {
                firebase.storage().ref().child(user_id + "/" + id_doc + "/" + nombre_guias + ".pdf")
                .getDownloadURL().then((url) => {
                    window.open(url, "_blank");
                });

            }

            if(doc.data().base64Manifiesto && !doc.data().nombre_relacion){
                let base64 = doc.data().base64Manifiesto;
                let buff = base64ToArrayBuffer(base64);
                let blob = new Blob([buff], {type: "application/pdf"});
                let url = URL.createObjectURL(blob);
                window.open(url);
            } else {
                firebase.storage().ref().child(user_id + "/" + id_doc + "/" + nombre_relacion + ".pdf")
                .getDownloadURL().then((url) => {
                    window.open(url, "_blank");
                });
            }
        }
    })

}

// ESta función pronto desaparecerá
function actualizarEstado(){
    document.querySelector("#cargador-actualizador").classList.remove("d-none");
    let data = new FormData(document.getElementById("form-estado"));
    console.log(data);
    console.log(data.get("documento"));
    fetch("/excel_to_json", {
        method: "POST",
        body: data
    }).then((res) => {
        if(!res.ok){
            throw Error("Lo sentimos, no pudimos cargar su documento, reviselo y vuelvalo a subir")
        }
        res.json().then((datos) => {
            let res = "";
            if(datos.length == 0){
                res = "vacio";
            }
    
            for (let dato of datos){
                let x = {
                    numero_guia_servientrega: dato["Número de Guia"],
                    fecha_envio: dato["Fecha de Envio"],
                    producto: dato["Producto"],
                    fecha_imp_envio: dato["Fecha Imp. Envio"],
                    tipo_trayecto: dato["Tipo Trayecto"],
                    valor_total_declarado: dato["Valor Total Declarado"],
                    valor_flete: dato["Valor Flete"],
                    valor_sobreflete: dato["Valor SobreFlete"],
                    valor_liquidado: dato["Valor Liquidado"],
                    id_guia: dato["IdCliente"],
                    estado_envio: dato["Estado Envío"],
                    mensaje_mov: dato["Mensaje Mov"],
                    fecha_ult_mov: dato["Fecha Ult Mov"],
                    nombre_centro_costo: dato["Nombre Centro Costo"]
                };

                console.log(x);
                if(x.id_guia){
                    firebase.firestore().collectionGroup("guias")
                    .where("id_heka", "==", x.id_guia)
                    .get().then(querySnapshot => {
                        querySnapshot.forEach(doc => {
                            firebase.firestore().doc(doc.ref.path)
                            .update({
                                numeroGuia: x.numero_guia_servientrega,
                                estado: x.estado_envio
                            })
                            .then(() => {
                                
                            })
                            .catch(() => {
                                avisar("Error!", "Hubo un error inesperado");
                            });
                        })
                    })
                } else {
                    res = "falta id";
                }
            }

            return res;
        }).then((r) => {
            console.log(r)
            if(r == "vacio"){
                avisar("¡Error!", "El documento está vacío, por favor verifique que el formato ingresado es un formato actual de excel, preferiblemente .xlsx", "advertencia");
            } else if (r == "falta id"){
            avisar("Algo Salió mal", "hubo un error en alguno de los documentos, es posible que no todos se hayan enviado correctamente", "aviso");
          } else {
            avisar("Documentos Actualizados", "La actualización de guías ha sido exitosa");
          }

          document.querySelector("#cargador-actualizador").classList.add("d-none");
        })
    }).catch((err) => {
        avisar("Algo salió mal", err, "advertencia")
        document.querySelector("#cargador-actualizador").classList.add("d-none");
    })
}

// revisarNotificaciones();
function revisarNotificaciones(){
    let notificador = document.getElementById("notificaciones"); 
    let audio = document.createElement("audio");
    audio.innerHTML = `<source type="audio/mpeg" src="./recursos/notificacion.mp3">`;
    let busqueda = localStorage.user_id, operador = "==", buscador = "user_id", novedades;

    if(administracion) {
        busqueda = 0;
        operador = ">=";
        buscador = "timeline"
        novedades = document.getElementById("notificaciones-novedades");
        novedades.addEventListener("click", e => {
            let badge = novedades.querySelector("span");
            badge.textContent = 0;
            badge.classList.add("d-none");
        })
    }
    notificador.addEventListener("click", e => {
        let badge = notificador.querySelector("span");
        badge.textContent = 0;
        badge.classList.add("d-none");
    });

    console.log(busqueda);

    firebase.firestore().collection("notificaciones").orderBy("timeline")
    .where(buscador, operador, busqueda)
    .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            let notification = change.doc.data();
            let identificador = change.doc.id;
            let mostrador, contador;
            if((!administracion && notification.visible_user && notification.user_id == busqueda) || 
            administracion && notification.visible_admin) {
                if(change.type == "added" || change.type == "modified") {
                    audio.play();
                    if(notification.type == "novedad") {
                        contador = novedades.querySelector("span");
                        contador.classList.remove("d-none");
                        contador.innerHTML = parseInt(contador.textContent) + 1;
                        mostrador = document.getElementById("mostrador-info-novedades");
                    } else {
                        contador = notificador.querySelector("span");
                        contador.classList.remove("d-none");
                        contador.innerHTML = parseInt(contador.textContent) + 1;
                        mostrador = document.getElementById("mostrador-notificaciones");
                    }
                    if(parseInt(contador.textContent) > 9) {
                        contador.innerHTML = 9 + "+".sup()
                    }
                    mostrador.insertBefore(mostrarNotificacion(notification, notification.type, identificador), mostrador.firstChild);
                    // mostrador.append(mostrarNotificacion(notification, notification.type, identificador));
                } else if (change.type == "removed") {
                    if(document.querySelector("#notificacion-"+identificador)){
                        if(notification.type == "novedad") {
                            contador = novedades.querySelector("span");
                            contador.innerHTML = parseInt(contador.textContent) <= 0 ? 0 : parseInt(contador.textContent) - 1;
                        } else {
                            contador = notificador.querySelector("span");
                            contador.innerHTML = parseInt(contador.textContent) <= 0 ? 0 : parseInt(contador.textContent) - 1;
                        }
                        $(".notificacion-"+identificador).remove();
                    }
                }
            } else {
                $(".notificacion-"+identificador).remove();
            }
        });
    })
    
}

function eliminarNotificaciones(){
    let visible = administracion ? "visible_admin" : "visible_user";
    firebase.firestore().collection("notificaciones").where(visible, "==", true).get()
    .then(querySnapshot => {
        console.log("aver")
        querySnapshot.forEach(doc => {
            let notificacion = firebase.firestore()
            .collection("notificaciones").doc(doc.id)

            if((administracion && doc.data().type == "documeto") || 
            (doc.data().user_id == user_id)) {
                notificacion.delete();
            }

        })
    })
}

function descargarHistorialGuias(){
    avisar("Solicitud Recibida", "Procesando...", "aviso")
    let fechaI = new Date(value("guias-fechaI-modal")).getTime();
    let fechaF = new Date(value("guias-fechaF-modal")).getTime();
    firebase.firestore().collection("usuarios").get().then(querySnapshot => {
        return new Promise((res, rej) => {
            let mirar = [];
            querySnapshot.forEach((doc) => {
                let x = doc.ref.collection("guias").get().then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        let fecha = new Date(doc.data().fecha).getTime()
                        if(fechaI <= fecha && fecha <= fechaF){
                            let res = doc.data();
                            res.id_heka = doc.id;
                            mirar.push(res);

                            /*esta subida de datos está idealizada para copiar los datos de las guías de
                            los usuarios y sacarlo al nodo guias*/
                            // firebase.firestore().collection("guias").doc(doc.id).set(res);
                        }
                    })
                    return mirar
                })
                res(x);
            });
        })
    }).then((guias) => {
        avisar("Solicitud Procesada", "Espere un momento, en breve iniciaremos con su descarga")
        setTimeout(() => {
            guias.sort((a,b) => {
                if(parseInt(a.guia) > parseInt(b.guia)) {
                    return 1
                } else {
                    return -1
                }
            })
            console.log(guias)
            console.log(guias.length)

            descargarInformeGuias(guias, guias[0].id_heka + "-" + guias[guias.length - 1].id_heka)
        }, 3000)
    });
}

function cargarNovedades(){
    document.querySelector("#cargador-novedades").classList.remove("d-none");
    let data = new FormData(document.getElementById("form-novedades"));
    console.log(data);
    console.log(data.get("documento"));
    fetch("/excel_to_json", {
        method: "POST",
        body: data
    }).then(res => {
        if(!res.ok) {
            throw Error("Lo siento, No pudimos cargar sus Novedades, por favor, revise su documento e intent de nuevo");
        }
        res.json().then(datos => {
            let novedades = [];
            for(let data of datos){
                if(data.NOVEDAD && data["NUMERO DOCUMENTO CLIENTE4"]) {
                    let novedad = {
                        guia: data["NUMERO GUIA"],
                        fecha_envio: data["FECHA ENVIO"],
                        id_heka: data["NUMERO DOCUMENTO CLIENTE4"],
                        centro_de_costo: data["CENTRO COSTO CLIENTE"] || "SCC",
                        novedades: [data["NOVEDAD"]],
                        fechas_novedades: [data["FECHA NOVEDAD"]]
                    }

                    let i = 1
                    while(i <= 3){
                        if(data["NOVEDAD " + i]){
                            novedad.novedades.push(data["NOVEDAD " + i]);
                            novedad.fechas_novedades.push(data["FECHA NOVEDAD " + i]);
                        }

                        i++;
                    }

                    novedades.push(novedad);
                    // firebase.firestore().collection("novedades").doc(novedad.guia.toString()).set(novedad);
                }
            }
            console.log(novedades);
            document.querySelector("#cargador-novedades").classList.add("d-none"); 
        })
    }).catch((err) => {
        avisar("Algo salió mal", err, "advertencia")
        document.querySelector("#cargador-novedades").classList.add("d-none");
    })
}

function revisarMovimientosGuiasViejo(usuario){
    document.getElementById("visor_novedades").innerHTML = "";
    let operador = "==", filtro = usuario
    if(!usuario && administracion){
        operador = "!="; filtro = "";
    }

    firebase.firestore().collection("novedades").where("centro_de_costo", operador, filtro).get()
    .then(querySnapshot => {
        let res = []
        querySnapshot.forEach(doc => {
            res.push(doc.data());
        })
        return res;
    }).then(res => {
        let usuarios = []
        res.sort((a,b) => {
            if(a.centro_de_costo > b.centro_de_costo){
                return 1
            } else if(a.centro_de_costo < b.centro_de_costo){
                return -1
            } else {
                return 0
            }
        }).reduce((a,b) => {
            if(a.centro_de_costo != b.centro_de_costo){
                usuarios.push(a.centro_de_costo);
            }
            return b;
        });

        for (let usuario of usuarios){
            let filtrado = res.filter(v => {
                return v.centro_de_costo == usuario;
            })

            console.log(filtrado);
            tablaMovimientosGuias(filtrado);
        }
    })
}

function revisarMovimientosGuias(admin, seguimiento, id_heka, guia){
    let filtro = "", toggle = "!=", buscador = "centro_de_costo"
    document.getElementById("cargador-novedades").classList.remove("d-none");
    
    if(($("#filtrado-novedades-guias").val() || guia) && admin){
        let filtrado = guia || $("#filtrado-novedades-guias").val().split(",");
        if(typeof filtrado == "object") {
            filtrado.forEach((v, i) => {
                firebase.firestore().collectionGroup("guias").where("numeroGuia", "==", v.trim())
                .get().then(querySnapshot => {
                    querySnapshot.size == 0 ? $("#cargador-novedades").addClass("d-none") : "";
                    querySnapshot.forEach(doc => {
                        let path = doc.ref.path.split("/");
                        let data = doc.data();
                        consultarGuiaFb(path[1], doc.id, data, "Consulta Personalizada", i+1, filtrado.length);
                    })
                })
            })
        } else {
            firebase.firestore().collectionGroup("guias").where("numeroGuia", "==", filtrado)
            .get().then(querySnapshot => {
                querySnapshot.size == 0 ? $("#cargador-novedades").addClass("d-none") : "";
                querySnapshot.forEach(doc => {
                    let path = doc.ref.path.split("/");
                    let data = doc.data();
                    consultarGuiaFb(path[1], doc.id, data, "Solucionar Novedad");
                })
            })
        }
    } else if (admin) {
        if($("#filtrado-novedades-usuario").val()){
            filtro = $("#filtrado-novedades-usuario").val();
            toggle = "==";
        }
    
        firebase.firestore().collectionGroup("guias").where(buscador, toggle, filtro).get()
        .then(querySnapshot => {
            let contador = 0;
            let size = querySnapshot.size;
            querySnapshot.forEach(doc => {
                let path = doc.ref.path.split("/")
                let dato = doc.data();
                contador++
                consultarGuiaFb(path[1], doc.id, dato, dato.centro_de_costo, contador, size);
                // console.log(doc.data());
            });
            
        })
    } else {
        if((document.getElementById("visor_novedades").innerHTML == "" && seguimiento == "once") || !seguimiento) {
            firebase.firestore().collection("usuarios").doc(localStorage.user_id).collection("guias")
            .where("numeroGuia", "!=", null).get().then(querySnapshot => {
                let contador = 0;
                let size = querySnapshot.size;
                $("#visor_novedades").html("");
                querySnapshot.forEach(doc => {
                    let dato = doc.data();
                    contador++
    
                    consultarGuiaFb(user_id, doc.id, dato, "Posibles Novedades", contador, size);
                })
            })
        } else {
            document.getElementById("cargador-novedades").classList.add("d-none");
        }
    }
}

document.getElementById("btn-revisar-novedades").addEventListener("click", (e) => {
    e.preventDefault();
    revisarMovimientosGuias(administracion);
})

$("#btn-vaciar-consulta").click(() => {
    $("#visor_novedades").html("");
})

//En cualquier momento esta dejará dde funcionar
function consultarGuia(numGuia, usuario = "Consulta Personalizada", contador, totalConsultas){
    let data = {"guia": numGuia}
    fetch("/servientrega/consultarGuia", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then((res) => res.json())
    .then(data => {
        let parser = new DOMParser();
        data = parser.parseFromString(data, "application/xml");
        console.log(data.querySelector("ConsultarGuiaResult"));
        if(numGuia){
            if(data.querySelector("NumGui")){
                let informacion = {
                    fechaEnvio: data.querySelector("FecEnv").textContent,
                    numeroGuia: data.querySelector("NumGui").textContent,
                    estadoActual: data.querySelector("EstAct").textContent,
                    movimientos: []
                }
                data.querySelectorAll("InformacionMov").forEach(mov => {
                    informacion.movimientos.push({
                        movimiento: mov.querySelector("NomMov").textContent,
                        fecha: mov.querySelector("FecMov").textContent,
                        descripcion: mov.querySelector("DesMov").textContent,
                        idViewCliente: mov.querySelector("IdViewCliente").textContent,
                        tipoMov: mov.querySelector("TipoMov").textContent,
                        DesTipoMov: mov.querySelector("DesTipoMov").textContent,
                    })
                });
    
                // console.log(informacion);
                tablaMovimientosGuias(informacion, usuario)
            } else {
                document.getElementById("visor_novedades").innerHTML += `
                    <p class="border border-danger p-2 m-2">La Guía Número ${numGuia} No fue Encontrada en la base de datos.
                    <br>
                    Por favor, verifique que esté bien escrita</p>
                `;
            }
        }
        if(contador == totalConsultas){
            document.getElementById("cargador-novedades").classList.add("d-none");
        }
    })
}

actualizarMovimientoGuia();
function actualizarMovimientoGuia() {
    if(!administracion)
    usuarioDoc.collection("guias").where("numeroGuia", "!=", null)
    .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if(change.type == "modified") {
                consultarGuiaFb(user_id, change.doc.id, change.doc.data());
            }
        })
    })
}

function consultarGuiaFb(id_user, id, extraData, usuario = "Movimientos", contador, total_consulta){
    //Cuando Id_user existe, id corresponde a el id_heka, cuando no, corresponde al número de gíia
   if(id_user) {
       firebase.firestore().collection("usuarios").doc(id_user).collection("estadoGuias").doc(id)
       .get().then(doc => {
           if(doc.exists) {
               if(administracion || doc.data().movimientos[doc.data().movimientos.length - 1].IdConc != 0)
               tablaMovimientosGuias(doc.data(), extraData, usuario, id, id_user);
            }
       }).then(() => {
           if(contador == total_consulta) {
               $("#cargador-novedades").addClass("d-none");
               $("#tabla-estadoGuias-"+usuario.replace(/\s/g, "")).DataTable({
                   destroy: true
               })
           }
       })
   } else {
       firebase.firestore().collectionGroup("estadoGuias").where("numeroGuia", "==", id)
       .get().then(querySnapshot => {
           querySnapshot.forEach(doc => {
               let path = doc.ref.path.split("/");
               tablaMovimientosGuias(doc.data(), extraData, usuario, path[3], path[1]);
           })
       }).then(() => {
           if(contador == total_consulta) {
               $("#cargador-novedades").addClass("d-none");
           }
       })
   }
}

//En cualquier momento esta no servirá
function consultarNovedad(numGuia, usuario = "Novedades Personalizadas", contador, totalConsultas, observacion, id_heka, validaciones){
    fetch("/servientrega/estadoGuia", {
        method: "POST",
        body: JSON.stringify({"guia": numGuia}),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then((res) => res.json())
    .then(data => {
        let parser = new DOMParser();
        data = parser.parseFromString(data, "application/xml");
        let estadoGuia = data.querySelector("EstadosGuias");
        console.log(estadoGuia);
        if(numGuia){
            if(estadoGuia.querySelector("Estado_Envio") != "ENTREGADO") {
                let dataToObj;
                if(estadoGuia.querySelector("Novedad") && estadoGuia.querySelector("Fecha_Entrega")) {
                    dataToObj = {
                        guia: estadoGuia.querySelector("Guia").textContent,
                        novedad: estadoGuia.querySelector("Novedad").textContent,
                        fecha: estadoGuia.querySelector("Fecha_Entrega").textContent
                    }
                    
                } else if (estadoGuia.querySelector("Novedad") && !estadoGuia.querySelector("Fecha_Entrega")) {
                    dataToObj = {
                        guia: estadoGuia.querySelector("Guia").textContent,
                        novedad: estadoGuia.querySelector("Novedad").textContent,
                        fecha: ""
                    }
                }


                if(validaciones && dataToObj){
                    console.log("Si entró")
                    if(dataToObj.guia == 0){
                        tablaNovedades(dataToObj, {}, usuario, observacion, id_heka);
                    } else if(validaciones.resuelta || new Date(validaciones.fecha).getTime() <= new Date(dataToObj.fecha).getTime()) {
                        tablaNovedades(dataToObj, {}, usuario, observacion, id_heka, validaciones.resuelta);
                    }
                } else {
                    if(dataToObj){
                        tablaNovedades(dataToObj, {}, usuario, observacion, id_heka);
                        if(dataToObj.novedad && dataToObj.guia != 0){
                            document.querySelectorAll(".icon-notificacion-novedad").forEach(i => {
                                i.classList.remove("d-none");
                            });
                        }
                    }
                }
            }
        }


        if(contador == totalConsultas){
            document.getElementById("cargador-novedades").classList.add("d-none");
        }
    })
    
}

function consultarNovedadFb(numGuia, usuario = "Novedades", contador, totalConsultas, solucion, id_heka, user_id, info_adicional) {
    firebase.firestore().collection("usuarios").doc(user_id).collection("novedades").doc(id_heka)
    .get().then((doc) => {
        if(doc.exists && numGuia) {
            let dataToObj = {
                guia: doc.data().guia,
                novedad: doc.data().novedad,
                fecha: doc.data().fecha
            }
            console.log(doc.data().guia, doc.data().solucionada);

            if (doc.data().solucionada && !administracion && usuario == "nuevas") {

            } else {
                tablaNovedades(dataToObj, info_adicional, usuario, solucion, id_heka, doc.data().solucionada);
            }         
        }
    }).then(() => {
        if(contador == totalConsultas){
            $("#tabla-novedades-"+usuario.replace(" ", "")).DataTable({
                destroy: true,
                autoWidth: false
            })
            document.getElementById("cargador-novedades").classList.add("d-none");
            if($("#visor_novedades").html() == ""){
                $("#visor_novedades").html(`<div class="row"><div class="col-2"></div>
                <p class="col card m-3 p-3 border-danger text-danger text-center">
                Sin novedades</p><div class="col-2"></div></div>`);
            }
        }
        
    })

  
}

function crearDatosPrueba() {
    let objectProof = new Array();
    let sellers = ["SellerNuevo", "Seller2", "Seller3", "seller4"];
    let idInicial = 1234
    let id_ficticio = new Array(4)
    for(let i = 0; i < id_ficticio.length; i++){
        let letra = new Array(8);
        for(let j = 0; j < letra.length; j++){
            letra[j] = String.fromCharCode(Math.floor(Math.random() * (122 - 97)) + 97);
            id_ficticio[i] = letra.join("");
        }
    }
    id_ficticio[0] = "nk58Yq6Y1GUFbaaRkdMFuwmDLxO2";
    // id_ficticio[0] = "000000";
    console.log(id_ficticio)
    
    for (let i = 0; i < 20; i++){
        let numero = Math.floor(Math.random() * (sellers.length))
        let obj = {
            id_heka: idInicial + i,
            centro_de_costo: sellers[numero],
            user_debe: (Math.floor((Math.random() * 20000) / 50) + 1000) * 50,
            fecha: "2021-05-" + Math.floor(Math.random() * 31),
            id_user: id_ficticio[numero]
        }


        objectProof.push(obj)
    }
    return objectProof;
}

function revisarDeudas() {
    firebase.firestore().collectionGroup("guias")
    .where("user_debe", ">", 0).get()
    .then(querySnapshot => {
        let id_users = new Array()
        querySnapshot.forEach(doc => {
            let data = doc.data();
            mostradorDeudas(data);
            if(id_users.indexOf(data.id_user) == -1) {
                id_users.push(data.id_user);
            }
        });
        id_users.forEach(async id_user => {
            let reference = firebase.firestore().collection("usuarios")
    
            let saldo = await reference.doc(id_user)
            .collection("informacion").doc("heka")
            .get().then(doc => {
                if(doc.exists){
                    return doc.data().saldo
                }
                return "saldo no encontrado"
            });
            consolidadorTotales("#deudas-"+id_user, saldo);
        })
        habilitarSeleccionDeFilasInternas('[data-function="selectAll"]')
    })
};

function revisarDeudasPrueba() {
    let objPrueba = crearDatosPrueba();
    let id_users = new Array()
    for(let data of objPrueba) {
        mostradorDeudas(data);
        if(id_users.indexOf(data.id_user) == -1) {
            id_users.push(data.id_user);
        }
    }
    console.log(id_users);
    id_users.forEach(async id_user => {
        let reference = firebase.firestore().collection("usuarios")

        let saldo = await reference.doc(id_user)
        .collection("informacion").doc("heka")
        .get().then(doc => {
            if(doc.exists){
                return doc.data().saldo
            }
            return "Usuario no encontrado"
        });
        console.log(saldo);
        consolidadorTotales("#deudas-"+id_user, saldo);
    })
    habilitarSeleccionDeFilasInternas('[data-function="selectAll"]')
    // consolidadorTotales('[data-function="consolidarTotales"]');
}

function habilitarSeleccionDeFilasInternas(query) {
    $(query).on("change", function() {
        let table = $(this).parent().parent().next();
        let inpInt = table.find("input");
        inpInt.prop("checked", !$(this).children("input").prop("checked"))
        inpInt.click()
    })
}

function consolidadorTotales(query, saldo) {
    // let mostradores = new Array();
    let deuda = typeof saldo == "number" ? "$" + convertirMiles(saldo) 
    : saldo;

    let mostrador = [
        ["Actualmente Debe", deuda, "search-dollar"],
        ["Deuda sumada", "", "dollar-sign"]
    ];
    
    let totalizadores = $(query).find(".totalizador");
    let totalInt = 0
    totalizadores.each(function(i, e) {
        totalInt += parseInt($(e).text())
    })
    // mostrador[0][1] = "$"+convertirMiles(totalInt);
    mostrador[1][1] = "$"+convertirMiles(totalInt);
    showStatistics("#"+$(query).attr("id"),
    mostrador, true);
    
    $(query).find(".takeThis").on("change", function(){
        let parent = $(this).parents().filter(function() {
            return $(this).hasClass("card-body");
        }).get()
        let totalizadores = $(parent).find(".totalizador");
        let checks = $(parent).find(".takeThis");
        let checked =  $(parent).find(".takeThis:checked");
        // console.log(checks);
        let sumaChecks = 0, totalInt = 0;
        checks.each(function(i, check) {
            totalInt += parseInt($(totalizadores[i]).text())
            if($(check).prop("checked")) sumaChecks += parseInt($(totalizadores[i]).text())
        })

        console.log(checked)
        let resto = isNaN(saldo) ? totalInt - sumaChecks : saldo + sumaChecks
        let detalle_saldado = {
            saldo: saldo + sumaChecks,
            saldo_anterior: saldo,
            actv_credit: true,
            fecha: genFecha(),
            diferencia: sumaChecks,
            
            //si alguno de estos datos es undefined podría generar error al subirlos
            momento: new Date().getTime(),
            user_id: query.replace("#deudas-", ""),
            guia: "",
            medio: "Administración " + localStorage.user_id
        };
        
        let btn_saldar = `<button 
        class="btn btn-primary ${isNaN(saldo) ? "disabled" : "saldar"}">
        $${convertirMiles(sumaChecks)}</button>`;
        
        mostrador[1][1] = "$"+convertirMiles(totalInt);
        mostrador[2] = ["Quedaría", "$"+convertirMiles(resto), "funnel-dollar"];
        mostrador[3] = ["Saldar", btn_saldar, "hand-holding-usd"];
        if(!sumaChecks) {
            mostrador = mostrador.slice(0, 3)
        }
        showStatistics("#"+$(parent).attr("id"),
        mostrador, true);
        
        $(parent).find(".saldar").click(async () => {
            console.log(detalle_saldado);
            // let deuda = await saldar(checked)
            let deuda = false;
            if(!deuda) {
                return avisar("¡Error!","Todas la guía seleccionadas tuvieron problemas para ser actualizadas, por favor intente nuevamente", "advertencia")
            }
            detalle_saldado.saldo = saldo + deuda[0];
            detalle_saldado.diferencia = deuda[0]
            detalle_saldado.mensaje = "Administración ha saldado $" + convertirMiles(deuda[0]) + " en " + deuda[1] + " Guías",

            console.log(detalle_saldado);
            // actualizarSaldo(detalle_saldado);
            avisar("Información","Se Saldó $" + convertirMiles(deuda[0]) + " en " + deuda[1] + " Guías. Por favor verifique el saldo del usuario.", "aviso")
        })
    })
}

async function saldar(checked) {
    let deudaGuias = 0;
    let selected_checks = 0
    
    for await( let check of checked) {
        console.log(check.getAttribute("data-id_heka"));
        let id_heka = check.getAttribute("data-id_heka");
        let id_user = check.getAttribute("data-id_user");
        let deuda = check.getAttribute("data-deuda");
        try {
            let reference = firebase.firestore()
            .collection("usuarios")
            .doc(id_user);
           
            let data = await reference.collection("guias")
            .doc(id_heka).get().then(doc => doc.data())
                       
            if(data) {
                await reference.collection("guiasSaldadas")
                .doc(id_heka).set(data);
               
                await reference.collection("guias").doc(id_heka)
                .update({user_debe: 0});


                deudaGuias += parseInt(deuda);
                selected_checks ++
            }
        } catch (err){
            console.log(err);
        }
    }
    return [deudaGuias, selected_checks];
}

$("#filter-user-deudas").on("input", function() {
    let valores = $(this).val().replace(/\s/g, "").toLowerCase().split(",")
    let filters = new Array();
    $("[data-filter]").each(function() {
        filters.push($(this).attr("data-filter"))
    });
    for(let filter of filters) {
        $("[data-filter='"+filter+"']").hide();
        for(let inp of valores) {
            if(filter.toLowerCase().indexOf(inp) != -1) {
                $("[data-filter='"+filter+"']").show();
            }
        }
    }
})

if(administracion) revisarDeudas();

$('[href="#novedades"]').click(() => {
    mostrar("novedades");
    document.querySelectorAll(".icon-notificacion-novedad").forEach(i => {
        i.classList.add("d-none");
    });
});