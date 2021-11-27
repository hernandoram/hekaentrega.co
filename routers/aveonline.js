const express = require("express");
const router = express.Router();
const aveoCtrl = require("../controllers/aveonline");

router.get("/auth", aveoCtrl.auth);

router.post("/cotizar/:type", aveoCtrl.auth, aveoCtrl.cotizar);

router.post("/crearGuia", aveoCtrl.auth, aveoCtrl.crearGuia);
router.post("/generarManifiesto", aveoCtrl.auth, aveoCtrl.generarRelacion);
router.post("/obtenerStickerGuia", aveoCtrl.obtenerStickerGuia);
router.get("/imprimirManifiesto/:nro_manifiesto", aveoCtrl.consultarRelacion);

module.exports = router;