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
                    <li class="card-text d-flex justify-content-between list-group-item">Valor declarado <b>$${convertirMiles(objData.detalles.seguro)}</b></li>
                    <li class="card-text d-flex justify-content-between list-group-item">Valor recaudo <b>$${convertirMiles(objData.detalles.recaudo)}</b></li>
                    <li class="card-text d-flex justify-content-between list-group-item ">Peso <b>${objData.detalles.peso_liquidar}</b></li>
                    <li class="card-text d-flex justify-content-between list-group-item">Tiempo de entrega <b>${objData.tiempoEntrega} días hábiles</b></li>
                </ul>
            </div>
        </div>

        
         <!-- caja dos -->
        <div class="col-sm">
            <div class="card shadow-sm bg-white mb-3">
                <ul class="list-group list-group-flush">
                    <h5 class="card-header text-warning">Costo Transportadora</h5>
                    <li class="list-group-item card-body">
                        <p class="card-text d-flex justify-content-between">Valor flete <b>$${convertirMiles(objData.flete)}</b></p>
                        <p class="card-text d-flex justify-content-between">Comisión transportadora <b>$${convertirMiles(objData.sobreflete)}</b></p>
                        <p class="card-text d-flex justify-content-between">Seguro mercancía <b>$${convertirMiles(objData.seguroMercancia)}</b></p>
                    </li>
                </ul>
            </div>
          

            <div  class="card shadow-sm bg-white">
                <ul class="list-group list-group-flush">
                    <h5 class="card-header text-warning">Costo Flexii</h5>
                    <li class="list-group-item card my-3 ">
                        <div class="card-head">
                        <p class="card-text d-flex justify-content-between">Comisión Flexii <b>$${convertirMiles(objData.sobrefleteHeka)}</b></p>
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