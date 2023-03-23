const express = require("express");

const router = express.Router();
const {cotizar} = require("../controllers/coordinadora");

router.post("/cotizar/:type", cotizar);

module.exports = router;