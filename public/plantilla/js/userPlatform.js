import inicio from "./homeView/main.js";
import agregarBodega from "./bodegas/bodegas.js";
import "./historialGuias/main.js";
import { iniciarOpcionesCotizador } from "./cotizador/index.js";
import { registroDesdePunto } from "./auth/register.js";
import { agregarObjetoDeEnvio } from "./auth/handlers.js";
import "./puntoEnvio/recibirPaquete.js";
import "./puntoEnvio/estadosFlexii.js";

// if(estado_prueba) {
// }
// #region Funciones para habilitar configuraciones báses del cotizador
iniciarOpcionesCotizador();
// #endregion

inicio();

$(".agregar-bodega").click(agregarBodega);
$("#register-form").on("submit", registroDesdePunto);

$("#register-add-objetos_envio").click(agregarObjetoDeEnvio);
$("#register-objetos_envio").on("keypress", agregarObjetoDeEnvio);


$("#imprimir_qr-usuario_punto").on("click", imprimirQrRegistrarUsuarioPunto);
function imprimirQrRegistrarUsuarioPunto() {
  const ficha = document.getElementById("contenedor-usuario_punto");
  const ventimp = window.open();
  
  ventimp.document.write(`<html><head>
        <meta charset="utf-8">

        <link rel="shortcut icon" type="image/png" href="img/heka entrega.png"/>

        <link href="css/sb-admin-2.min.css" rel="stylesheet">

        <title>Registro QR</title>
    </head><body>`);
  ventimp.document.write( ficha.innerHTML );
  ventimp.document.write("</body></html>");
  ventimp.document.close();
  ventimp.print();
  ventimp.close();

}