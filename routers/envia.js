const express = require("express");
const Handlebars = require("handlebars");

const router = express.Router();
const {cotizar, crearGuia, obtenerStickerGuia, imprimirMaifiesto} = require("../controllers/envia");

router.post("/cotizar/:type", cotizar);
router.post("/crearGuia", crearGuia);
router.post("/obtenerStickerGuia", obtenerStickerGuia);
router.post("/imprimirManifiesto", imprimirMaifiesto);

Handlebars.registerHelper("index", context => {
    return context + 1;
});

module.exports = router;