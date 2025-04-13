const router = require("express").Router();
const upload = require("../utils/multer");
const { imageExtract } = require("../service/tesseract");
const { translator } = require("../service/translator");
const { classifyReport } = require("../service/classifier");
const {
  createReport,
  updateReport,
  deleteReport,
  getAllDataAdmin,
  getSingleReport,
  updateReportStatus,
  // editableStatus,
} = require("../controller/reportController");
const { isAuthenticated, Admin } = require("../middleware/auth");
const {
  createObstruction,
  updateObstruction,
  deleteObstruction,
  getAllobstructions,
  getSingleObstruction,
  editableStatusObs,
  updateObstructionViolations,
} = require("../controller/obstructionController");
const {
  getData,
  getAllData,
  getAllDataApproved,
  updateStatusResolved,
  getAllDataApprovedObstruction,
} = require("../controller/obsrepController");

//POST
router.post("/extract/text", upload.single("imageReport"), imageExtract);
router.post(
  "/post/report",
  upload.array("images"),
  isAuthenticated,
  translator,
  classifyReport,
  createReport
);
router.post(
  "/post/obstruction",
  upload.array("images"),
  isAuthenticated,
  translator,
  classifyReport,
  createObstruction
);
//GET
router.get("/fetch/all", isAuthenticated, getData);
router.get("/fetch/all/reports", getAllData);
//PUT
router.put(
  "/update/report/:id",
  upload.array("images"),
  isAuthenticated,
  translator,
  classifyReport,
  updateReport
);
router.put(
  "/update/obstruction/:id",
  upload.array("images"),
  isAuthenticated,
  translator,
  classifyReport,
  updateObstruction
);
//delete
router.delete("/delete/report/:id", isAuthenticated, deleteReport);
router.delete("/delete/obstruction/:id", isAuthenticated, deleteObstruction);

//ADMIN
router.get("/admin/report", isAuthenticated, Admin, getAllDataAdmin);
router.get("/admin/obstruction", isAuthenticated, Admin, getAllobstructions);
router.get("/admin/report/:id", isAuthenticated, getSingleReport);
router.get(
  "/admin/report/report/approved",
  isAuthenticated,
  Admin,
  getAllDataApproved
);
router.get(
  "/admin/obstruction/report/approved",
  isAuthenticated,
  Admin,
  getAllDataApprovedObstruction
);
router.get(
  "/admin/obstruction/:id",
  isAuthenticated,
  // Admin,
  getSingleObstruction
);

//PUT
router.put(
  "/admin/report/status/:id",
  isAuthenticated,
  Admin,
  updateReportStatus,
);
router.put(
  "/admin/obstruction/status/:id",
  isAuthenticated,
  Admin,
  editableStatusObs
);
router.put(
  "/admin/obstruction/violations/:id",
  isAuthenticated,
  Admin,
  updateObstructionViolations
);
router.put(
  "/update-status/:id",
  upload.array("images", 2),
  isAuthenticated,
  Admin,
  updateStatusResolved
);

module.exports = router;
