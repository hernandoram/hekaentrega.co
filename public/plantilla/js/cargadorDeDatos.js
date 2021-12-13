let user_id = localStorage.user_id, usuarioDoc;

if(localStorage.getItem("acceso_admin")){
  window.onload = () => revisarNotificaciones();
} else if(localStorage.user_id){
  window.onload = () => {
    cargarDatosUsuario().then(() => {
      revisarNotificaciones();
    });
    usuarioDoc = firebase.firestore().collection("usuarios").doc(user_id);
    $("[href='#perfil']").one("click", () => consultarInformacionBancariaUsuario());
  }
} else {
  alert("La sesión ha expirado, por favor inicia sesión nuevamente");
  location.href = "iniciarSesion2.html"
}

window.addEventListener("storage", (e) => {
  const {key, newValue} = e;

  if(!key || (key === "user_id" && newValue && newValue !== user_id)) {
    location.reload();
  }
});


//Administradara datos basicos del usuario que ingresa
let datos_usuario = {},
//Almacena los costos de envios (nacional, urbano...) y el porcentaje de comision
datos_personalizados = {
  costo_zonal1: 8250,
  costo_zonal2: 12650,
  costo_zonal3: 2800,
  costo_nacional1: 10950,
  costo_nacional2: 19450,
  costo_nacional3: 3400,
  costo_especial1: 24450,
  costo_especial2: 37200,
  costo_especial3: 6300,
  comision_servi: 3.1,
  comision_heka: 1,
  constante_convencional: 600,
  constante_pagoContraentrega: 1500,
  saldo: 0
};

let estado_prueba;


//funcion principal del Script que carga todos los datos del usuario
async function cargarDatosUsuario(){
  let proceso = 0;
  const contentCharger = $("#cargador-content");
  const content = $("#content");
  const percentage = () => {
    proceso += Math.min(Math.round(Math.random() * 40), 95);
    return proceso + "%";
  };
  
  const showPercentage = $("#porcentaje-cargador-inicial");
  const dataUserInLocal = JSON.parse(localStorage.getItem("datos_usuario"));
  const otherdataUser = JSON.parse(localStorage.getItem("datos_personalizados"));

  console.log(dataUserInLocal);
  
  if(otherdataUser) Object.assign(datos_personalizados, otherdataUser);

  //Carga la informacion personal en un objeto y se llena el html de los datos del usuario
  if(!dataUserInLocal) {
    console.log("ingresó");
    const newData = await consultarInformacionPersonalUsuario();
    console.log("New data", newData);
    Object.assign(datos_usuario, newData);
  } else {
    consultarInformacionPersonalUsuario();
  }
  showPercentage.text(percentage());
  
  //SE cargan datos como el centro de costo
  if(!dataUserInLocal) await consultarDatosBasicosUsuario();
  showPercentage.text(percentage());

  console.log(datos_usuario);
  if(!dataUserInLocal) {
    localStorage.setItem("datos_usuario", JSON.stringify(datos_usuario));
  } else {
    datos_usuario = dataUserInLocal;
  }
  
  //Modifica los costos de envio si el usuario tiene costos personalizados
  await consultarInformacioHeka();
  showPercentage.text(percentage());

  contentCharger.hide();
  content.show("fast");
  
}

async function consultarDatosBasicosUsuario() {
  await firebase.firestore().collection("usuarios").doc(user_id).get()
  .then((doc) => {
    if(doc.exists){
      datos_usuario.centro_de_costo = doc.data().centro_de_costo;
      datos_usuario.objetos_envio = doc.data().objetos_envio;
      estado_prueba = doc.data().centro_de_costo == "SellerNuevo" ? true : false;
    }
  })

}

async function consultarInformacionPersonalUsuario() {
  const informacion = firebase.firestore().collection('usuarios').doc(user_id).collection("informacion");

  const data = await informacion.doc("personal").get().then((doc) => {
    if(doc.exists){
      let datos = doc.data();
      const dataUser = {
        nombre_completo: datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0],
        direccion: datos.direccion + " " + datos.barrio,
        celular: datos.celular,
        correo: datos.correo,
        numero_documento: datos.numero_documento
      }

      // A partir de aqui, verificara que los elementos existan para mostrar datos
      if(document.getElementById('usuario')){
      document.getElementById('usuario').innerText = datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0];                
      }       
      if(document.getElementById('CPNnombres')){
        document.getElementById('CPNnombres').value=datos.nombres;
        document.getElementById('usuario').innerText = datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0];
      }
      if(document.getElementById('CPNapellidos')){
        document.getElementById('CPNapellidos').value=datos.apellidos;
      }
      if(document.getElementById('CPNtipo_documento')){
        document.getElementById('CPNtipo_documento').value=datos.tipo_documento;
      }
      if(document.getElementById('CPNnumero_documento')){
        document.getElementById('CPNnumero_documento').value=datos.numero_documento;
      }
      if(document.getElementById('CPNtelefono')){
        document.getElementById('CPNtelefono').value=datos.celular;
      }
      if(document.getElementById('CPNcelular')){
        document.getElementById('CPNcelular').value=datos.celular2;
      }
      if(document.getElementById('CPNciudad')){
        document.getElementById('CPNciudad').value=datos.ciudad;
      }
      if(document.getElementById('CPNdireccion')){
        document.getElementById('CPNdireccion').value=datos.direccion;
      }
      if(document.getElementById('CPNbarrio')){
        document.getElementById('CPNbarrio').value=datos.barrio;
      }
      if(document.getElementById('CPNnombre_empresa')){
        document.getElementById('CPNnombre_empresa').value=datos.nombre;
      }
      if(document.getElementById('CPNcorreo')){
        document.getElementById('CPNcorreo').value=datos.correo;
      }

      if(document.getElementById('CPNobjetos_envio')){
        document.getElementById('CPNobjetos_envio').value=datos.objetos_envio.join(", ");
      }

      ///desactivar texto "cargando datos"
      if(document.getElementById('texto-cargar-datos')){
        document.getElementById('texto-cargar-datos').innerHTML=``;
      }
      ////activar panel de datos de usuario
      if(document.getElementById('contenedor-datos-actualizar')){
        document.getElementById('contenedor-datos-actualizar').style.display='block';
      }

      return dataUser;
    }
      
  });
  
  if(location.hash === "#perfil") consultarInformacionBancariaUsuario();

  return data;
}

async function consultarInformacioHeka() {
  const informacion = firebase.firestore().collection('usuarios').doc(user_id).collection("informacion");
  const updateData = (doc) => {
    if(doc.exists) {
      for(let precio in doc.data()){
        const value = doc.data()[precio];
        if(value === "") continue;
        if(!/[^\d+.]/.test(value.toString())) {
          datos_personalizados[precio] = parseFloat(value);
        } else {
          datos_personalizados[precio] = value;
        }
      }
  
      console.log(datos_personalizados);
      const importants = ["id_agente_aveo", "codigo_sucursal_inter"];
      const importantData = new Object();
      importants.forEach(val => importantData[val] = datos_personalizados[val]);
      localStorage.setItem("datos_personalizados", JSON.stringify(importantData));
  
      $("#saldo").html("$" + convertirMiles(datos_personalizados.saldo));
    }
  };

  informacion.doc("heka").onSnapshot(updateData)

  //Si la traida de datos en tiempo real me falla,
  //voy a descomentar, para traerlo también a la primera carga
  // await informacion.doc("heka").get(updateData);
}

/* Función que me carga los datos bancarios del usuario en el perfil.
la idea es que se cargue automáticamente cuando esté viendo en su perfil,
o cuando se presione una sola vez el botón que lleva al perfil del usuario */
function consultarInformacionBancariaUsuario() {
  const datosBanc = $("#mostrar-ocultar-registro-bancario");
  datosBanc.before('<div class="text-center" id="cargador-datos-bancarios"><h2>Cargando Datos bancarios </h2><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>')

  const informacion = firebase.firestore().collection('usuarios').doc(user_id).collection("informacion");

  informacion.doc("bancaria").get().then((doc) => {
    if(doc.exists) {
      let datos = doc.data();
      ////datos bancarios
      if(document.getElementById('CPNbanco') && datos.banco!=""){
        document.getElementById('CPNbanco').value = datos.banco;
      }
      if(document.getElementById('CPNnombre_representante') && datos.nombre_banco!=""){
        document.getElementById('CPNnombre_representante').value=datos.nombre_banco;
      }
      if(document.getElementById('CPNtipo_de_cuenta') && datos.tipo_de_cuenta!=""){
        document.getElementById('CPNtipo_de_cuenta').value=datos.tipo_de_cuenta;
      }
      if(document.getElementById('CPNnumero_cuenta') && datos.numero_cuenta!=""){
        document.getElementById('CPNnumero_cuenta').value=datos.numero_cuenta;
      }
      if(document.getElementById('CPNconfirmar_numero_cuenta') && datos.numero_cuenta!=""){
        document.getElementById('CPNconfirmar_numero_cuenta').value=datos.numero_cuenta;
      }
      if(document.getElementById('CPNtipo_documento_banco') && datos.tipo_documento_banco!=""){
        document.getElementById('CPNtipo_documento_banco').value=datos.tipo_documento_banco;
      }
      if(document.getElementById('CPNnumero_identificacion_banco') && datos.numero_iden_banco!=""){
        document.getElementById('CPNnumero_identificacion_banco').value=datos.numero_iden_banco;
      }
      if(document.getElementById('CPNconfirmar_numero_identificacion_banco') && datos.numero_iden_banco!=""){
        document.getElementById('CPNconfirmar_numero_identificacion_banco').value=datos.numero_iden_banco;
      }
    }
  });

  $("#cargador-datos-bancarios").remove();

}


//invocada por el boton para buscar guias
function cambiarFecha(){  
  if($("#contenedor-tabla-historial-guias").css("display") === "none") {
    historialGuias();
  }
}

function limitarSeleccionGuias(limit = 50) {
  $("#tabla-guias").find(".check-guias").change(e => {
    const checked = $(".check-guias:checked")
    if(checked.length > limit) {
          $(e.target).prop("checked", false);
          Toast.fire({
              icon: "error",
              text: "Puede seleccionar como máximo " + limit + " guías por documento"
          });
      }
  });
}

//Habilitado por una función en Manejador guias, me envia un excel al /excel_to_json en index.js y me devuelve un Json
function cargarPagos(){
  document.querySelector("#cargador-pagos").classList.remove("d-none");
  let data = new FormData(document.getElementById("form-pagos"));
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
      // Me realiza un filtro desde los inputs de admin.html en la pestaña de pagos
      let transportadoras = [], numero_flotante = 0;
      let filtro_transportadoras = document.getElementsByName("filtro-trasnportadoras");
      for(let transp of filtro_transportadoras){
        if(transp.checked){
          transportadoras.push(transp.value.toLowerCase());
        }
      }
      let filtroInputs = datos.filter(async (data) => {
        let fechaI, fechaF, guia, permitir_transportadora;
        if(!Number.isInteger(data["ENVÍO TOTAL"]) || !Number.isInteger(data.RECAUDO) || !Number.isInteger(data["TOTAL A PAGAR"])){
          numero_flotante += 1;
        }
        if(data.TRANSPORTADORA && transportadoras.indexOf(data.TRANSPORTADORA.toLowerCase()) != -1 && transportadoras.length != 0) {
          permitir_transportadora = true;
        } else if (transportadoras.length == 0){
          permitir_transportadora = true;
        }
      
        if($("#filtro-pago-guia").val()){
          guia = $("#filtro-pago-guia").val();
          return permitir_transportadora && data.GUIA == guia;
        } else {
          fechaI = new Date($("#filtro-fechaI").val()).getTime();
          fechaF = new Date($("#filtro-fechaF").val()).getTime();
          fechaObtenida = fechaI;
          if(data.FECHA != undefined) {
            fechaObtenida = new Date(data.FECHA.split("-").reverse().join("-")).getTime();
          }
          remitente = $("#filtro-pago-usuario").val();
          if($("#fecha-pagos").css("display") != "none" && $("#filtro-pago-usuario").val()){
            return permitir_transportadora && fechaI <= fechaObtenida && fechaF >= fechaObtenida && data.REMITENTE.indexOf(remitente) != -1;
          } else if($("#fecha-pagos").css("display") != "none"){
            return permitir_transportadora && fechaI <= fechaObtenida && fechaF >= fechaObtenida
          } else if ($("#filtro-pago-usuario").val()) {
            return permitir_transportadora && data.REMITENTE.indexOf(remitente) != -1;
          } else {
            return permitir_transportadora;
          }
        }
      })

      if(numero_flotante) {
        alert("He registrado "+ numero_flotante +" fila(s) con números decimales y los he transformado en enteros, revíselo con cuidado");
      }
      // se insertan los datos filtrados
      mostrarPagos(filtroInputs);
    }).then(() => {
      let fecha = document.querySelectorAll("td[data-funcion='cambiar_fecha']");
      let todas_fechas = document.querySelectorAll("th[data-id]");
      let botones_pago = document.querySelectorAll("button[data-funcion='pagar']");
      let row_guias = document.querySelectorAll("tr[id]");
      let usuarios = document.querySelectorAll("div[data-usuario]");
      comprobarBoton(fecha);

      //me habilita un evento escucha para cambiar la fecha clickeada
        for(let f of fecha) {
            f.addEventListener("click", (e) => {
              alternarFecha(e.target)
              comprobarBoton(e.target.parentNode.parentNode.querySelectorAll("td[data-funcion='cambiar_fecha']"));
            })
        }

        //me habilita un evento para cambiar todas las fechas del seller a la actual
        todas_fechas.forEach((conjunto) => {
          conjunto.addEventListener("click", (e) => {
            let idenficador = e.target.getAttribute("data-id");
            let body = document.getElementById(idenficador);
            let fechas = body.querySelectorAll("td[data-funcion='cambiar_fecha']");
            fechas.forEach((fecha) => {
              alternarFecha(fecha);
            });
            comprobarBoton(fechas);
          })
        })

        //Habilita un evento excucha para cado botón de pagar, que manda toda la info a firebase.collection("pagos")
        botones_pago.forEach((btn) => {
          btn.addEventListener("click", e => {
            let guia = e.target.parentNode.querySelectorAll("tr[id]");
            guia.forEach(g => {
              let celda = g.querySelectorAll("td");
              let identificador = g.getAttribute("id");
              firebase.firestore().collection("pagos").doc(celda[1].textContent.toLowerCase())
              .collection("pagos").doc(identificador).set({
                REMITENTE: celda[0].textContent,
                TRANSPORTADORA: celda[1].textContent,
                GUIA: celda[1].textContent,
                GUIA: celda[2].textContent,
                RECAUDO: celda[3].textContent,
                "ENVÍO TOTAL": celda[4].textContent,
                "TOTAL A PAGAR": celda[5].textContent,
                FECHA: celda[6].textContent
              }).then(() => {
                firebase.firestore().collectionGroup("guias").where("numeroGuia", "==", identificador)
                .get().then((querySnapshot) => {
                  querySnapshot.forEach(doc => {
                    doc.ref.update({debe: 0})
                  })
                }).then(() => g.classList.add("text-success"))
                
              })
            })
          })
        })

        // me revisa todas las guías mostradas, para verificar que no están registrada en firebase
        row_guias.forEach(async (guia) => {
          let identificador = guia.getAttribute("id");
          let transportadora = guia.querySelectorAll("td")[1].textContent;
          let remitente = guia.getAttribute("data-remitente");
          let mostrador_total_local = document.getElementById("total"+remitente);
          let btn_local = document.getElementById("pagar" + remitente);
          let total_local = mostrador_total_local.getAttribute("data-total");
          console.log("Antes del algoritmo: ",total_local);
          let mostrador_total = document.getElementById("total_pagos");
          let total = mostrador_total.getAttribute("data-total");
        
          let datos_guia = await firebase.firestore().collectionGroup("guias")
          .where("numeroGuia", "==", identificador)
          .get().then(querySnapshot => {
            let datos;
            let row_guia_actual = guia.children[7]
            row_guia_actual.textContent = " La guía no se encuentra en la base de datos"
            querySnapshot.forEach(doc => {
              datos = doc.data();
            })
            return datos;
          })

          let usuario_corporativo = await firebase.firestore().collection("usuarios").where("centro_de_costo", "==", remitente)
          .get().then(querySnapshot => {
            let usuario_corporativo = false
            querySnapshot.forEach(doc => {
              if(doc.data().usuario_corporativo) usuario_corporativo = true 
            })
          })

          firebase.firestore().collection("pagos").doc(transportadora.toLocaleLowerCase())
          .collection("pagos").doc(identificador.toString()).get()
          .then((doc)=> {
            let existe;

            if(doc.exists){
              guia.setAttribute("data-ERROR", "La Guía "+identificador+" ya se encuentra registrada en la base de datos, verifique que ya ha sido pagada.")
              guia.classList.add("text-success");

              mostrador_total_local = document.getElementById("total"+remitente);
              btn_local = document.getElementById("pagar" + remitente);
              total_local = mostrador_total_local.getAttribute("data-total");
              
              mostrador_total = document.getElementById("total_pagos");
              total = mostrador_total.getAttribute("data-total");
              
              console.log(total_local);
              total -= parseInt(guia.children[5].textContent);
              total_local -= parseInt(guia.children[5].textContent);
              mostrador_total_local.setAttribute("data-total", total_local);
              mostrador_total_local.classList.add("text-success");
              btn_local.textContent = "Por Pagar $" + convertirMiles(total_local);
              mostrador_total_local.textContent = "$"+convertirMiles(total_local);
              mostrador_total.setAttribute("data-total", total);
              mostrador_total.textContent = "Total $"+convertirMiles(total);
              comprobarBoton(fecha);
              existe = true;
            }
      
            if(datos_guia) {
              let row_guia_actual = guia.children[7];
              row_guia_actual.textContent = datos_guia.type || "PAGO CONTRAENTREGA";
              if(datos_guia.centro_de_costo != remitente) {
                row_guia_actual.textContent += " El centro de costo de la guía subida no coincide con el registrado en la base de datos.\n";
              }
              
              if(!datos_guia.debe || usuario_corporativo) {
                row_guia_actual.textContent += " La guía fue descontada.";
                if(!existe) sumarCostoEnvio(guia, remitente);
              } else {
                row_guia_actual.textContent += " Falta por descontar $" + convertirMiles(Math.abs(datos_guia.debe))
              }
            }


            
            totalizador(guia, remitente);

          })
          
        })
        
        usuarios.forEach(usuario => {
          let remitente = usuario.getAttribute("data-usuario");
          let tipo_usuario = document.createElement("p");
          let bank_info = document.createElement("div");

          tipo_usuario.textContent = "Usuario no Encontrado en la base de Datos, (manéjelo con precaución)";
          tipo_usuario.classList.add("text-center")
          firebase.firestore().collection("usuarios").where("centro_de_costo", "==", remitente)
          .get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
              if(doc.data().usuario_corporativo){  
                tipo_usuario.textContent = "Usuario Corporativo";
              } else {
                tipo_usuario.textContent = "Usuario no Corporativo";
              }

              doc.ref.collection("informacion").doc("bancaria")
              .get().then(docBank => {
                if(docBank.exists) {
                  docBank = docBank.data()
                  bank_info.innerHTML = `<div class="dropdown">
                    <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdown-${doc.data().centro_de_costo}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      Información Bancaria
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdown-${doc.data().centro_de_costo}">
                      <h6 class="dropdown-item">${docBank.banco}</h6>
                      <h6 class="dropdown-item">Representante: ${docBank.nombre_banco}</h6>
                      <h6 class="dropdown-item">${docBank.tipo_de_cuenta}: ${docBank.numero_cuenta}</h6>
                        <h6 class="dropdown-item">${docBank.tipo_documento_banco} - ${docBank.numero_iden_banco}</h6>
                  </div>`;
                  console.log(doc.data());
                }
              })
            })
          })
          usuario.insertBefore(bank_info, usuario.firstChild);
          usuario.parentNode.insertBefore(tipo_usuario, usuario);
        })

        

        //alterna las fechas entre la actual o la del documento ingresado
        function alternarFecha(contenido){
          let actual = genFecha("LR");
          if(contenido.textContent != actual){
              contenido.textContent = actual;
          } else {
              contenido.textContent = contenido.getAttribute("data-fecha");
          }
        }

        //Función importante que me habiita los pagos, dependiendo de la condicion de cada guia del usuario
        function comprobarBoton(elementos){
          let desactivar = false;
          let identificador = [];
          for(let e of elementos) {
            identificador.push(e.getAttribute("data-id"));
            document.getElementById(e.getAttribute("data-id")).querySelectorAll("p").forEach(e => e.remove());
          }
          elementos.forEach((elemento, i) => {
            let err = elemento.parentNode.getAttribute("data-error");
            if (err) {
              desactivar = true;
              let aviso = document.createElement("p");
              aviso.innerHTML = err;
              aviso.setAttribute("class", "text-danger border p-2");
              document.getElementById(identificador[i]).insertBefore(aviso, document.getElementById("pagar" + identificador[i]));
            } else if (elemento.textContent == "undefined" || elemento.textContent == "") {
              desactivar = true;
            }

            if(!desactivar){
              document.getElementById("pagar"+identificador[0]).removeAttribute("disabled");
            } else {
              document.getElementById("pagar"+identificador[0]).setAttribute("disabled", "");
            }
          });
          
        }

        function sumarCostoEnvio(guia, remitente){
          const mostrador_total_local = document.getElementById("total"+remitente);
          const btn_local = document.getElementById("pagar" + remitente);
          
          let total_local = mostrador_total_local.getAttribute("data-total");
          let mostrador_total = document.getElementById("total_pagos");
          let total = mostrador_total.getAttribute("data-total");
          let recaudo = parseInt(guia.children[4].textContent);

          guia.children[5].textContent = guia.children[3].textContent;
        }

        
        document.querySelector("#cargador-pagos").classList.add("d-none");
    })
  }).catch((err) => {
    avisar("Algo salió mal", err, "advertencia")
    document.querySelector("#cargador-pagos").classList.add("d-none");
  })
}

//me consulta los pagos ya realizados y los filtra si es necesario
$("#btn-revisar_pagos").click(async(e) => {
  console.log(e.target);
  document.querySelector("#cargador-pagos").classList.remove("d-none");
  let fechaI = 0, fechaF = new Date().getTime(), 
  buscador="REMITENTE", busqueda = "", guia, tipo = "!="
  
  if(!administracion){
    tipo = "=="
    busqueda = datos_usuario.centro_de_costo
  }

  if($("#fecha-pagos").css("display") != "none"){
    fechaI = new Date($("#filtro-fechaI").val()).getTime();
    fechaF = new Date($("#filtro-fechaF").val()).getTime();
  }
  
  if($("#filtro-pago-usuario").val()){
    busqueda = $("#filtro-pago-usuario").val();
    tipo = "=="
  }

  if($("#filtro-pago-guia").val()){
    guia = $("#filtro-pago-guia").val();
    buscador = "GUIA"
    busqueda = guia;
    tipo = "=="
  }

  let transportadoras = [];
  let filtro_transportadoras = document.getElementsByName("filtro-trasnportadoras");
  for(let transp of filtro_transportadoras){
    if(transp.checked){
      transportadoras.push(transp.value.toLowerCase());
    }
  }

  if (transportadoras.length == 0){
    transportadoras = ["servientrega", "envía", "tcc", "interrapidisimo"]; 
  }

  let response = []
  let consulta = 0
  for await(let busqueda_trans of transportadoras) {
    await firebase.firestore().collection("pagos").doc(busqueda_trans)
    .collection("pagos")
    .where(buscador, tipo, busqueda)
    .get()
    .then((querySnapshot) => {
      consulta += querySnapshot.size;
      querySnapshot.forEach((doc) => {
        let data = doc.data();
        let fecha_estandar = doc.data().FECHA.split("-").reverse().join("-")
        data.momento = new Date(fecha_estandar).getTime();
        if(fechaI && fechaF && !guia){
          let fechaFire = new Date(fecha_estandar).getTime();
          if(fechaI <= fechaFire && fechaFire <= fechaF){
            response.push(data);
          }
        } else {
          response.push(data)
        }
      });

      if(!administracion){
        response = response.filter((d) => d.REMITENTE == datos_usuario.centro_de_costo);
      }
    })
    console.log("total consulta", consulta)
    console.log(busqueda_trans);
  }
  if(administracion) {
    mostrarPagos(response);
    $("[data-funcion='pagar']").css("display", "none")
    document.querySelector("#cargador-pagos").classList.add("d-none");

    let row_guias = document.querySelectorAll("tr[id]");
    for(let guia of row_guias) {
      const remitente = guia.getAttribute("data-remitente");
      totalizador(guia, remitente);
    }
  } else {
    mostrarPagosUsuario(response);
    document.querySelector("#cargador-pagos").classList.add("d-none");
  }
})

function totalizador(guia, remitente) {
  const mostrador_total_local = document.getElementById("total"+remitente);
  const btn_local = document.getElementById("pagar" + remitente);
  
  let total_local = mostrador_total_local.getAttribute("data-total");
  let mostrador_total = document.getElementById("total_pagos");
  let total = mostrador_total.getAttribute("data-total");
  let recaudo = parseInt(guia.children[4].textContent);

  
  total = parseInt(total) + parseInt(guia.children[5].textContent);
  mostrador_total.setAttribute("data-total", total);
  mostrador_total.textContent = "Total $"+convertirMiles(total);
  total_local = parseInt(total_local) + parseInt(guia.children[5].textContent);
  mostrador_total_local.setAttribute("data-total", total_local);
  btn_local.textContent = "Por Pagar $" + convertirMiles(total_local);
  mostrador_total_local.textContent = "$"+convertirMiles(total_local);
}

//Muestra la situación de los pagos a consultar, recibe un arreglo de datos y los organiza por seller automáticamente
function mostrarPagos(datos) {
  const visor_pagos = document.getElementById("visor_pagos");
  visor_pagos.innerHTML = "";
  let centros_costo = [];
  datos.forEach((D, i) => {
    
    if(!D.GUIA) {
      D.ERROR = "Sin número de guía para subir: " + D.GUIA;
    } else if (!D.TRANSPORTADORA){
      D.ERROR = "Lo siento, no se a que transportadora subir la guía: " + D.GUIA;
    } else if (D.TRANSPORTADORA.toLowerCase() !== "servientrega" 
    && D.TRANSPORTADORA.toLowerCase() != "envía" 
    && D.TRANSPORTADORA.toLowerCase() != "tcc"
    && D.TRANSPORTADORA.toLowerCase() != "interrapidisimo"){
      D.ERROR = "Por favor, Asegurate que la factura de la guía: " + D.GUIA + " le pertenezca a <b>Envía, TCC, Servientrega o Interrapidisimo</b>"
    }
    datos.forEach((d, j) => {
      if(i != j){
        if(D.GUIA == d.GUIA) {
          d.ERROR = "Este Número de guía: " +D.GUIA+ " se encuentra duplicado, por favor verifique su documento y vuelvalo a subir.";
        }
      }
    })

    if (!D.REMITENTE) {
      alert("Por favor, verifique tener registrado todos lo seller, de otra manera no se podrá continuar");
      datos = [];
      return [];
    }
  })
  datos.sort((a,b) => {
      if (a["REMITENTE"] > b["REMITENTE"]){
          return 1
      } else if (a["REMITENTE"] < b["REMITENTE"]){
          return -1
      } else {
          return 0
      };
  }).reduce((a,b) => {
      if (a["REMITENTE"] != b["REMITENTE"]){
          centros_costo.push(b["REMITENTE"]);
      }  
      return b;
  }, {REMITENTE: ""});

  
  const dowloader = document.createElement("button");
  dowloader.classList.add("btn", "btn-outline-dark", "btn-block", "my-2");
  dowloader.setAttribute("id", "descargar-pagos")
  dowloader.innerText = "Descargar visibles";
  visor_pagos.appendChild(dowloader);

  const toDownload = datos.map(data => {
    const down = Object.assign({}, data);
    delete down.momento
    return down;
  });

  for(let user of centros_costo) {
    let filtrado = datos.filter((d) => d.REMITENTE == user);
    tablaPagos(filtrado, "visor_pagos");
  };

  
  let total = datos.reduce(function(a,b) {
    return a + parseInt(b["TOTAL A PAGAR"]);
  }, 0);
  
  // <h2 class="text-right mt-4" id="total_pagos" data-total="${total}">Total:  $${convertirMiles(total)}</h2>
  document.getElementById("visor_pagos").innerHTML += `
    <h2 class="text-right mt-4" id="total_pagos" data-total="0">Total:  $${convertirMiles(0)}</h2>
  `;

  visor_pagos.querySelector("#descargar-pagos").addEventListener("click", () => {
    crearExcel(toDownload, "Historial de pagos")
  });
}

function mostrarPagosUsuario(data) {
  $("#visor-pagos").DataTable({
    data: data,
    destroy: true,
    language: {
        url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
    },
    lengthMenu: [ [-1, 10, 25, 50, 100], ["Todos", 10, 25, 50, 100] ],
    columnDefs: [
        {className: "cell-border"}
    ],
    columns: [
        { data: "TRANSPORTADORA", title: "Transportadora"},
        { data: "GUIA", title: "Guía"},
        { data: "FECHA", title: "Fecha"},
        { data: "RECAUDO", title: "Recaudo" },
        { data: "ENVÍO TOTAL", title: "Envío Total" },
        { data: "TOTAL A PAGAR", title: "Total a Pagar"},
        { data: "momento", title: "Momento", visible: false}
    ],
    //Es importante organizarlo por fecha de manera específica, para poder segmentarlo
    order: [[6, "asc"]],
    fixedHeader: {footer:true},
    "drawCallback": function ( settings ) {
      //Me realiza una sumatoria de todos los elementos de una columna y los coloca en un footer
        let api = this.api();

        var rows = api.rows( {page:'current'} ).nodes();
        var last=null;

        //función del Datatable que me coloca una fila completa para segmentarlo por fecha
        api.column(2, {page:'current'} ).data().each( function ( group, i ) {
            if ( last !== group ) {
                $(rows).eq( i ).before(
                  //Ingresa la siguiente fila antes de cada grupo para que el usuario identifique el segmento en el que se encuentra
                    '<tr class="group text-center"><td colspan="6">Pagos Realizados el '+group+'</td></tr>'
                );

                last = group;
            }
        } );

        //la sumatoria de la columna cinco en toda la consulta
        total = api.column(5).data()
        .reduce((a,b) => {
            return parseInt(a) + parseInt(b)
        }, 0);

        //La sumatoria de la columna cinco en la página actual
        pageTotal = api.column(5, {page: "current"})
        .data().reduce((a,b) => {
            return parseInt(a) + parseInt(b);
        }, 0);

        console.log(pageTotal)
        //Finalmente muestro los totales en el footer
        $(this).children("tfoot").html(`
        <tr>
            <td colspan="4"></td>
            <td colspan="2"><h4>$${convertirMiles(pageTotal)} (total: $${convertirMiles(total)})</h4></td>
        </tr>
        `);
        $(api.column(4).footer()).html(
            `$${convertirMiles(pageTotal)} (${convertirMiles(total)} : total)`
        )
    },
    initComplete: function () {
      //a lfinalizar la carga de datos, filtro las fechas para llenar un select
      let column = this.api().column(2)
      let totales = this.api().column(5).nodes();

      //me aseguro de agegar el select en un nodo vacío para que no se dupliquen por cada consulta
      let select = $('<select class="form-control mb-3"><option value="">Seleccione fecha</option></select>')
          .appendTo( $("#filtrar-fecha-visor-pagos").empty())
          .on( 'change', function () {
              let val = $.fn.dataTable.util.escapeRegex(
                $(this).val()
              );

              //realiza una busqueda en la columna especificada anteriormente para aquellos valores que coincidad
              // y me reescribe la tabla con los tados filtrados
              column
                .search( val ? '^'+val+'$' : '', true, false )
                .draw();
          } );

      column.data().unique().each( function ( d, j ) {
        //Toma aquellas fechas diferentes de la anterios y me crea un option por cada una
        
        //reviso todos los totales correspondientes a la fecha filtrada para agregarle también el total
        let sum = 0;
        $(totales).parent().each(function (){
          if($(this).children(":eq(2)").text() == d) {
            sum += parseInt($(this).children(":eq(5)").text());
          }
        });

        //finalmente agrega el option para pder filtrar por fecha
        select.append( '<option value="'+d+'">'+d+ ' - Total pagado: $'+convertirMiles(sum)+'</option>' )
      } );

      $("#visor-pagos_info").removeClass("dataTables_info");
      $("#visor-pagos_info").addClass("text-center");
  }
  })
}

function descargarExcelPagosAdmin(datos) {
  console.log(datos);
  console.log("Funciona?")
}

function cerrarSession() {
  localStorage.clear()
}