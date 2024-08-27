const endpoint = "https://admin.hekaentrega.co/Api";
// const endpoint = "http://localhost:6201/Api";

const pathCiudades = endpoint + "/Ciudades";
const pathCiudadesLista = pathCiudades + "/Lista";
const pathCiudadDane = pathCiudades + "/CiudadDane";
const pathEstadisticasCiudad = pathCiudades + "/Estadisticas";

const pathCotizador = endpoint + "/Heka/Cotizar";

const v0 = {
    pathCiudadesLista,
    pathCiudadDane,
    pathEstadisticasCiudad,
    pathCotizador
}

const endpointV1 = "https://api.hekaentrega.co/Api/v1";
const v1 = {
    endpoint: endpointV1,
    quoter: endpointV1 + "/shipping/quoter",
    cities: endpointV1 + "/geolocation/city"
}

export {
    pathCiudadesLista,
    pathCiudadDane,
    pathEstadisticasCiudad,
    pathCotizador,
    v0,
    v1
}