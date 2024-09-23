import { paymentAdmited } from "./constantes.js";

export function detallesFlexii(objData) {
  return `
    <div class="card">

    <div class="bg-light rounded-top shadow pl-5 mb-4">
      <img  src="./img/logo-flexi.png" width="120px"  alt="">
    </div>


    <div class="row card-body">
        <!-- caja uno -->
        <div class="col-sm mb-3 d-none d-sm-block">
            <div class="card shadow-sm">
                <h5 class="card-header text-warning">Cotización</h5>
                <ul class="list-group list-group-flush">
                    <li class="card-text d-flex justify-content-between list-group-item">Valor declarado <b>$${convertirMiles(
                      objData.detalles.seguro
                    )}</b></li>
                    <li class="card-text d-flex justify-content-between list-group-item">Valor recaudo <b>$${convertirMiles(
                      objData.detalles.recaudo
                    )}</b></li>
                    <li class="card-text d-flex justify-content-between list-group-item ">Peso <b>${
                      objData.detalles.peso_liquidar
                    }</b></li>
                    <li class="card-text d-flex justify-content-between list-group-item">Tiempo de entrega <b>${
                      objData.tiempoEntrega
                    } días hábiles</b></li>
                </ul>
            </div>
        </div>

        
         <!-- caja dos -->
        <div class="col-sm">
            <div class="card shadow-sm bg-white mb-3">
                <ul class="list-group list-group-flush">
                    <h5 class="card-header text-warning">Costo Transportadora</h5>
                    <li class="list-group-item card-body">
                        <p class="card-text d-flex justify-content-between">Valor flete <b>$${convertirMiles(
                          objData.flete
                        )}</b></p>
                        <p class="card-text d-flex justify-content-between">Comisión transportadora <b>$${convertirMiles(
                          objData.sobreflete
                        )}</b></p>
                        <p class="card-text d-flex justify-content-between">Seguro mercancía <b>$${convertirMiles(
                          objData.seguroMercancia
                        )}</b></p>
                    </li>
                </ul>
            </div>
          

            <div  class="card shadow-sm bg-white">
                <ul class="list-group list-group-flush">
                    <h5 class="card-header text-warning">Costo Flexii</h5>
                    <li class="list-group-item card my-3 ">
                        <div class="card-head">
                        <p class="card-text d-flex justify-content-between">Comisión Flexii <b>$${convertirMiles(
                          objData.sobrefleteHeka
                        )}</b></p>
                    </li>
                </ul>
            </div>
        
            <div class="card m-3 shadow border border-warning">
                <div class="card-head p-3 shadow-sm">
                    <h4 class="card-text d-flex justify-content-between">Total:  
                    <b>
                        $${convertirMiles(objData.costoEnvio)}
                    </b>
                    </h4>
                </div>
            </div> 
        </div>
        <button class="mt-3 btn-warning btn-block btn-lg text-light" id="botonFinalizarCoti"> Continuar </button>
    </div>

  </div>
    `;
}

export function tarjetaBasicaTransportadora(
  configTransportadora,
  respuestaCotizacion
) {
  const {
    entity,
    type,
    declaredValue,
    transportCollection,
    total,
    deliveryTime,
    annotations,
  } = respuestaCotizacion;
  const { color, logoPath } = configTransportadora;
  const transp = configTransportadora.cod;

  const detallesPagos = `
        <ul class="list-unstyled">
        ${paymentAdmited
          .filter((p) => p.transportApplic.includes(transp))
          .map(
            (tp) => `
            <li class="d-flex align-items-center">
            <span class="mr-2">${tp.icon}</span>
            <span>${tp.title}</span>
            </li>
        `
          )
          .join("\n")}
        </ul>
    `;

  return `
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
                src="${logoPath}" 
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
                Costo de envío para ${
                  type == "CONVENCIONAL" ? "Valor declarado" : "recaudo"
                }: 
                <b>$${convertirMiles(
                  type == "CONVENCIONAL" ? declaredValue : transportCollection
                )}</b>
              </p>
              <p class="d-none ${
                type == "CONVENCIONAL" ? "" : "mb-0 d-sm-block"
              }">
                El Valor consignado a tu cuenta será:<b>$${convertirMiles(
                  transportCollection - total
                )}</b>
              </p>
              <small class="text-warning">${annotations}</small>

                  <p class="mb-0 text-center">
            <span class="estadisticas position-relative"></span>

          </p>

              ${
                type === "PAGO CONTRAENTREGA"
                  ? `
                <h5 class="text-success mb-0 mt-2"><b>Tipo de pagos a destinatario</b></h5>
                ${detallesPagos}
                `
                  : ""
              }
            </div>
            <div class="col-lg-3 col-md-5 col-sm-12 d-flex flex-column justify-content-around mt-3 mt-md-0">
              <img 
                src="${logoPath}" 
                style="max-height:100px; max-width:120px"
                alt="logo-${entity}"
                class="d-none d-md-block d-lg-none"
              >

              <div class="border border-success rounded p-3 mb-2">
                <div class="d-flex justify-content-between flex-wrap">
                  <div>
                    <p>Total</p>
                  </div>
                  <div class="text-end">
                    <h5><b>$${convertirMiles(total)}</b></h5>
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
}

export function tarjetaErrorTransportadora(
  configTransportadora,
  respuestaCotizacion
) {
  const transp = configTransportadora.cod;
  const { message } = respuestaCotizacion;

  return `<li style="cursor:pointer;" class="list-group-item list-group-item-action shadow-sm mb-2 border border-${configTransportadora.color}" 
        id="list-transportadora-${transp}-list" 
        data-transp="${transp}"
        aria-controls="list-transportadora-${transp}"
        >
            <div class="row container" >
                <img src="${configTransportadora.logoPath}" 
                class="col-md-1 col-sm-12" style="max-height:120px; max-width:100px"
                alt="logo-${configTransportadora.nombre}">
                <div class="col mt-3 mt-sm-0 order-1 order-sm-0">
                    <h5 class="text-left">${configTransportadora.nombre}</h5>
                    <h4 class="text-center mt-4"><b>${message}</b></h4>
                </div>
            </div>
        </li>`;
}
