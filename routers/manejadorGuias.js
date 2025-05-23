const express = require("express");
const { consultarGuia, plantearSolucion, htmlSeguimientoPaqueteLogisticaPropia } = require("../controllers/manejadorGuias");
const { consultarGuiaApi } = require("../controllers/manejadorGuiasApi");
const router = express.Router();
const multer = require("multer");
const up = multer();

router.get("/guia", consultarGuia);
router.get("/guia_api", consultarGuiaApi);
router.get("/seguimientoPaquete", htmlSeguimientoPaqueteLogisticaPropia);
router.post("/plantearSolucion", up.none(), plantearSolucion);

module.exports = router;