import { v1 } from "../config/api.js";
import { selectize } from "../consultarCiudades.js";
import { controls } from "./constantes.js";
import {
  TranslatorFromApi,
  createExcelComparativePrices,
  demoPruebaCotizadorAntiguo,
  testComparePrices,
  translation,
} from "./translator.js";
import {
  tarjetaBasicaTransportadora,
  tarjetaErrorTransportadora,
} from "./views.js";

let datoscoti = {
  daneCityOrigin: "",
  daneCityDestination: "",
  typePayment: 1,
  declaredValue: 90000,
  weight: 1,
  height: "1",
  long: "1",
  width: "1",
  withshippingCost: false,
  collectionValue: 90000,
};
export async function cotizadorApi() {
  if (!navigator.onLine) {
    Toast.fire(
      "",
      "No tienes conexión a Internet! Conectate para cotizar!",
      "error"
    );
    controls.btnCotizarGlobal.disabled = false;
    return;
  }

  const formulario = document.getElementById("cotizar-envio");
  if (!formulario.checkValidity()) {
    Toast.fire("", "todos los campos son obligatorios", "error");

    return verificador(
      [
        "ciudadR",
        "ciudadD",
        controls.valorRecaudo.get(0).id,
        "seguro-mercancia",
        "Kilos",
        "dimension-alto",
        "dimension-largo",
        "dimension-ancho",
      ],
      null,
      "Este campo es Obligatorio."
    );
  }

  const controlCiudadR = selectize.ciudadR;
  const controlCiudadD = selectize.ciudadD;

  if (!controlCiudadR.getValue() || !controlCiudadD.getValue()) {
    Toast.fire(
      "",
      "Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable",
      "error"
    );
    verificador(["ciudadR", "ciudadD"], "no-scroll");
    return;
  }

  datos_a_enviar = new Object();

  const ciudadR = controlCiudadR.options[controlCiudadR.getValue()];
  ciudadD = controlCiudadD.options[controlCiudadD.getValue()];

  const esPagoContraentrega = controls.tipoEnvio.val() === PAGO_CONTRAENTREGA;

  datoscoti = {
    daneCityOrigin: ciudadR.dane,
    daneCityDestination: ciudadD.dane,
    typePayment: translation.typePaymentInt[controls.tipoEnvio.val()],
    declaredValue: parseInt(value("seguro-mercancia")),
    weight: parseInt(value("Kilos")),
    height: parseInt(value("dimension-alto")),
    long: parseInt(value("dimension-largo")),
    width: parseInt(value("dimension-ancho")),
    withshippingCost: controls.sumaEnvio.prop("checked"),
    collectionValue: esPagoContraentrega
      ? parseInt(controls.valorRecaudo.val())
      : 0,
  };

  console.log(datoscoti);

  //Si todo esta Correcto...
  verificador(); // Limpiamos cualquier verificación previa

  const loader = new ChangeElementContenWhileLoading(controls.btnCotizarGlobal);
  loader.init();

  const responseApi = await cotizarApi(datoscoti);
  configuracionesDestinoActual = await cargarConfiguracionesCiudad(
    datoscoti.daneCityDestination
  );

  if (estado_prueba) {
    demoPruebaCotizadorAntiguo(datoscoti)
      .then(() => {
        console.log("El demo funciona perfectamente");
        const comparativeTester = testComparePrices(controls.tipoEnvio.val());
        datoscoti.ciudadOrigen = ciudadR.ciudad + "-" + ciudadR.departamento;
        datoscoti.ciudadDestino = ciudadD.ciudad + "-" + ciudadD.departamento;

        createExcelComparativePrices(datoscoti, comparativeTester);
      })
      .catch((e) => console.log("Error al correr el demo: ", e));
  }

  const response = responseApi.response;

  if (responseApi.code !== 200) {
    loader.end();
    Toast.fire("", "Hay un error de conexión, intenta mas tarde", "error");
    return;
  }

  console.warn(response, datoscoti.daneCityOrigin);

  const responseWithReputation = await addReputationToResponse(
    response,
    datoscoti.daneCityOrigin
  );

  mostrarListaTransportadoras(responseWithReputation);

  await guardarCotizacion();

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
  datos_a_enviar.correoR = datos_usuario.correo || "notiene@gmail.com";

  if (ControlUsuario.esPuntoEnvio) {
    datos_a_enviar.centro_de_costo_punto = datos_usuario.centro_de_costo;
  } else {
    datos_a_enviar.centro_de_costo = datos_usuario.centro_de_costo;
  }

  location.href = "#result_cotizacion";
}

async function cotizarApi(request) {
  const data = await fetch(v1.quoter, {
    method: "POST",
    headers: {
      "Content-Type": "Application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      redirect: "follow",
    },
    body: JSON.stringify(request),
  }).then((d) => d.json());

  return data;
}

function mostrarListaTransportadoras(respuestaCotizacion) {
  const mostradorTransp = [];
  const detallesTransp = [];

  respuestaCotizacion
    .sort((r) => (r.message ? 1 : -1)) // Los que devuelven error las dejamos de último
    .forEach((r, i) => {
      const { entity, total } = r;
      const transp = entity.toUpperCase();
      const configTransp = transportadoras[transp];
      const color = configTransp.color;
      const type = translation.typePayment[datoscoti.typePayment];
      r.type = type; // Para añadirlo a la etiqueta de la transportadora

      const cotizacion = new TranslatorFromApi(datoscoti, r);
      if (!configTransp.cotizacion) configTransp.cotizacion = new Object();
      configTransp.cotizacion[type] = cotizacion;

      let existeError = !!r.message;

      const configuracionCiudad = obtenerConfiguracionCiudad(transp, type);

      // Esto es hasta que se migren las configuraciones al api, se van a mostrar los bloqueos impuestos por la plataforma original (en caso de que existan)
      if (
        configuracionCiudad &&
        !configuracionCiudad.tipo_distribucion.length
      ) {
        console.warn(
          "Existe una configuración de bloqueo para esta ciudad destino para los parámetros indicados."
        );
        existeError = true;
        r.message = configuracionCiudad.descripcion
          ? configuracionCiudad.descripcion
          : "No hay cobertura para este destino";
      }

      const encabezado = existeError
        ? tarjetaErrorTransportadora(configTransp, r)
        : tarjetaBasicaTransportadora(configTransp, r);

      const precioPuntoEnvio = ControlUsuario.esPuntoEnvio
        ? `
          <div class="card my-3 shadow-sm">
              <div class="card-body">
                  <h5 class="card-title">Comisión Punto</h5>
                  <p class="card-text d-flex justify-content-between">Comisión punto <b>$${convertirMiles(
                    r.commission_point
                  )}</b></p>
              </div>
          </div>
      `
        : "";

      const detalle = `<div class="tab-pane fade ${
        i === 0 ? "show active" : ""
      }" 
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

      if (!existeError) {
        detallesTransp.push(detalle);
      }
    });

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
  $(".detalles", containerListTransports).on(
    "click",
    verDetallesTransportadora
  );

  $("#list-transportadoras", mostrador)
    .children()
    .each((i, el) => {
      el.addEventListener("click", seleccionarTransportadora);
    });
}

const exampleData = [
  {
    entity: "servientrega",
    deliveryTime: "1-2",
    declaredValue: 25000,
    flete: 13000,
    valueDeposited: 6925,
    transportCommission: 3000,
    hekaCommission: 2075,
    transportCollection: 25000,
    onlyToAddress: false,
    assured: 0,
    annotations:
      "El costo se calcula desde 3 kg para ofrecerte la mejor tarifa posible",
    total: 18075,
    version: "1",
    costReturnHeka: 50000,
    costReturn: 0,
    additional_commission: 0,
    commissionPoint: 0,
  },
  {
    entity: "interrapidisimo",
    deliveryTime: "3",
    declaredValue: 25000,
    flete: 11150,
    valueDeposited: 33900,
    transportCommission: 1500,
    hekaCommission: 2450,
    transportCollection: 50000,
    onlyToAddress: false,
    assured: 1000,
    annotations: "",
    total: 16100,
    version: "1",
    costReturnHeka: 50000,
    costReturn: 0,
    additional_commission: 0,
    commissionPoint: 0,
  },
  {
    entity: "envia",
    deliveryTime: 1,
    declaredValue: 25000,
    flete: 12700,
    valueDeposited: 5475,
    transportCommission: 2500,
    hekaCommission: 2075,
    transportCollection: 25000,
    onlyToAddress: true,
    assured: 2250,
    annotations: "",
    total: 19525,
    version: "1",
    costReturnHeka: 50000,
    costReturn: 0,
    additional_commission: 0,
    commissionPoint: 0,
  },
  {
    entity: "coordinadora",
    deliveryTime: "2",
    declaredValue: 25000,
    flete: 11650,
    valueDeposited: 80315,
    transportCommission: 4300,
    hekaCommission: 3200,
    transportCollection: 100000,
    onlyToAddress: true,
    assured: 535,
    annotations: "",
    total: 19685,
    version: "1",
    costReturnHeka: 50000,
    costReturn: 0,
    additional_commission: 0,
    commissionPoint: 0,
  },
];
