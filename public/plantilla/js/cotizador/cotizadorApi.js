import { v1 } from "../config/api.js";
import { selectize } from "../consultarCiudades.js";
import { paymentAdmited } from "./constantes.js";
import { TranslatorFromApi, translation } from "./translator.js";

let datoscoti = {
  daneCityOrigin: "",
  daneCityDestination: "",
  typePayment: 1, // Falta asignarlo a la segunda carcasa del cotizador
  declaredValue: 90000,
  weight: 1,
  height: "1",
  long: "1",
  width: "1",
  withshippingCost: false, // Falta asignarlo a la segunda carcasa del cotizador
  collectionValue: 90000, // Falta asignarlo a la segunda carcasa del cotizador
};
export async function cotizadorApi() {
    const controlCiudadR = selectize.ciudadR;
    const controlCiudadD = selectize.ciudadD;

    const ciudadR = controlCiudadR.options[controlCiudadR.getValue()];
    ciudadD = controlCiudadD.options[controlCiudadD.getValue()];
   
    datoscoti = {
        daneCityOrigin: ciudadR.dane,
        daneCityDestination: ciudadD.dane,
        typePayment: 1, // Falta asignarlo a la segunda carcasa del cotizador
        declaredValue: parseInt(value("seguro-mercancia")),
        weight: parseInt(value("Kilos")),
        height: value("dimension-alto"),
        long: value("dimension-largo"),
        width: value("dimension-ancho"),
        withshippingCost: false, // Falta asignarlo a la segunda carcasa del cotizador
        collectionValue: parseInt(value("seguro-mercancia")), // Falta asignarlo a la segunda carcasa del cotizador
    }
    
    console.log(datoscoti)
    
    // validad obejeto datoscorti != ""
    //Si todos los campos no estan vacios
    if (
      !datoscoti.daneCityOrigin ||
      !datoscoti.daneCityDestination
    ) {
      Toast.fire(
        "",
        "Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable",
        "error"
      );
      verificador(["ciudadR", "ciudadD"], true);
      return;
    }

    //Si todo esta Correcto...
    verificador(); // Limpiamos cualquier verificación previa

    const loader = new ChangeElementContenWhileLoading("#boton_cotizar_2,#boton_cotizar");
    // loader.init();

    
    const responseApi = await cotizarApi(datoscoti);

    mostrarListaTransportadoras(responseApi.response);

    // funcion que lee respuesta del api e inserta card
    // mostrador.innerHTML = respuesta
    loader.end();

    // ***** Agregando los datos que se van a enviar para crear guia ******* //
    datos_a_enviar.ciudadR = ciudadR.ciudad;
    datos_a_enviar.ciudadD = ciudadD.ciudad;
    datos_a_enviar.departamentoD = ciudadD.departamento;
    datos_a_enviar.departamentoR = ciudadR.departamento;
    datos_a_enviar.alto = datoscoti.height;
    datos_a_enviar.ancho = datoscoti.width;
    datos_a_enviar.largo = datoscoti.long;
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

async function cotizarApi(request) {
    const data = await fetch(v1.quoter, {
        method: "POST",
        headers: {
            "Content-Type": "Application/json"
        },
        body: JSON.stringify(request)
    })
    .then(d => d.json());

    return data;
}


function mostrarListaTransportadoras(respuestaCotizacion) {
    const mostradorTransp = [];
    const detallesTransp = [];
    
    respuestaCotizacion.forEach((r, i) => {
      const {entity, deliveryTime, declaredValue, transportCollection, total} = r;
      const transp = entity.toUpperCase();
      const configTransp = transportadoras[transp];
      const color = configTransp.color;
      const type = translation.typePayment[datoscoti.typePayment];
      const pathLogo = configTransp.logoPath;

      if (!configTransp.cotizacion) configTransp.cotizacion = new Object();
        configTransp.cotizacion[type] = new TranslatorFromApi(datoscoti, r);

      // Muestra la lita de los tipo de pagos disponibles por transportadora cuando se trata de pago contraentrega
      const detallesPagos = `
        <ul class="list-unstyled">
          ${paymentAdmited.filter(p => p.transportApplic.includes(transp)).map(tp => `
            <li class="d-flex align-items-center">
              <span class="mr-2">${tp.icon}</span>
              <span>${tp.title}</span>
            </li>
          `).join("\n")}
        </ul>
      `;
      
      const encabezado = `
        <li 
        style="cursor:pointer;" 
        class="list-group-item list-group-item-action shadow-sm mb-2 border border-${color}" 
        id="list-transportadora-${entity}-list" 
        data-transp="${transp}"
        data-type="${type}"
        aria-controls="list-transportadora-${entity}"
        >
          <div class="row">
            <div class="col-lg-2 col-md-2 col-sm-12 d-md-none d-lg-block">
              <img 
                src="${pathLogo}" 
                style="max-height:100px; max-width:120px"
                alt="logo-${entity}"
              >
            </div>

            <div class="col-lg-7 col-md-7 col-sm-12 mt-3 mt-md-0 pl-md-3">
              <h5>
                <b>${transp}</b>
              </h5>
              <p class="mb-0">Tiempo de entrega: ${deliveryTime} Días</p>
              <p class="d-sm-block mb-0">
                Costo de envío para ${type == "CONVENCIONAL" ? "Valor declarado" : "recaudo"}: 
                <b>$${convertirMiles(type == "CONVENCIONAL" ? declaredValue : transportCollection)}</b>
              </p>
              <p class="d-none ${type == "CONVENCIONAL" ? "" : "mb-0 d-sm-block"}">
                El Valor consignado a tu cuenta será: <b>$${convertirMiles(transportCollection - total)}</b>
              </p>
              <small class="text-warning">${r.annotations}</small>
              ${type ==="PAGO CONTRAENTREGA" ?
                `
                <h5 class="text-success mb-0 mt-2"><b>Tipo de pagos a destinatario</b></h5>
                ${detallesPagos}
                `
                : ""
              }
            </div>
            <div class="col-lg-3 col-md-5 col-sm-12 d-flex flex-column justify-content-around mt-3 mt-md-0">
              <img 
                src="${pathLogo}" 
                style="max-height:100px; max-width:120px"
                alt="logo-${entity}"
                class="d-none d-md-block d-lg-none"
              >

              <div class="border border-success rounded p-3 mb-2">
                <div class="d-flex justify-content-between">
                  <div>
                    <p>Total</p>
                  </div>
                  <div class="text-end">
                    <h5><b>$${convertirMiles( total )}</b></h5>
                  </div>
                </div>
              </div>

              <small id="ver-detalles-${transp}" class="detalles border border-dark rounded p-3 text-center font-weight-bold">
                Ver detalles
              </small>
            </div>
          </div>
          <p class="mb-0 text-center">
            <span class="estadisticas position-relative"></span>
          </p>
        </li>
      `;
  
    

      const precioPuntoEnvio = ControlUsuario.esPuntoEnvio
      ? `
          <div class="card my-3 shadow-sm">
              <div class="card-body">
                  <h5 class="card-title">Comisión Punto</h5>
                  <p class="card-text d-flex justify-content-between">Comisión punto <b>$${convertirMiles(
                    r.comision_punto
                  )}</b></p>
              </div>
          </div>
      `
      : "";

      const detalle = `<div class="tab-pane fade ${i === 0 ? "show active" : ""}" 
      id="list-transportadora-${entity}" aria-labelledby="list-transportadora-${entity}-list">
        <div class="card">
          <div class="card-header bg-${color} text-light">
            ${transp}
          </div>
          <div class="card-body">
            <div class="card my-3 shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Costo Transportadora</h5>
                <p class="card-text d-flex justify-content-between">Valor flete <b>$${convertirMiles(
                  r.flete
                )}</b></p>
                <p class="card-text d-flex justify-content-between">Comisión transportadora <b>$${convertirMiles(
                  r.transportCommission
                )}</b></p>
                <p class="card-text d-flex justify-content-between">Seguro mercancía <b>$${convertirMiles(
                  r.assured
                )}</b></p>
              </div>
            </div>
            
            <div class="card my-3 shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Costo Heka entrega</h5>
                <p class="card-text d-flex justify-content-between">Comisión heka <b>$${convertirMiles(
                  r.hekaCommission
                )}</b></p>
              </div>
            </div>

            ${precioPuntoEnvio}

            <div class="card my-3 shadow-sm border-${color}">
              <div class="card-body">
                <h3 class="card-text d-flex justify-content-between">
                  Total: 

                  <b>$${convertirMiles(total)}</b>
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>`;

      mostradorTransp.push(encabezado);
      detallesTransp.push(detalle);
    })

    const viewTransports = `
    <div class="row">
      <div class="col">
        <ul class="list-group" id="list-transportadoras">
          ${mostradorTransp.join("")}
        </ul>
      </div>

      <div class="col-12 col-md-5 mt-4 mt-md-0 d-none d-md-block">
        <div class="tab-content" id="nav-contentTransportadoras">
          ${detallesTransp.join("")}
        </div>
      </div>
    </div>
    `;

    const mostrador = document.getElementById("result_cotizacion");
    mostrador.style.display = "block";
    mostrador.innerHTML = viewTransports;


    // Espacio reservado para la asignación de eventos
    const containerListTransports = $("#list-transportadoras", mostrador);
    $(".detalles", containerListTransports).on("click", verDetallesTransportadora);

    $("#list-transportadoras", mostrador).children().each((i, el) => {
      el.addEventListener("click", seleccionarTransportadora);
    });
}


const exampleData = [
    {
        "entity": "servientrega",
        "deliveryTime": "1-2",
        "declaredValue": 25000,
        "flete": 13000,
        "valueDeposited": 6925,
        "transportCommission": 3000,
        "hekaCommission": 2075,
        "transportCollection": 25000,
        "onlyToAddress": false,
        "assured": 0,
        "annotations": "El costo se calcula desde 3 kg para ofrecerte la mejor tarifa posible",
        "total": 18075
    },
    {
        "entity": "interrapidisimo",
        "deliveryTime": "3",
        "declaredValue": 25000,
        "flete": 11150,
        "valueDeposited": 33900,
        "transportCommission": 1500,
        "hekaCommission": 2450,
        "transportCollection": 50000,
        "onlyToAddress": false,
        "assured": 1000,
        "annotations": "",
        "total": 16100
    },
    {
        "entity": "envia",
        "deliveryTime": 1,
        "declaredValue": 25000,
        "flete": 12700,
        "valueDeposited": 5475,
        "transportCommission": 2500,
        "hekaCommission": 2075,
        "transportCollection": 25000,
        "onlyToAddress": true,
        "assured": 2250,
        "annotations": "",
        "total": 19525
    },
    {
        "entity": "coordinadora",
        "deliveryTime": "1",
        "declaredValue": 25000,
        "flete": 10975,
        "valueDeposited": 7150,
        "transportCommission": 4300,
        "hekaCommission": 2075,
        "transportCollection": 25000,
        "onlyToAddress": true,
        "assured": 500,
        "annotations": "",
        "total": 17850
    }
]