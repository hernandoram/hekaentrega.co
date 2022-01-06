const express = require("express");
const app = express();
const router = express.Router();
const cellvozCtrl = require("../controllers/cellVoz");

router.get("/sendMessage", cellvozCtrl.sendMessage);

module.exports = router;