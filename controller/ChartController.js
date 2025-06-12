const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");
const PlateNumber = require("../model/PlateNumber");
const Offense = require("../model/Offense");

// 1. Reports per Status (Pie/Bar Chart)
exports.getReportsByStatus = async (req, res) => {
  try {
    const data = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Obstructions per Month (Line/Bar Chart)
exports.getObstructionsPerMonth = async (req, res) => {
  try {
    const data = await Obstruction.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Top Plate Numbers with Most Violations (Bar Chart)
exports.getTopPlateViolations = async (req, res) => {
  try {
    const data = await PlateNumber.find({})
      .sort({ count: -1 })
      .limit(5)
      .select("plateNumber count -_id");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopReporters = async (req, res) => {
  try {
    const data = await Report.aggregate([
      { $group: { _id: "$reporter", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          count: 1
        }
      }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlyViolationsByStatus = async (req, res) => {
  try {
    const data = await Report.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.month",
          statuses: {
            $push: { status: "$_id.status", count: "$count" }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};