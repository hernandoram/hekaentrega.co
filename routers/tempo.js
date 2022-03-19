const express = require("express");
const router = express.Router();
const tempoCtrl = require("../controllers/tempo");

router.get("/cotizar/:type", tempoCtrl.cotizar);

module.exports = router;
