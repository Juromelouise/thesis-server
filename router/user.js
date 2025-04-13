const router = require("express").Router();
const upload = require("../utils/multer");

const {
  registerUser,
  loginUser,
  logout,
  profile,
  updateProfile,
  updatePushToken
} = require("../controller/userController");

const { isAuthenticated } = require("../middleware/auth");

router.post("/register", upload.single("avatar", 1), registerUser);
router.get("/logout", logout);
router.get("/profile", isAuthenticated, profile);
router.post("/login", loginUser);
router.put("/profile", isAuthenticated, upload.single("avatar", 1), updateProfile);
router.put("/update-push-token", isAuthenticated, updatePushToken);

module.exports = router;
