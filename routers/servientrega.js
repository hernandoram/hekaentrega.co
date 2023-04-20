///SErvientrega
const express = require("express");
const router = express.Router();

const servientregaCtrl = require("../controllers/servientrega");


//A partir de aquí estarán todas las rutas
router.post("/cotizar", servientregaCtrl.cotizar)

router.post("/consultarGuia", servientregaCtrl.consultarGuia);

router.post("/estadoGuia", servientregaCtrl.estadoGuia);

router.post("/crearGuia", servientregaCtrl.crearGuia);

router.post("/generarGuiaSticker", servientregaCtrl.generarGuiaSticker)

router.post("/crearDocumentos", servientregaCtrl.crearDocumentos);

router.post("/generarManifiesto", servientregaCtrl.generarManifiesto);

module.exports = router;