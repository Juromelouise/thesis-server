const router = require("express").Router();
const { getAllStreets, putStreet, streetColor, deleteStreet, getAllStreetName} = require("../controller/streetController");

router.get("/street", getAllStreets);
router.get("/street/import", putStreet);
router.get("/street/merge", streetColor);
router.delete("/street/merge", deleteStreet);
router.get("/street/names", getAllStreetName);

module.exports = router;
