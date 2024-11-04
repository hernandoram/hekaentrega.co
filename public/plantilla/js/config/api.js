const endpoint = "/Api"; // Esta ruta no se encuentra directamente sobre este proyecto, pero pertenecerà al mismo dominio
// const endpoint = "http://localhost:6201/Api";
//const endpoint = "https://admin.hekaentrega.co/Api";

const pathCiudades = endpoint + "/Ciudades";
const pathCiudadesLista = pathCiudades + "/Lista";
const pathCiudadDane = pathCiudades + "/CiudadDane";
const pathEstadisticasCiudad = pathCiudades + "/Estadisticas";

const pathCotizador = endpoint + "/Heka/Cotizar";

const v0 = {
    pathCiudadesLista,
    pathCiudadDane,
    pathEstadisticasCiudad,
    pathCotizador,
    seguimientoEnvios: endpoint + "/Envios/Seguimiento",
    pdfRelacionEnvio: endpoint + "/Pdf/RelacionEnvios"
}

// const endpointV1 = "https://api.hekaentrega.co/Api/v1";
const endpointV1 = PROD_API_URL + "/Api/v1";
const v1 = {
  endpoint: endpointV1,
  quoter: endpointV1 + "/shipping/quoter",
  cities: endpointV1 + "/geolocation/city",
};

export {
  pathCiudadesLista,
  pathCiudadDane,
  pathEstadisticasCiudad,
  pathCotizador,
  v0,
  v1,
};
