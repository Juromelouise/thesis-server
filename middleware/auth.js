const User = require("../model/User");
const jwt = require("jsonwebtoken");

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Login first to access this resource" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    console.error("Error in isAuthenticated middleware: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.Admin = async (req, res, next) => {
  if (req.user.role !== "admin" || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};
