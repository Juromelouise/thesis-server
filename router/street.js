const router = require("express").Router();
const { getAllStreets, putStreet, streetColor} = require("../controller/streetController");

router.get("/street", getAllStreets);
router.get("/street/import", putStreet);
router.get("/street/merge", streetColor);

module.exports = router;
