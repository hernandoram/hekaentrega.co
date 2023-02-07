const express = require("express");
const { consultarGuia, plantearSolucion } = require("../controllers/manejadorGuias");
const router = express.Router();
const multer = require("multer");
const up = multer();

router.get("/guia", consultarGuia);
router.post("/plantearSolucion", up.none(), plantearSolucion);

module.exports = router;