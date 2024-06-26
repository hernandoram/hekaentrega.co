import { pathCotizador } from "../config/api.js";
import { detallesFlexii } from "./views.js";

//#region COTIZADOR FLEXII
let datoscoti
export async function cotizadorFlexii() {
  const controlCiudadR = document.getElementById("ciudadR").selectize;
  const controlCiudadD = document.getElementById("ciudadD").selectize;

  let ciudadR = controlCiudadR.options[controlCiudadR.getValue()];
  ciudadD = controlCiudadD.options[controlCiudadD.getValue()];
  
  datoscoti={
    // "peso": 1,
    // "alto": 10,
    // "largo": 10,
    // "ancho": 10,
    // "valorSeguro": 50000,
    // "valorRecaudo": 50000,
    // "idDaneCiudadOrigen": "05001000",
    // "idDaneCiudadDestino": "05001000",

    ciudadD: `${ciudadD.ciudad}(${ciudadD.departamento})`, // Para mantener el formato de como se usaba antes
    ciudadR: `${ciudadR.ciudad}(${ciudadR.departamento})`, // Para mantener el formato de como se usaba antes
    dane_ciudadR: ciudadR.dane,
    dane_ciudadD: ciudadD.dane,
    peso: parseInt(value("Kilos")),
    valorSeguro: parseInt(value("seguro-mercancia")),
    valorRecaudo: parseInt(value("seguro-mercancia")),
    ancho: value("dimension-ancho"),
    largo: value("dimension-largo"),
    alto: value("dimension-alto"),
  };
  
  console.log(datoscoti)
  
  // validad obejeto datoscorti != ""
  //Si todos los campos no estan vacios
  if (
    controlCiudadR.isInvalid || controlCiudadD.isInvalid
  ) {
    Swal.fire(
      "Error",
      "Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable",
      "error"
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
    let respuesta = await responseFlexii(datoscoti);
    // funcion que lee respuesta del api e inserta card
    mostrador.innerHTML = respuesta
    loader.end();

    // ***** Agregando los datos que se van a enviar para crear guia ******* //
    datos_a_enviar.ciudadR = ciudadR.ciudad;
    datos_a_enviar.ciudadD = ciudadD.ciudad;
    datos_a_enviar.departamentoD = ciudadD.departamento;
    datos_a_enviar.departamentoR = ciudadR.departamento;
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

    $("#botonFinalizarCoti").click((e)=>finalizarCotizacionFlexii(e))
    // finalizarCotizacionFlexii()

    if (!isIndex) guardarCotizacion();

    location.href = "#result_cotizacion";

  }
}

/** Función que recibe como parámetro los datos de cotización y el tipo
 * Para luego revisar entre las estadísticas por orden de la mejor a la peor transportadora para la transacción,
 * si la primera transportadora en su momento genera error, va hacia la segunda y así sucesivamente para trata de "siempre"
 * repsonde una cotización
 */
async function cotizarMejorTransportadora(datos, type) {
  // Se debe restablece cuando se vayan a utilizar las estadísticas
  const transportadoras = await transportadoraPorEstadistica(datos.dane_ciudadD);

  console.log(transportadoras);
  // const transportadoras = ["COORDINADORA", "INTERRAPIDISIMO", "SERVIENTREGA", "ENVIA"]
  // .sort(() => getRandomInt(2) - 1);

  datos.transpDeseada = transportadoras[0];

  while(transportadoras.length > 0) {
    const tSeleccionada = transportadoras.shift();
    const cotizacion = await cotizarApi(datos, tSeleccionada, type);

    if(!cotizacion.error) return cotizacion;
  }

  return {
    error: true,
    body: "No disponibilidad para el destino seleccionado."
  };

}

async function cotizarApi(datos, transportadora,type){
  console.log("COTIZANDO API")
  try {
    const cotizacion = await fetch(pathCotizador + '/' + transportadora,
    {
      method: 'POST',
      headers: {
        'Authentication': user_id,
        'Content-Type': 'application/json'
      },
      body:JSON.stringify({
        "peso": parseInt(datos.peso),
        "alto": parseInt(datos.alto),
        "largo": parseInt(datos.largo),
        "ancho": parseInt(datos.ancho),
        "valorSeguro": parseInt(datos.valorSeguro),
        "valorRecaudo": parseInt(datos.valorRecaudo),
        "idDaneCiudadOrigen": datos.dane_ciudadR,
        "idDaneCiudadDestino": datos.dane_ciudadD,
        "tipo": type,
        "fleteFlexiiAdicional": true, // Debe ir en tru para activar la comisión Flexii
        sumarCostoEnvio: !!datos.sumar_envio
      })
    }).then(httpResponse => httpResponse.json()
    );

    console.log("COTIZACION PURA" , cotizacion);

    return cotizacion
  } catch (error) {
    console.log(error)
  } 
}

async function validaPagoContraentregaFlexii() {
  //le muestra al usuario las opciones del pago contraentrega y
  // devuelve un objeto conciertas opciones a implementar al cotizador
  let recaudo = await Swal.fire({
    title: "<strong>Valor de Recaudo</strong>",
    icon: "info",
    html: `
            <p>Recuerde que es posible que el "valor Declarado" será sustituido por el valor de recaudo</p>
            <input type="number" id="valor-recaudo" class="form-control" placeholder="Ingrese monto"
            min="5000" max="2000000" require></input>
            <div class="form-group form-check mt-2">
                <input type="checkbox" class="form-check-input" id="sumar-envio-cotizador"></input>
                <label class="form-check-label" for="sumar-envio-cotizador">¿Desea sumar costo de envío?</label>
            </div>
            ${
              true
                ? ""
                : `
            <div class="form-group form-check mt-2">
                <input type="checkbox" class="form-check-input" id="restar-saldo-cotizador"></input>
                <label class="form-check-label" for="restar-saldo-cotizador">¿Desea restar el costo del envío del saldo?</label>
            </div>
            `
            }
          `,
    confirmButtonText: "Continuar",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-success",
    },
    confirmButtonAriaLabel: "continuar",
    preConfirm: () => {
      //Antes de continuar, utiliza un validador
      let valor_recaudo = value("valor-recaudo");
      let sumar_envio = $("#sumar-envio-cotizador").prop("checked");
      let restar_saldo = $("#restar-saldo-cotizador").prop("checked");

      /*Verifica que haya valor en el recaudo, que no supere los límites ingresados
            Y que no sea menor al costo del envío*/
      if (!valor_recaudo) {
        Swal.showValidationMessage(`¡Recuerde ingresar un valor!`);
      } else if (
        value("valor-recaudo") < 5000 ||
        value("valor-recaudo") > 2000000
      ) {
        Swal.showValidationMessage(
          "El valor no puede ser menor a $5.000 ni mayor a $2.000.000"
        );
      }


      return {
        sumar_envio, restar_saldo, valor_recaudo: parseInt(valor_recaudo)
      };
    },
  }).then((result) => {
    return result.isConfirmed ? result : "";
  });

  return recaudo;
}

async function responseFlexii(datos) {
  
  //Primero le consulta al usuario por el tipo de envío
  let type = await seleccionarTipoEnvio();

  //si no selecciona ninguno, no devuelve nada
  if (!type) {
    return "";
  } else if (type == "PAGO DESTINO") {
    datos_a_enviar.debe = true;
  } else if (type == "PAGO CONTRAENTREGA") {
    // Para esta selección activa un nuevo modal que me devuleve los datos de cotización
    let resp_usuario = await validaPagoContraentregaFlexii();
    datos_a_enviar.debe = true;
    if (!resp_usuario) {
      return "";
    }

    datos.sumar_envio = !!resp_usuario.value.sumar_envio;
    datos.valorRecaudo = resp_usuario.value.valor_recaudo;
  } else {
    // de resto calcula el costo del envío directamente con el seguro de mercancía o valor declarado
    datos_a_enviar.debe = false;
  }

  const cotizacion = await cotizarMejorTransportadora(datos, type);

  if(cotizacion.error) {
    console.log(cotizacion);
    Swal.fire("Error Cod. " + datos.transpDeseada?.substring(0,4), cotizacion.body.message || cotizacion.body, "error");
    return "";
  }
  
  const result_cotizacion = cotizacion.body;
  const transp = result_cotizacion.transportadora;

  console.log(result_cotizacion)
  datoscoti.cotizacion = result_cotizacion
  //Lleno algunos campos de los datos de cotizacióm
  datoscoti.peso = result_cotizacion.detalles.peso_real;
  datoscoti.costo_envio = result_cotizacion.costoEnvio;
  datoscoti.valor = datos.valorRecaudo;
  // datos_de_cotizacion.seguro = result_cotizacion.seguro;
  datoscoti.sumar_envio = datos.sumar_envio;
  datoscoti.type = type;

  return detallesFlexii(result_cotizacion);
  
}


function finalizarCotizacionFlexii() {
  console.log(datoscoti)
  console.log(datos_a_enviar)
  console.log(datos_personalizados)
  console.log("oprimio boton")

  if (datos_a_enviar.debe)
    datos_a_enviar.debe = -datoscoti.costo_envio;
    console.log(datos_a_enviar)
  if (
    datoscoti.valor < datoscoti.costo_envio &&
    datoscoti.type !== "CONVENCIONAL"
  ) {
    return Toast.fire({
      icon: "error",
      text: "El valor del recaudo no debe ser menor al costo del envío.",
    });
  }

    //continúa si el cliente termina seleccionando la transportadora
    datos_a_enviar.detalles = datoscoti.cotizacion.detalles
    datos_a_enviar.peso = datoscoti.peso;
    datos_a_enviar.costo_envio = datoscoti.costo_envio;
    datos_a_enviar.valor = datoscoti.valor;
    datos_a_enviar.seguro = datoscoti.valorSeguro;
    datos_a_enviar.type = datoscoti.type;
    datos_a_enviar.dane_ciudadR = datoscoti.dane_ciudadR;
    datos_a_enviar.dane_ciudadD = datoscoti.dane_ciudadD;
    datos_a_enviar.transportadora = datoscoti.cotizacion.transportadora;

    // Siempre colocamos esta variable como "FLEXII", para que directamente sobre el historial se pueda ver
    // la información, sin pasar por ningún condicional
    datos_a_enviar.transpVisible = "FLEXII";
    
    // Para identificar concretamente las guías generadar por la metodología flexii, de otro tipo de metodología de cotización
    datos_a_enviar.origenGeneracionGuia = "FLEXII";
    
    if (
      !datos_a_enviar.debe &&
      !datos_personalizados.actv_credit &&
      datos_a_enviar.costo_envio > datos_personalizados.saldo &&
      datos_a_enviar.type !== CONTRAENTREGA
    ) {
      /* Si el usuario no tiene el crédito activo, la guía que quiere crear
              muestra que debe saldo y se verifica que el costo del envío excede el saldo
              Arroja la excepción*/
      Swal.fire(
        "¡No permitido!",
        `Lo sentimos, en este momento, el costo de envío excede el saldo
              que tienes actualmente, por lo tanto este metodo de envío no estará 
              permitido hasta que recargues tu saldo. Puedes comunicarte con la asesoría logística para conocer los pasos
              a seguir para recargar tu saldo.`
      );
    } else {

      finalizarCotizacion(datos_a_enviar);
    }
}
//#endregion


//#region ESTADITICAS
/** Tiene como propçosito mostrar en orden descendente las transportadoras con mayor efectividad de entrega 
 * [0: mejor transpotadora, .... n: Peor transportadora]
*/
async function transportadoraPorEstadistica(dane_ciudad) {
  const estadisticas = await obtenerEstadisticasCiudad(dane_ciudad);

  estadisticas.sort((a,b) => calculaPrecision(b) - calculaPrecision(a));
  console.log("Luego del orden: ", estadisticas)

  return estadisticas.map(est => est.transportadora);
}

async function obtenerEstadisticasCiudad(dane_ciudad) {
  return await db
  .collection("ciudades")
  .doc(dane_ciudad)
  .collection("estadisticasEntrega")
  .get()
  .then(q => {
    const result = [];
    q.forEach(d => result.push(d.data()));

    return result;
  })

}

function calculaPrecision(estadistica) {
  const precision = Math.round(
    (estadistica.entregas / estadistica.envios) * 100
  );

  return isNaN(precision) ? 0 : precision;
}
//#endregion
