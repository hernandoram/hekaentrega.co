export const db = firebase.firestore();
export const formularioPrincipal = $("#form-gestionar_pagos");
export const errorContainer = $("#errores-gestionar_pagos");
export const visor = $("#visor_gestionar_pagos");

export const btnCargarPagos = $("#btn-cargar_gestionar_pagos");
export const btnGestionar = $("#btn-gestionar_gestionar_pagos");
export const checkFiltFecha = $("#fecha-gestionar_pagos");
export const inpFiltUsuario = $("#filtro-usuario-gestionar_pagos");
export const inpFiltCuentaResp = $("#filtro-cuenta_responsable-gestionar_pagos");
export const inpFiltnumeroGuia = $("#filtro-guia-gestionar_pagos");
export const selFiltDiaPago = $("#filtro_tipo_pagos-gestionar_pagos");

export const nameCollectionDb = "pendientePorPagar";

export const camposExcel = {
    numeroGuia: "GUIA",
    remitente: "REMITENTE",
    transportadora: "TRANSPORTADORA",
    cuenta_responsable: "CUENTA RESPONSABLE",
    comision_heka: "COMISION HEKA",
    envio_total: "ENVÍO TOTAL",
    total_pagar: "TOTAL A PAGAR",
    fecha: "FECHA"
}