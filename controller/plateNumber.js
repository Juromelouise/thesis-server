const plateNumber = require("../model/PlateNumber");

exports.changeViolation = async (req, res) => {
  try {
    const { violations } = req.body;
    const plate = await plateNumber.findOneAndUpdate(
      { "violations.report": req.params.id },
      { $set: { "violations.$.types": violations } },
      { new: true }
    );
    res.status(200).json({ report: plate });
  } catch (error) {
    console.error("Error updating violations:", error);
    res.status(500).json({ message: "Failed to update violations." });
  }
};

exports.getAllPlateNumbers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const plateNumbers = await plateNumber
      .find({ count: { $gt: 0 } })
      .select("plateNumber violations.types count")
      .lean();

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPlateNumbers = plateNumbers.slice(startIndex, endIndex);

    res.status(200).json({
      data: paginatedPlateNumbers,
      totalItems: plateNumbers.length,
      totalPages: Math.ceil(plateNumbers.length / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getting all plate numbers:", error);
    res.status(500).json({ message: "Failed to get all plate numbers." });
  }
};

exports.getPlateNumber = async (req, res) => {
  try {
    const data = await plateNumber.findById(req.params.id).populate({
      path: 'violations.report',
      select: 'status'
    }).lean();

    data.violations = data.violations.map(violation => ({
      ...violation,
      status: violation.report.status,
      id: violation.report._id,
      report: undefined
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error("Error getting plate number:", error);
    res.status(500).json({ message: "Failed to get plate number." });
  }
};