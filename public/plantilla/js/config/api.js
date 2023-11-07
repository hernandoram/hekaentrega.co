const endpoint = "https://hekaentrega.co/Api";
// const endpoint = "http://localhost:6201/Api";

const pathCiudades = endpoint + "/Ciudades";
const pathCiudadesLista = pathCiudades + "/Lista";
const pathCiudadDane = pathCiudades + "/CiudadDane";
const pathEstadisticasCiudad = pathCiudades + "/Estadisticas";

export {
    pathCiudadesLista,
    pathCiudadDane,
    pathEstadisticasCiudad
}