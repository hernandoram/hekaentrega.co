const endpoint = "https://hekaentrega.co/Api";
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

const v1 = {
    quoter: "https://api.hekaentrega.co/Api" + "/v1/shipping/quoter"
}

export {
    pathCiudadesLista,
    pathCiudadDane,
    pathEstadisticasCiudad,
    pathCotizador,
    v0,
    v1
}