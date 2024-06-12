import { v1 } from "../config/api.js";

let datoscoti;
export async function cotizadorApi() {
    let ciudadR = document.getElementById("ciudadR");
    let ciudadD = document.getElementById("ciudadD");
    
    datoscoti = {  
      ciudadR: value("ciudadR"),
      ciudadD: value("ciudadD"),
      dane_ciudadR: ciudadR.dataset.dane_ciudad,
      dane_ciudadD: ciudadD.dataset.dane_ciudad,
      peso: parseInt(value("Kilos")),
      valorSeguro: parseInt(value("seguro-mercancia")),
      valorRecaudo: parseInt(value("seguro-mercancia")),
      ancho: value("dimension-ancho"),
      largo: value("dimension-largo"),
      alto: value("dimension-alto")
    };
    
    console.log(datoscoti)
    
    // validad obejeto datoscorti != ""
    //Si todos los campos no estan vacios
    if (
      !datoscoti.dane_ciudadR ||
      !datoscoti.dane_ciudadD ||
      !/^.+\(.+\)$/.test(datoscoti.ciudadR) ||
      !/^.+\(.+\)$/.test(datoscoti.ciudadD)
    ) {
      alert(
        "Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable"
      );
      verificador(["ciudadR", "ciudadD"], true);
    } else if (
      !ciudadesFlexxi.includes(datoscoti.ciudadR)
    ) {
      Swal.fire(
        "Ciudad Remitente no válida",
        "La ciudad ingresada en el origen no dipone de punto activo Flexii",
        "error"
      );
      verificador(["ciudadR"], true);
    } else if (
      datoscoti.seguro <
        transportadoras[codTransp].limitesValorDeclarado(datoscoti.peso)[0] ||
        datoscoti.seguro >
        transportadoras[codTransp].limitesValorDeclarado(datoscoti.peso)[1]
    ) {
      // Si el valor del recaudo excede el limite permitido
      alert(
        "Ups! el valor declarado en base a " +
          value("Kilos") +
          "Kg no puede ser menor a $" +
          convertirMiles(
            transportadoras[codTransp].limitesValorDeclarado(value("Kilos"))[0]
          ) +
          ", ni mayor a $" +
          convertirMiles(
            transportadoras[codTransp].limitesValorDeclarado(value("Kilos"))[1]
          )
      );
      verificador("seguro-mercancia", true);
    } else if (datoscoti.ancho <
        transportadoras[codTransp].limitesLongitud[0] ||
        datoscoti.largo <
        transportadoras[codTransp].limitesLongitud[0] ||
        datoscoti.alto < transportadoras[codTransp].limitesLongitud[0] ||
        datoscoti.ancho >
        transportadoras[codTransp].limitesLongitud[1] ||
        datoscoti.largo >
        transportadoras[codTransp].limitesLongitud[1] ||
        datoscoti.alto > transportadoras[codTransp].limitesLongitud[1]
    ) {
      // Si el valor de las dimensiones exceden el limite permitido
      alert(
        "Alguno de los valores ingresados en la dimensiones no es válido, Por favor verifique que no sean menor a 1cm, o mayor a 150cm"
      );
      verificador(
        ["dimension-alto", "dimension-largo", "dimension-ancho"],
        true
      );
    } else {
      //Si todo esta Correcto...
      verificador();
      const loader = new ChangeElementContenWhileLoading("#boton_cotizar_2,#boton_cotizar");
      loader.init();
  
      let mostrador = document.getElementById("result_cotizacion");
      mostrador.style.display = "block";
      await  cotizarApi();
      // funcion que lee respuesta del api e inserta card
      mostrador.innerHTML = respuesta
      loader.end();
  
      // ***** Agregando los datos que se van a enviar para crear guia ******* //
      datos_a_enviar.ciudadR = ciudadR.dataset.ciudad;
      datos_a_enviar.ciudadD = ciudadD.dataset.ciudad;
      datos_a_enviar.departamentoD = ciudadD.dataset.departamento;
      datos_a_enviar.departamentoR = ciudadR.dataset.departamento;
      datos_a_enviar.alto = datoscoti.alto;
      datos_a_enviar.ancho = datoscoti.ancho;
      datos_a_enviar.largo = datoscoti.largo;
      // datos_a_enviar.valor = 0;
      // datos_a_enviar.seguro = value("seguro-mercancia");
      datos_a_enviar.correoR = datos_usuario.correo || "notiene@gmail.com";
  
      if (ControlUsuario.esPuntoEnvio) {
        datos_a_enviar.centro_de_costo_punto = datos_usuario.centro_de_costo;
      } else {
        datos_a_enviar.centro_de_costo = datos_usuario.centro_de_costo;
      }
  
      // if(estado_prueba) datos_a_enviar.prueba = true;
  
    //   $("#botonFinalizarCoti").click((e)=>finalizarCotizacionFlexii(e))
      // finalizarCotizacionFlexii()
  
    //   if (!isIndex) guardarCotizacion();
  
      location.href = "#result_cotizacion";
  
    }
}

async function cotizarApi() {
    const request = {
        "daneCityOrigin": "76001000",
        "daneCityDestination": "11001000",
        "typePayment": 1,
        "declaredValue": 100000,
        "weight": "1",
        "height": "1",
        "long": "1",
        "width": "1",
        "withshippingCost": false,
        "collectionValue": 100000
    }

    const data = await fetch(v1.quoter, {
        method: "POST",
        headers: {
            "Content-Type": "Application/json"
        },
        body: JSON.stringify(request)
    })
    .then(d => d.json());


    console.log("respuesta cotización: ", data);
    
}