const router = require("express").Router();
const { getAllStreets, putStreet } = require("../controller/streetController");

router.get("/street", getAllStreets);
router.get("/street/import", putStreet);

module.exports = router;
