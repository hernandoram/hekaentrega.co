if(administracion){
    if(localStorage.getItem("acceso_admin")){
        if($("#documentos")){
            cargarDocumentos();
            $("#buscador-documentos").on("click", () => {
                cargarDocumentos(true);
            })
        
            $('[href="#documentos"]').on("click", () => {
                cargarDocumentos();
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

function crearDocumentos() {
    let checks = document.getElementById("tabla-guias").querySelectorAll("input");
    let guias = [], id_user = localStorage.user_id, arrGuias = new Array();
    for(let check of checks){
        if(check.checked && !check.disabled){
            guias.push(check.getAttribute("data-id"));
            arrGuias.push({
                numeroGuia: check.getAttribute("data-numeroGuia"),
                id_heka:  check.getAttribute("data-id"),
                id_archivoCargar: check.getAttribute("data-archivoCargar"),
                prueba:  check.getAttribute("data-prueba") == "true" ? true : false
            })
            check.checked = false;
            check.disabled = true;
        }
    }
    
    // Add a new document with a generated id.
    if(guias.length == 0){
        avisar("No se Pudo enviar su documento", "Asegurece de haber seleccionado al menos una guía", "aviso");
    } else {
        document.getElementById("enviar-documentos").setAttribute("disabled", "true");
        let documentReference = firebase.firestore().collection("documentos");
        documentReference.add({
            id_user: id_user,
            nombre_usuario: datos_usuario.nombre_completo,
            fecha: genFecha(),
            descargar_relacion_envio: false, descargar_guias: false
        })
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
            arrGuias.sort((a,b) => {
                return a.numeroGuia > b.numeroGuia ? 1 : -1
            })
            generarDocumentos(arrGuias, {
                id_user, 
                prueba: estado_prueba,
                id_doc: docRef.id
            })
            



        }).then(() => {
            // firebase.firestore().collection("notificaciones").add({
            //     mensaje: `${datos_usuario.nombre_completo} ha creado un Documento con las Guías: ${guias}`,
            //     fecha: genFecha(),
            //     guias: guias,
            //     usuario: datos_usuario.nombre_completo,
            //     timeline: new Date().getTime(),
            //     type: "documento",
            //     visible_admin: true
            // })
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
    }).then(res => res.json())
    .then(data => {
        console.log(data);
        let guias = data.map(d => d.id_heka)
        avisar("Documento creado Exitósamente", "Las guías " + guias + " Fueron procesadas exitosamente");
        document.getElementById("enviar-documentos").removeAttribute("disabled");
    })
    .catch(error => {
        avisar("Error", "Hubo un error al crear los documentos: " + error, "advertencia");
        document.getElementById("enviar-documentos").removeAttribute("disabled");
    })
}




/* Referencia de funciones utilizadas en este Script
 * MostrarDocumentos() ===> render.js
 */

let documento = [], guias = [];

//muestra los documento al admin y le otorga funcionalidad a los botones
function cargarDocumentos(filter) {
    let documentos = document.getElementById("mostrador-documentos");
    firebase.firestore().collection("documentos").get().then((querySnapshot) => {
        documentos.innerHTML = "";
        querySnapshot.forEach((doc) => {
            let fecha_doc = new Date(doc.data().fecha).getTime(),
                fecha_inicio = new Date(value("docs-fecha-inicio")).getTime(),
                fecha_final = new Date(value("docs-fecha-final")).getTime();
            if(filter && fecha_doc >= fecha_inicio && fecha_doc <= fecha_final) {
                //Si la propiedad ingresada filter es tru, me lo filtra por fecha, sucede cuando se presiona el boton buscar
                if(doc.data().descargar_relacion_envio && doc.data().descargar_guias){
                    //si tiene la informacion completa cambia el modo es que se ve la tarjeta y habilita mas funciones
                    documentos.innerHTML += mostrarDocumentos(doc.id, doc.data(), "warning");
                    let descargador_completo = document.getElementById("descargar-docs"+doc.id);
                    descargador_completo.classList.remove("fa", "fa-file");
                    descargador_completo.classList.add("fas", "fa-file-alt");
                    descargador_completo.style.cursor = "alias";
                    
                } else {
                    documentos.innerHTML += mostrarDocumentos(doc.id, doc.data());
                }
            } else if (!filter){
                if(!doc.data().descargar_relacion_envio || !doc.data().descargar_guias){
                    documentos.innerHTML += mostrarDocumentos(doc.id, doc.data()); 
                }
            }
        })
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
                let prop = element.style
                if(prop.whiteSpace == "nowrap") {
                    prop.whiteSpace = "normal";
                    prop.cursor = "zoom-out";
                } else {
                    prop.whiteSpace = "nowrap";
                    prop.cursor = "zoom-in";
                }
            })
        };
    }).then(() => {
        subirDocumentos()
        if(documentos.innerHTML == ""){
            documentos.innerHTML = `<div class="col-2"></div>
            <p class="col card m-3 p-3 border-danger text-danger text-center">
            No Hay documentos para tu búsqueda</p><div class="col-2"></div>`;
        }
    });

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
        row += '"' + arrData[i].id_servientrega + '",';
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
            
            if(mostrador_guias.textContent && mostrador_relacion.textContent){
                document.getElementById("subir" + id_doc).classList.remove("d-none")
            } else {
                document.getElementById("subir" + id_doc).classList.add("d-none")
            }

        })
    }

    for (let enviar of botones_envio) {
        enviar.addEventListener("click", (e) => {
            //Toma los archivos cargados y los envia a storage
            e.target.disabled = true;
            let parent = e.target.parentNode
            let id_doc = parent.getAttribute("data-id_guia");
            let relacion_envio = document.getElementById("cargar-relacion-envio" + id_doc);
            let guias = document.getElementById("cargar-guias" + id_doc);
            let id_user = parent.getAttribute("data-user");
            let numero_guias = parent.getAttribute("data-guias");
            let nombre_usuario = parent.getAttribute("data-nombre");
            let nombre_documento = numero_guias[0] + (numero_guias.length > 1) ?
                "_"+numero_guias[numero_guias.length - 1] : ""
            let nombre_guias = "Guias" + nombre_documento;
            let nombre_relacion = "Relacion" + nombre_documento;
            
            console.log(relacion_envio.files[0]);
            console.log(guias.files[0]);
            console.log(numero_guias);
            
            var storageUser = firebase.storage().ref().child(id_user + "/" + id_doc);
            //Sube los documentos a Storage y coloca el indice de busqueda en firestore().documentos
            storageUser.child(nombre_relacion + ".pdf").put(relacion_envio.files[0]).then((querySnapshot) => {
                firebase.firestore().collection("documentos").doc(id_doc).update({
                    descargar_relacion_envio: true, nombre_relacion
                }).then(() => {
                    storageUser.child(nombre_guias + ".pdf").put(guias.files[0]).then((querySnapshot) => {
                        firebase.firestore().collection("documentos").doc(id_doc).update({
                            descargar_guias: true, nombre_guias
                        })
                    }).then(()=> {
                        e.target.disabled = false;
                        avisar("Documentos cargados con éxito", nombre_usuario + " ya puede descargar sus documentos");
                        firebase.firestore().collection("notificaciones").add({
                            mensaje: `Sus documentos con las guias: ${numero_guias} ya están listos para descargar.`,
                            fecha: genFecha(),
                            guias: numero_guias.split(","),
                            user_id: id_user,
                            visible_user: true,
                            timeline: new Date().getTime(),
                            type: "documento"
                        })
                    })
                })
            });


        })
    }

}


//Similar a historial de Guias, carga los documentos al usuario por fecha.
function actualizarHistorialDeDocumentos(){
    console.log(document.getElementById("tabla_documentos"))
    // $('#tabla_documentos').DataTable().destroy();
    if(user_id){     
      var reference = firebase.firestore().collection("documentos").where("id_user", "==", localStorage.user_id)
      reference.get().then((querySnapshot) => {
        var tabla=[];
        console.log(localStorage.user_id)
        if(document.getElementById('body-documentos')){
          inHTML("body-documentos", "");
        }  
        querySnapshot.forEach((doc) => {
            if(document.getElementById('fecha_inicio_doc')){
              var fecha_inicio=document.getElementById('fecha_inicio_doc').value;
            }
            if(document.getElementById('fecha_final_doc')){
              var fecha_final=document.getElementById('fecha_final_doc').value;
            }
            var fechaFire = new Date(doc.data().fecha).getTime();
            fecha_inicio = new Date(fecha_inicio).getTime();
            fecha_final = new Date(fecha_final).getTime();
            if(fechaFire >= fecha_inicio && fechaFire <= fecha_final){ 
              tabla.push(tablaDeDocumentos(doc.id, doc.data()));
              //funcionalidad de botones para descargar guias y relaciones
              firebase.firestore().collection("documentos").doc(doc.id).onSnapshot((row) => {
                let nombre_guias = row.data().nombre_guias ? row.data().nombre_guias : "guias" + row.data().guias.toString();
                let nombre_relacion = row.data().nombre_relacion ? row.data().nombre_relacion : "relacion envio" + row.data().guias.toString();
                if(row.data().descargar_relacion_envio){
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
                if(row.data().descargar_guias){
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
            } 
  
            
        });
  
        
  
        var contarExistencia=0;
        for(let i=tabla.length-1;i>=0;i--){
          
          if(document.getElementById('body-documentos')){
            printHTML('body-documentos',tabla[i]);
          }
          contarExistencia++;
        }
  
        if(contarExistencia==0){
          if(document.getElementById('tabla-historial-docs')){
            document.getElementById('tabla-historial-docs').style.display='none';
          }
          if(document.getElementById('nohaydatosHistorialdocumentos')){
            document.getElementById('nohaydatosHistorialdocumentos').style.display='block';
            location.href='#nohaydatosHistorialdocumentos';
          }
        }else{
          if(document.getElementById('tabla-historial-docs')){
            document.getElementById('tabla-historial-docs').style.display='block';
          }
          if(document.getElementById('nohaydatosHistorialdocumentos')){
            document.getElementById('nohaydatosHistorialdocumentos').style.display='none';
          }
          // $(document).ready( function () {
          //   $('#tabla_documentos').DataTable();
          // });
        }
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
                    firebase.firestore().collection("Estado de Guias").doc(x.id_guia).set(x)
                    .then(() => {
                        
                    })
                    .catch(() => {
                        avisar("Error!", "Hubo un error inesperado");
                    });
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
    firebase.firestore().collection("notificaciones").where("type", "==", "documento").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            firebase.firestore().collection("notificaciones").doc(doc.id).delete()    
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

$('[href="#novedades"]').click(() => {
    mostrar("novedades");
    document.querySelectorAll(".icon-notificacion-novedad").forEach(i => {
        i.classList.add("d-none");
    });
})
