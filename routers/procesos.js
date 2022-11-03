const express = require("express");
const { imprimirRotuloPunto } = require("../controllers/flexii.js");
const router = express.Router();
const actualizarMovimientosCtrl = require("../controllers/seguimientos.js").actualizarMovimientoCtrl;


router.post("/actualizarEstados/:type", actualizarMovimientosCtrl);
router.get("/rotuloPunto/:id_heka", imprimirRotuloPunto);

module.exports = router;