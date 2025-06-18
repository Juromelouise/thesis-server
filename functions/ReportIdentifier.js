const { createReport } = require("../controller/reportController");
const { createObstruction } = require("../controller/obstructionController");
exports.ReportIdentier = async (req, res) => {
  try {
    if (req.body.plateNumber && req.body.plateNumber.trim() !== "") {
      createReport(req, res);
    } else {
      createObstruction(req, res);
    }
  } catch (error) {
    console.error("Error fetching report identifier:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
