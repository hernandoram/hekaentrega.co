const express = require("express");
const router = express.Router();
const actualizarMovimientosCtrl = require("../controllers/seguimientos.js").actualizarMovimientoCtrl;


router.post("/actualizarEstados/:type", actualizarMovimientosCtrl);

module.exports = router;