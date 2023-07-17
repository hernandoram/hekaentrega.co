const express = require("express");
const { logoLight, logoDark, logoNeutral } = require("../controllers/static");

const router = express.Router();

router.get("/logo", logoNeutral)
router.get("/logoLight", logoLight)
router.get("/logoDark", logoDark)

module.exports = router;