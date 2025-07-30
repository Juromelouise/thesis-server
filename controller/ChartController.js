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

exports.getYearlyViolations = async (req, res) => {
  try {
    const [reports, obstructions] = await Promise.all([
      Report.aggregate([
        {
          $group: {
            _id: { $year: "$createdAt" },
            reportCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Obstruction.aggregate([
        {
          $group: {
            _id: { $year: "$createdAt" },
            obstructionCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const years = [
      ...new Set([
        ...reports.map((r) => r._id),
        ...obstructions.map((o) => o._id),
      ]),
    ].sort();

    const data = years.map((year) => {
      const report = reports.find((r) => r._id === year) || { reportCount: 0 };
      const obstruction = obstructions.find((o) => o._id === year) || {
        obstructionCount: 0,
      };

      return {
        year,
        reportCount: report.reportCount,
        obstructionCount: obstruction.obstructionCount,
        total: report.reportCount + obstruction.obstructionCount,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuarterlyViolations = async (req, res) => {
  try {
    const { year } = req.query;
    const match = {};
    if (year) {
      match.createdAt = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`),
      };
    }

    const [reports, obstructions] = await Promise.all([
      Report.aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: {
              quarter: {
                $ceil: { $divide: [{ $month: "$createdAt" }, 3] }
              },
              year: { $year: "$createdAt" }
            },
            reportCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.quarter": 1 } },
      ]),
      Obstruction.aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: {
              quarter: {
                $ceil: { $divide: [{ $month: "$createdAt" }, 3] }
              },
              year: { $year: "$createdAt" }
            },
            obstructionCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.quarter": 1 } },
      ]),
    ]);

    const quarters = [1, 2, 3, 4];
    const data = reports.map(report => {
      const obstruction = obstructions.find(o => 
        o._id.quarter === report._id.quarter && 
        o._id.year === report._id.year
      ) || { obstructionCount: 0 };
      
      return {
        quarter: report._id.quarter,
        year: report._id.year,
        reportCount: report.reportCount,
        obstructionCount: obstruction.obstructionCount,
        total: report.reportCount + obstruction.obstructionCount
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllViolations = async (req, res) => {
  try {
    const [reports, obstructions] = await Promise.all([
      Report.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            reportCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Obstruction.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            obstructionCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const periods = [
      ...new Set([
        ...reports.map((r) => `${r._id.year}-${r._id.month}`),
        ...obstructions.map((o) => `${o._id.year}-${o._id.month}`),
      ]),
    ].sort();

    const data = periods.map((period) => {
      const [year, month] = period.split("-").map(Number);
      const report = reports.find(
        (r) => r._id.year === year && r._id.month === month
      ) || { reportCount: 0 };
      const obstruction = obstructions.find(
        (o) => o._id.year === year && o._id.month === month
      ) || { obstructionCount: 0 };

      return {
        year,
        month,
        reportCount: report.reportCount,
        obstructionCount: obstruction.obstructionCount,
        total: report.reportCount + obstruction.obstructionCount,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableYears = async (req, res) => {
  try {
    const reportYears = await Report.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" }
        }
      },
      {
        $project: {
          year: "$_id"
        }
      }
    ]);
    
    const obstructionYears = await Obstruction.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" }
        }
      },
      {
        $project: {
          year: "$_id"
        }
      }
    ]);

    const years = [
      ...new Set([
        ...reportYears.map((item) => item.year),
        ...obstructionYears.map((item) => item.year),
      ]),
    ].sort((a, b) => b - a);

    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};