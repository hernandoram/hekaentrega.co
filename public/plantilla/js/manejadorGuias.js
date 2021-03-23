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

function crearDocumentos() {
    let checks = document.getElementById("tabla-guias").querySelectorAll("input");
    let guias = [], id_user = localStorage.user_id
    for(let check of checks){
        if(check.checked){
            guias.push(check.getAttribute("data-id"));
            check.checked = false;
        }
    }
    
    // Add a new document with a generated id.
    if(guias.length == 0){
        avisar("No se Pudo enviar su documento", "Asegurece de haber seleccionado al menos una guía", "aviso");
    } else {
        document.getElementById("enviar-documentos").setAttribute("disabled", "true");
        firebase.firestore().collection("documentos").add({
            guias: guias,
            id_user: id_user,
            nombre_usuario: datos_usuario.nombre_completo,
            fecha: genFecha(),
            descargar_relacion_envio: false, descargar_guias: false
        })
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
            for(let guia of guias){
                firebase.firestore().collection("usuarios").doc(id_user).collection("guias").doc(guia).update({
                    enviado: true,
                    estado: "Enviado"
                });
            }
        }).then(() => {
            avisar("Documento creado Exitósamente", "Las guías " + guias + " han sido enviadas.", "platafora2.html#historial_documentos");
            document.getElementById("enviar-documentos").removeAttribute("disabled");
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
    }
}

/* Referencia de funciones utilizadas en este Script
 * MostrarDocumentos() ===> render.js
 */

let documento = [], guias = [];

//muestra los documento y le otorga funcionalidad a los botones
function cargarDocumentos(filter) {
    let documentos = document.getElementById("mostrador-documentos");
    documentos.innerHTML = "";
    firebase.firestore().collection("documentos").get().then((querySnapshot) => {
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
        //para el boton Que carga documentos
        for(let boton of botones){
            boton.addEventListener("click", (e) => {
                let idUser = e.target.parentNode.getAttribute("data-user");
                let guias = e.target.parentNode.getAttribute("data-guias").split(",");
                let nombre = e.target.parentNode.getAttribute("data-nombre");
                documento = [];
                cargarDocumento(idUser, guias).then(() =>{
                    $(document).ready(function(){
                        let data = documento;
                        if(data == '')
                            return;
                        JsonToCsv(data, nombre + " " + guias.join("_"), guias);
                    });
                })
            })
        }


        // Cuando esta habilitado, permite descarga el documento que ha sido enviado
        for(let descargar of descargador_completo){
            descargar.addEventListener("click", (e) => {
                let info = {
                    user_id: e.target.getAttribute("data-user"),
                    id: e.target.getAttribute("data-id_guia"),
                    guias: e.target.getAttribute("data-guias")
                }

                descargarDocumentos(info);
            })
        }
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
function JsonToCsv(JSONData, ReportTitle, guias) {
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
            
            console.log(relacion_envio.files[0]);
            console.log(guias.files[0]);
            
            var storageUser = firebase.storage().ref().child(id_user + "/" + id_doc);
            //Sube los documentos a Storage y coloca el indice de busqueda en firestore().documentos
            storageUser.child("relacion envio" + numero_guias + ".pdf").put(relacion_envio.files[0]).then((querySnapshot) => {
                firebase.firestore().collection("documentos").doc(id_doc).update({
                    descargar_relacion_envio: true
                }).then(() => {
                    storageUser.child("guias" + numero_guias + ".pdf").put(guias.files[0]).then((querySnapshot) => {
                        firebase.firestore().collection("documentos").doc(id_doc).update({
                            descargar_guias: true
                        })
                    }).then(()=> {
                        e.target.disabled = false;
                        avisar("Documentos cargados con éxito", nombre_usuario + " ya puede descargar sus documentos");
                    })
                })
            });


        })
    }

}


//Similar a historial de Guias
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
                if(row.data().descargar_relacion_envio){
                  document.getElementById("boton-descargar-guias" + doc.id).removeAttribute("disabled");
                  document.getElementById("boton-descargar-guias" + doc.id).addEventListener("click", (e) => {
                    console.log(e.target.parentNode)
                    firebase.storage().ref().child(user_id + "/" + doc.id + "/guias" + doc.data().guias.toString() + ".pdf")
                    .getDownloadURL().then((url) => {
                      console.log(url)
                      window.open(url, "_blank");
                    })
                  })
                }
                if(row.data().descargar_guias){
                  document.getElementById("boton-descargar-relacion_envio" + doc.id).removeAttribute("disabled");
                  document.getElementById("boton-descargar-relacion_envio" + doc.id).addEventListener("click", (e) => {
                    console.log(e.target.parentNode)
                    firebase.storage().ref().child(user_id + "/" + doc.id + "/relacion envio" + doc.data().guias.toString() + ".pdf")
                    .getDownloadURL().then((url) => {
                      console.log(url)
                      window.open(url, "_blank");
                    })
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

function descargarDocumentos(doc){
    firebase.storage().ref().child(doc.user_id + "/" + doc.id + "/guias" + doc.guias + ".pdf")
    .getDownloadURL().then((url) => {
        window.open(url, "_blank");
    });

    firebase.storage().ref().child(doc.user_id + "/" + doc.id + "/relacion envio" + doc.guias + ".pdf")
    .getDownloadURL().then((url) => {
        console.log(url)
        window.open(url, "_blank");
    })
}
  
console.log(localStorage.user_id)
