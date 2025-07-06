const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");

exports.getTopReporters = async (req, res) => {
  try {
    const data = await Report.aggregate([
      {
        $match: {
          status: { $in: ["Approved", "Resolved"] },
          reporter: { $exists: true, $ne: null }, // Ensure reporter exists
        },
      },
      {
        $group: {
          _id: "$reporter",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true, // Handle cases where user might not exist
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $cond: {
              if: { $ifNull: ["$user", false] },
              then: { $concat: ["$user.firstName", " ", "$user.lastName"] },
              else: "Anonymous",
            },
          },
          count: 1,
        },
      },
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
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          statuses: {
            $push: { status: "$_id.status", count: "$count" },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportsByTimeOfDay = async (req, res) => {
  try {
    const data = await Report.aggregate([
      {
        $project: {
          hour: { $hour: "$createdAt" },
        },
      },
      {
        $bucket: {
          groupBy: "$hour",
          boundaries: [0, 3, 6, 9, 12, 15, 18, 21, 24],
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "12AM-3AM" },
                { case: { $eq: ["$_id", 3] }, then: "3AM-6AM" },
                { case: { $eq: ["$_id", 6] }, then: "6AM-9AM" },
                { case: { $eq: ["$_id", 9] }, then: "9AM-12PM" },
                { case: { $eq: ["$_id", 12] }, then: "12PM-3PM" },
                { case: { $eq: ["$_id", 15] }, then: "3PM-6PM" },
                { case: { $eq: ["$_id", 18] }, then: "6PM-9PM" },
                { case: { $eq: ["$_id", 21] }, then: "9PM-12AM" },
              ],
              default: "Unknown",
            },
          },
          value: "$count",
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportTypes = async (req, res) => {
  try {
    const illegalParkingCount = await Report.countDocuments();
    const obstructionCount = await Obstruction.countDocuments();

    const data = [
      { name: "Illegal Parking", value: illegalParkingCount },
      { name: "Obstruction", value: obstructionCount },
    ];

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
