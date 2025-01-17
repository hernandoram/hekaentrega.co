import { db } from "/js/config/initializeFirebase.js";
export const formularioPrincipal = $("#form-gestionar_pagos");
export const errorContainer = $("#errores-gestionar_pagos");
export const visor = $("#visor_gestionar_pagos");

export const btnCargarPagos = $("#btn-cargar_gestionar_pagos");
export const btnGestionar = $("#btn-gestionar_gestionar_pagos");
export const checkFiltFecha = $("#fecha-gestionar_pagos");
export const inpFiltGuia = $("#filtro_guia-gestionar_pagos");
export const inpFiltUsuario = $("#filtro-usuario-gestionar_pagos");
export const inpFiltEspecial = $("#filtro_especial-gestionar_pagos");
export const inpFiltnumeroGuia = $("#filtro-guia-gestionar_pagos");
export const selFiltDiaPago = $("#filtro_tipo_pagos-gestionar_pagos");
export const checkShowNegativos = $("#filtro_deudor-gestionar_pagos");
export const checkActivadorFactura = $("#activador_facturacion-gestionar_pagos");

export const nameCollectionDb = "pendientePorPagar";

export const camposExcel = {
    numeroGuia: "GUIA",
    remitente: "REMITENTE",
    transportadora: "TRANSPORTADORA",
    cuenta_responsable: "CUENTA RESPONSABLE",
    comision_heka: "COMISION HEKA",
    comision_natural_heka: "comision_natural_heka",
    iva: "iva",
    comision_transp: "comision_transportadora",
    cuatro_x_mil_transp: "cuatro_x_mil_transp",
    cuatro_x_mil_banc: "cuatro_x_mil_banco",
    recaudo: "RECAUDO",
    envio_total: "ENVÍO TOTAL",
    total_pagar: "TOTAL A PAGAR",
    fecha: "FECHA",
    filtro_especial: "filtro_especial"
}

const codigos_banco_siigo = {
    "BANCO DE BOGOTA": 1001,
    "BANCO POPULAR": 1002,
    "ITAU antes Corpbanca": 1006,
    "BANCOLOMBIA": 1007,
    "CITIBANK": 1009,
    "BANCO GNB SUDAMERIS": 1012,
    "BBVA COLOMBIA": 1013,
    "ITAU": 1014,
    "SCOTIABANK COLPATRIA S.A": 1019,
    "BANCO DE OCCIDENTE": 1023,
    "BANCOLDEX S.A.": 1031,
    "BANCO CAJA SOCIAL BCSC SA": 1032,
    "BANCO AGRARIO": 1040,
    "BANCO MUNDO MUJER": 1047,
    "BANCO DAVIVIENDA SA": 1051,
    "BANCO AV VILLAS": 1052,
    "BANCO W S.A.": 1053,
    "BANCO DE LAS MICROFINANZAS - BANCAMIA S.A.": 1059,
    "BANCO PICHINCHA": 1060,
    "BANCOOMEVA": 1061,
    "BANCO FALABELLA S.A.": 1062,
    "BANCO FINANDINA S.A.": 1063,
    "BANCO SANTANDER DE NEGOCIOS COLOMBIA S.A": 1065,
    "BANCO COOPERATIVO COOPCENTRAL": 1066,
    "MIBANCO S.A.": 1067,
    "BANCO SERFINANZA S.A": 1069,
    "LULO BANK S.A.": 1070,
    "BANCO J.P. MORGAN COLOMBIA S.A.": 1071,
    "ASOPAGOS S.A.S": 1086,
    "FINANCIERA JURISCOOP S.A. COMPAÑIA DE FINANCIAMIENTO": 1121,
    "RAPPIPAY DAVIplata": 1151,
    "COOPERATIVA FINANCIERA DE ANTIOQUIA": 1283,
    "PIBANK": 1560,
    "JFK COOPERATIVA FINANCIERA": 1286,
    "COOTRAFA COOPERATIVA FINANCIERA": 1289,
    "COOFINEP COOPERATIVA FINANCIERA": 1291,
    "CONFIAR COOPERATIVA FINANCIERA": 1292,
    "BANCO UNION S.A": 1303,
    "COLTEFINANCIERA S.A": 1370,
    "NEQUI": 1507,
    "DAVIPLATA": 1551,
    "BANCO CREDIFINANCIERA SA.": 1558,
    "IRIS": 1637,
    "MOVII": 1801,
    "DING TECNIPAGOS SA": 1802,
    "UALA": 1804,
    "BANCO BTG PACTUAL": 1805,
    "RAPPIPAY ": 1811,
    "LULO BANK S.A.": 1070,
}

export const codigos_banco = {
    "Bancolombia(Desembolso: $0)": codigos_banco_siigo.BANCOLOMBIA,
    "Nequi(desembolso: $0)": codigos_banco_siigo.NEQUI,
    "Banco de bogotá(Desembolso: $7.500)": codigos_banco_siigo["BANCO DE BOGOTA"],
    "Banco popular(Desembolso: $7.500)": codigos_banco_siigo["BANCO POPULAR"],
    "Itaú(Desembolso: $7.500)": codigos_banco_siigo.ITAU,
    "Citibank(Desembolso: $7.500)": codigos_banco_siigo.CITIBANK,
    "BBVA(Desembolso: $7.500)": codigos_banco_siigo["BBVA COLOMBIA"],
    "Colpatria(Desembolso: $7.500)": codigos_banco_siigo["SCOTIABANK COLPATRIA S.A"],
    "Banco de occidente(Desembolso: $7.500)": codigos_banco_siigo["BANCO DE OCCIDENTE"],
    "Banco caja social(Desembolso: $7.500)": codigos_banco_siigo["BANCO CAJA SOCIAL BCSC SA"],
    "Banco Agrario(Desembolso: $7.500)": codigos_banco_siigo["BANCO AGRARIO"],
    "Banco davivienda(Desembolso: $7.500)": codigos_banco_siigo["BANCO DAVIVIENDA SA"],
    "Banco Av Villas (Desembolso: $7.500)": codigos_banco_siigo["BANCO AV VILLAS"],
    "Banco Pichincha(Desembolso: $7.500)": codigos_banco_siigo["BANCO PICHINCHA"],
    "Bancoomeva(Desembolso: $7.500)": codigos_banco_siigo.BANCOOMEVA,
    "Banco Falabella (Desembolso: $7.500)": codigos_banco_siigo["BANCO FALABELLA S.A."],
    "Daviplata (Desembolso: $7.500)": codigos_banco_siigo.DAVIPLATA,
    "Lulo Bank (Desembolso: $7.500)": codigos_banco_siigo["LULO BANK S.A."],
}