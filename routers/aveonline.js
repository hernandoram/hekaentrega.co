const express = require("express");
const router = express.Router();
const aveoCtrl = require("../controllers/aveonline");

router.get("/auth", aveoCtrl.auth);

router.get("/cotizar/:origen/:destino/:peso/:recaudo/:valorDeclarado/:type", 
aveoCtrl.auth, 
aveoCtrl.cotizar);

router.post("/crearGuia", aveoCtrl.auth, aveoCtrl.crearGuia);
router.get("/crearRelacion", aveoCtrl.auth, aveoCtrl.generarRelacion);

module.exports = router;