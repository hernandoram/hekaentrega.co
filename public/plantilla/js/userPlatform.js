import inicio from "./homeView/main.js";
import agregarBodega from "./bodegas/bodegas.js";
import "./historialGuias/main.js";
import { iniciarOpcionesCotizador, llenarBodegasCotizador, llenarProductos } from "./cotizador/index.js";

if(estado_prueba) {
    iniciarOpcionesCotizador();
    llenarBodegasCotizador();
    llenarProductos();
}

inicio();

$(".agregar-bodega").click(agregarBodega);