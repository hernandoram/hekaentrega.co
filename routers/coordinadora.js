const express = require("express");

const router = express.Router();
const {cotizar, crearGuia, crearStickerGuia} = require("../controllers/coordinadora");

router.post("/cotizar/:type", cotizar);
router.post("/crearGuia", crearGuia);
router.post("/obtenerStickerGuia", crearStickerGuia);

module.exports = router;