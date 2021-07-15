const express = require("express");
const app = express();
const router = express.Router();
const request = require("request");
const bodyParser = require("body-parser");

router.post("/subirImagen", (req, res) => {
    console.log(req.params)
    res.send("Archivo cargado")
})

module.exports = router;