const router = require("express").Router();
const CommentController = require("../controller/commentController");
const { isAuthenticated } = require("../middleware/auth");

router.post("/:id/comment", isAuthenticated, CommentController.addCommentToReport);

module.exports = router;