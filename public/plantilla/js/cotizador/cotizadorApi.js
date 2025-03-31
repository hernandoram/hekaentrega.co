import { v1 } from "../config/api.js";
import { selectize } from "../consultarCiudades.js";
import { fetchApp2 } from "../utils/functions.js";
import { controls } from "./constantes.js";
import {
  TranslatorFromApi,
  cotizadorTemporalTransportadoraHeka,
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
  city_origin: "",
  city_destination: "",
  type_payment: 1,
  declared_value: 90000,
  weight: 1,
  height: "1",
  long: "1",
  width: "1",
  withshipping_cost: false,
  collection_value: 90000,
};
async function cotizadorApi() {
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
    city_origin: ciudadR.dane,
    city_destination: ciudadD.dane,
    type_payment: translation.type_paymentInt[controls.tipoEnvio.val()],
    declared_value: parseInt(value("seguro-mercancia")),
    weight: parseInt(value("Kilos")),
    height: parseInt(value("dimension-alto")),
    long: parseInt(value("dimension-largo")),
    width: parseInt(value("dimension-ancho")),
    withshipping_cost: controls.sumaEnvio.prop("checked"),
    collection_value: esPagoContraentrega
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
    datoscoti.city_destination
  );

  const response = responseApi.response;

  const responseInter = response.find(r => r.distributor_id === "interrapidisimo");
  if(responseInter && !responseInter.message) {
    const configuracionCiudadInter = await cargarConfiguracionesCiudadInter(datoscoti.city_destination, translation.type_payment[datoscoti.type_payment]);
    if(configuracionCiudadInter) {
      configuracionesDestinoActual.push(configuracionCiudadInter);
    }
  }

  const responseWithReputation = await addReputationToResponse(
    response,
    datoscoti.city_origin
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
      const { distributor_id, total } = r;
      const transp = distributor_id.toUpperCase();
      const configTransp = transportadoras[transp];
      const color = configTransp.color;
      const type = translation.type_payment[datoscoti.type_payment];
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
      id="list-transportadora-${distributor_id}" aria-labelledby="list-transportadora-${distributor_id}-list">
        <div class="card">
          <div class="card-header bg-${color} text-light">
            ${transp}
          </div>
          <div class="card-body">
            <div class="card my-3 shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Costo Transportadora</h5>
                <p class="card-text d-flex justify-content-between">Valor flete <b>$${convertirMiles(
                  r.visual_flete
                )}</b></p>
                <p class="card-text d-flex justify-content-between">Comisión transportadora <b>$${convertirMiles(
                  r.transport_commission
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
                  r.visual_heka_commission
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

async function buscarCiudadPorCodigoDane(dane) {
  return fetchApp2(`/Api/v1/geolocation/city?dane=${dane}&limit=1`)
  .deleteHeader("authorization")
  .send()
  .catch(e => {
    return {
      error: true,
      message: e.message
    }
  })
}

export { cotizadorApi, cotizarApi, buscarCiudadPorCodigoDane }