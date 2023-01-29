import { cargarOficinas, descargarInformeOficinasAdm } from "./oficinas/index.js";
import "./pagos/index.js";
import "./infoHeka/usuariosPorDiaDePago.js";
// import "./movimientoGuias/novedades.js";

$("#descargar-informe-oficinas").click(descargarInformeOficinasAdm);
$("#buscador-oficinas").click(cargarOficinas)