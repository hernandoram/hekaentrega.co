const express = require("express");
const { consultarGuia } = require("../controllers/manejadorGuias");
const router = express.Router();

router.get("/guia", consultarGuia);

module.exports = router;