import { cargarOficinas, descargarInformeOficinasAdm } from "./oficinas/index.js";
import "./pagos/index.js";

$("#descargar-informe-oficinas").click(descargarInformeOficinasAdm);
$("#buscador-oficinas").click(cargarOficinas)