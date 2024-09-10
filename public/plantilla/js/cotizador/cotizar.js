import { cotizadorApiClassIdentifier } from "./constantes.js";
import { cotizadorApi } from "./cotizadorApi.js";
import { cotizadorFlexii } from "./cotizadorFlexii.js";

/**
 * Función encargada de redirigir la cotización, según el cotizador que se requiera según los parámetros que se ingresen
 * al botón que se ingrese
 * @param {Event} e
 */

export function cotizar(e) {
  datos_usuario.bodegas = nuevasBodegas;
  console.warn(datos_usuario);
  // Se analiza las clases que posee el botón para saber si se va autilizar el cotizador flexii
  // o el cotizador por defecto (que usa la forma convencional)
  console.log(e.target.classList);
  if (datos_usuario.type == "NATURAL-FLEXII") {
    cotizadorFlexii();
  } else {
    if(e.target.classList.contains(cotizadorApiClassIdentifier)) {
      cotizadorApi();
    } else {
      cotizador();
    }
  }
}
