const express = require("express");
const router = express.Router();
const {cotizar, crearGuia, obtenerStickerGuia} = require("../controllers/envia");

router.post("/cotizar/:type", cotizar);
router.post("/crearGuia", crearGuia);
router.post("/obtenerStickerGuia", obtenerStickerGuia);

module.exports = router;