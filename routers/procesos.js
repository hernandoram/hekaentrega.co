const express = require("express");
const { imprimirRotuloPunto } = require("../controllers/flexii.js");
const { consultarCiudades, estadosFinalizacion, crearGuia, obtenerStickerGuia, actualizarMovimientos } = require("../controllers/heka.js");
const router = express.Router();
const actualizarMovimientosCtrl = require("../controllers/seguimientos.js").actualizarMovimientoCtrl;


router.post("/actualizarEstados/:type", actualizarMovimientosCtrl);
router.get("/rotuloPunto/:id_heka", imprimirRotuloPunto);
router.get("/ciudades", consultarCiudades);
router.get("/EstadosFinalizacion", estadosFinalizacion);
router.post("/crearGuia", crearGuia);
router.post("/obtenerStickerGuia", obtenerStickerGuia);
router.post("/actualizarEstado/:numeroGuia", actualizarMovimientos);

module.exports = router;