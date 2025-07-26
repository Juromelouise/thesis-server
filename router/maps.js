const router = require("express").Router();
const { getCoordinates, streetOccupiedMost} = require("../controller/MapController");

router.get("/coordinates", getCoordinates);
router.get("/street-occupied-most", streetOccupiedMost);

module.exports = router;
