const router = require("express").Router();
const { getCoordinates } = require("../controller/MapController");

router.get("/coordinates", getCoordinates);

module.exports = router;
