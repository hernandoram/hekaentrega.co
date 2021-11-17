const express = require("express");
const app = express();
const router = express.Router();
const interRouter = require("../controllers/inter");

router.get("/consultarGuia", interRouter.consultarGuia);

router.post("/crearGuia", interRouter.crearGuia);

router.get("/crearStickerGuia/:id", interRouter.crearStickerGuia);

router.get("/imprimirManifiesto/:guias", interRouter.imprimirManifiesto);


module.exports = router