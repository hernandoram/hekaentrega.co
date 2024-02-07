const cron = require('node-cron');
const { actualizarMovimientos, actualizarMovimientosSemanales, ocultarOficinas } = require("../controllers/seguimientos");
var firebase = require("../keys/firebase");

cron.schedule("00 */6 * * *", () => {
    let d = new Date();
    console.log("Se vana a ctualizar los movimientos de las guías: ", d);
    actualizarMovimientos().then((detalles) => {
        console.log(detalles);
        firebase.firestore().collection("reporte").add(detalles);
    });
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo" // Para cambiar los tiempos de sincronización
});

cron.schedule("0 0 * * 0", () => {
    let d = new Date();
    console.log("Se vana a ctualizar los movimientos semanales de las guías: ", d);

    const messageActualizacionSolicitudPagos = "";

    // Reiniciar limitador de pagos diarios
    firebase.firestore().collection("infoHeka").doc("manejoUsuarios")
        .update({ limitadosDiario: [] })
        .then(() => {
            messageActualizacionSolicitudPagos = "Actualización de la lista de limitados diario vaciada correctamente"
        })
        .catch(e => {
            messageActualizacionSolicitudPagos = "Error al actulizar los limitados diarios: " + e.message;
        })

    actualizarMovimientosSemanales().then((detalles) => {
        detalles.mensajeLimpiezaLimitadosDiario = messageActualizacionSolicitudPagos;
        detalles.actualización_semanal = true;
        firebase.firestore().collection("reporte").add(detalles);
    });
});

cron.schedule("0 0 * * 0", () => {
    ocultarOficinas();
});