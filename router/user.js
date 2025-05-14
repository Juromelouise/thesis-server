const router = require("express").Router();
const upload = require("../utils/multer");

const {
  registerUser,
  loginUser,
  logout,
  profile,
  updateProfile,
  updatePushToken,
  getAllUsers,
  unbanUser,
  banUser
} = require("../controller/userController");

const { isAuthenticated } = require("../middleware/auth");

router.post("/register", upload.single("avatar", 1), registerUser);
router.get("/logout", logout);
router.get("/profile", isAuthenticated, profile);
router.post("/login", loginUser);
router.put("/profile", isAuthenticated, upload.single("avatar", 1), updateProfile);
router.put("/update-push-token", isAuthenticated, updatePushToken);
router.get("/all-users", isAuthenticated, getAllUsers);
router.put("/ban-user/:id", isAuthenticated, banUser);
router.put("/unban-user/:id", isAuthenticated, unbanUser);

module.exports = router;
