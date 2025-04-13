const router = require("express").Router();

const {
  createAnnouncement,
  showAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  showAnnouncementById
} = require("../controller/announcementController");
const { isAuthenticated, Admin } = require("../middleware/auth");
const upload = require("../utils/multer");

router.get("/show", showAnnouncement);
router.get("/show/:id", showAnnouncementById);
router.post("/create",upload.array("images", 10), isAuthenticated, Admin, createAnnouncement);

module.exports = router;
