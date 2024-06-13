import { v1 } from "../config/api.js";

let datoscoti;
export async function cotizadorApi() {
    let ciudadR = document.getElementById("ciudadR");
    let ciudadD = document.getElementById("ciudadD");
   
    datoscoti = {
        daneCityOrigin: ciudadR.dataset.dane_ciudad,
        daneCityDestination: ciudadD.dataset.dane_ciudad,
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

    let mostrador = document.getElementById("result_cotizacion");
    mostrador.style.display = "block";
    const responseApi = await cotizarApi(datoscoti);

    mostrador.innerHTML = mostrarListaTransportadoras(responseApi);

    // funcion que lee respuesta del api e inserta card
    // mostrador.innerHTML = respuesta
    loader.end();

    // ***** Agregando los datos que se van a enviar para crear guia ******* //
    datos_a_enviar.ciudadR = ciudadR.dataset.ciudad;
    datos_a_enviar.ciudadD = ciudadD.dataset.ciudad;
    datos_a_enviar.departamentoD = ciudadD.dataset.departamento;
    datos_a_enviar.departamentoR = ciudadR.dataset.departamento;
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
    const detallesTransp = $("#nav-contentTransportadoras");
    const {response} = respuestaCotizacion;
    
    response.forEach(r => {
        const {entity, deliveryTime, declaredValue, valueDeposited, total, flete, hekaComission, transpor} = r;
        const transp = entity.toUpperCase();
        const color = "warning";
        const type = "Ejemplo";
        const pathLogo = "imagen.png";
        const detallesPagos = "Detalles pagos";
        const soloEntreganEnDireccion = [];
        
        const encabezado = `<li 
        style="cursor:pointer;" 
        class="list-group-item list-group-item-action shadow-sm mb-2 border border-${color}" 
        id="list-transportadora-${transp}-list" 
        data-transp="${transp}"
        data-type="${type}"
        aria-controls="list-transportadora-${transp}"
      >
        <div class="row">
          <div class="col-lg-2 col-md-2 col-sm-12">
      
          <img 
            src="${pathLogo}" 
            style="max-height:100px; max-width:120px"
            alt="logo-${entity}"
          >
        </div>
      
    <div class="col-lg-7 col-md-7 col-sm-12 mt-3 mt-md-0 pl-md-3">
            <h5>
              <b>${entity}</b>
              <span class="badge badge-${color} p-2">${transp === "TCC" ? "Próximamente" : ""}</span>
            </h5>
            <p class="mb-0">Tiempo de entrega: ${deliveryTime} Días</p>
            <p class="d-sm-block mb-0">
              Costo de envío para ${type == "CONVENCIONAL" ? "Valor declarado" : "recaudo"}: 
              <b>$${convertirMiles(type == "CONVENCIONAL" ? declaredValue : valueDeposited)}</b>
            </p>
            <p class="d-none ${type == "CONVENCIONAL" ? "" : "mb-0 d-sm-block"}">
              El Valor consignado a tu cuenta será: <b>$${convertirMiles(valueDeposited - total)}</b>
            </p>
            <h5 class="text-danger ${soloEntreganEnDireccion.includes(transp) ? "" : "d-none"}">
              Solo entrega en dirección
            </h5>
            ${type ==="PAGO CONTRAENTREGA" ?
              `
              <h5 class="text-success mb-0 mt-2"><b>Tipo de pagos a destinatario</b></h5>
              ${detallesPagos}
              `
              : ""
            }
          </div>
          <div class="col-lg-3 col-md-3 col-sm-12 d-flex flex-column justify-content-around mt-3 mt-md-0">
            <div class="border border-success rounded p-3 mb-2">
              <div class="d-flex justify-content-between">
                <div>
                  <p>Total</p>
                </div>
                <div class="text-end">
                  <h5><b>$${convertirMiles( total )}</b></h5>
                  <small>con nosotros</small>
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
      </li>`;
    
      /*
        const detalle = `<div class="tab-pane fade" 
          id="list-transportadora-${transp}" aria-labelledby="list-transportadora-${transp}-list">
              <div class="card">
                  <div class="card-header bg-${color} text-light">
                      ${entity}
                  </div>
                  <div class="card-body">
                      <div class="card my-3 shadow-sm">
                          <div class="card-body">
                              <h5 class="card-title">Costo Transportadora</h5>
                              <p class="card-text d-flex justify-content-between">Valor flete <b>$${convertirMiles(
                                flete
                              )}</b></p>
                              <p class="card-text d-flex justify-content-between">Comisión transportadora <b>$${convertirMiles(
                                cotizacion.sobreflete
                              )}</b></p>
                              <p class="card-text d-flex justify-content-between">Seguro mercancía <b>$${convertirMiles(
                                declaredValueMercancia
                              )}</b></p>
                          </div>
                      </div>
                      
                      <div class="card my-3 shadow-sm">
                          <div class="card-body">
                              <h5 class="card-title">Costo Heka entrega</h5>
                              <p class="card-text d-flex justify-content-between">Comisión heka <b>$${convertirMiles(
                                sobreFleteHekaEdit
                              )}</b></p>
                          </div>
                      </div>
    
                      ${precioPuntoEnvio}
    
                      <div class="card my-3 shadow-sm border-${
                        color
                      }">
                          <div class="card-body">
                              <h3 class="card-text d-flex justify-content-between">Total: 
                                  <small class="text-danger ${
                                    !descuento && "d-none"
                                  }">
                                      <del>${convertirMiles(
                                        cotizacion.costoEnvioPrev
                                      )}</del>
                                      <h6><small>Precio al público</small></h6>
                                  </small> 
                                  <b>
                                      $${convertirMiles(total)}
                                      <h6><small>Con nosotros</small></h6>
                                  </b>
                              </h3>
                          </div>
                      </div>
                  </div>
              </div>
          </div>`;
*/
        mostradorTransp.push(encabezado);
        //   detallesTransp.append(detalle);
     })

     return `
     <div class="col">
     <ul class="list-group" id="list-transportadoras">
     ${mostradorTransp.join("")}
     </ul>
 </div>
     `;

}