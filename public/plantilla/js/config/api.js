const PROD_API_URL = window.ENV.ENVIRONMENT_NAME; //comentar o descomentar segun el ambiente
// const endpoint = "/Api"; // Esta ruta no se encuentra directamente sobre este proyecto, pero pertenecerà al mismo dominio
const endpoint = "http://localhost:6201/Api";
// const endpoint = "https://admin.hekaentrega.co/Api";

const pathCiudades = endpoint + "/Ciudades";
const pathCiudadesLista = pathCiudades + "/Lista";
const pathCiudadDane = pathCiudades + "/CiudadDane";
const pathEstadisticasCiudad = pathCiudades + "/Estadisticas";

const pathCotizador = endpoint + "/Cotizador";

const v0 = {
    pathCiudadesLista,
    pathCiudadDane,
    pathEstadisticasCiudad,
    pathCotizador,
    seguimientoEnvios: endpoint + "/Envios/Seguimiento",
    pdfRelacionEnvio: endpoint + "/Pdf/RelacionEnvios",
    pathRutaMensajero: endpoint + "/Envios/RutaEntrega/mensajero",
    pathRutaentrega: endpoint + "/Envios/RutaEntrega",
    pathEstadosNotificacion: endpoint + "/EstadosNotificacion",
}

// const endpointV1 = "https://api.hekaentrega.co/Api/v1";
const endpointV1 = PROD_API_URL + "/Api/v1";
const v1 = {
  endpoint: endpointV1,
  quoter: endpointV1 + "/shipping/quoter",
  cities: endpointV1 + "/geolocation/city",
  user_segmentation: endpointV1 + "/users/segmentation",
  sendDocument: endpointV1 + "/tools/send-document"
};

export {
  pathCiudadesLista,
  pathCiudadDane,
  pathEstadisticasCiudad,
  pathCotizador,
  v0,
  v1,
};
