const router = require("express").Router();

const {
  changeViolation,
  getAllPlateNumbers,
  getPlateNumber,
} = require("../controller/plateNumber");
const { isAuthenticated, Admin } = require("../middleware/auth");

router.put(
  "/admin/report/violations/:id",
  isAuthenticated,
  Admin,
  changeViolation
);
router.get(
  "/admin/platenumbers",
  isAuthenticated,
  Admin,
  getAllPlateNumbers
);
router.get(
  "/admin/platenumbers/:id",
  isAuthenticated,
  Admin,
  getPlateNumber
);

module.exports = router;
