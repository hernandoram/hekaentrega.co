const express = require("express");
const { auth, crearFactura, tipoDocumentos, usuarios, tiposPago, pdfFacturaVenta, taxes, impuestos } = require("../controllers/siigo.js");
const router = express.Router();

router.post("/crearFactura", auth, crearFactura);
router.get("/pdfFactura/:id_factura", auth, pdfFacturaVenta);

router.get("/tipoDocumentos", auth, tipoDocumentos);
router.get("/usuarios", auth, usuarios);
router.get("/tiposPago", auth, tiposPago);
router.get("/taxes", auth, impuestos);

module.exports = router;