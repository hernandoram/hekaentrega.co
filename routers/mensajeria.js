const express = require("express");
const app = express();
const router = express.Router();
const cellvozCtrl = require("../controllers/cellVoz");
const birdCtrl = require("../controllers/messageBird");

router.get("/sendMessage", cellvozCtrl.sendMessage);
router.get("/ws/sendMessage", birdCtrl.singleMessageCtrl)
router.post("/ws/sendMessage/:templateName", birdCtrl.templateMessageCtrl)

module.exports = router;