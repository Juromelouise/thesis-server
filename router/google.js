const express = require("express");
const router = express.Router();

function isLoggin(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

const { google, mobile } = require("../controller/google");

router.post("/google", google);
router.post("/mobile/auth", mobile);

module.exports = router;
