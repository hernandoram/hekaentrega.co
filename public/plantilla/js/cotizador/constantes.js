/**
 Muestra la lista de tipode de pagos disponibles, incluyendo las transportadoras en las que aplica
 * @property icon: Se encuentra en cotizador.js y es un texto del ícono qu ecorresponde
*/
export const paymentAdmited = [
    {
        title: "Pago en efectivo",
        icon: iconEfectivePayment,
        transportApplic: ["COORDINADORA", "SERVIENTREGA", "ENVIA", "INTERRAPIDISIMO"]
    },
    {
        title: "Pago por transferencia (QR)",
        icon: qrPayment,
        transportApplic: ["COORDINADORA"]
    },
    {
        title: "Pago a crédito",
        icon: creditPayment,
        transportApplic: ["COORDINADORA"]
    },
    {
        title: "Pago adelantado",
        icon: adelantedPayment,
        transportApplic: ["COORDINADORA"]
    },
];

export const cotizadorApiClassIdentifier = "cotizador-api";

export const controls = {
    sumaEnvio: $("#sumar_envio-cotizador"),
    tipoEnvio: $("#tipo_envio-cotizador"),
    valorRecaudo: $("#recaudo-cotizador"),
    btnCotizarGlobal: $(".cotizador-button")
}