const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");
const PlateNumber = require("../model/PlateNumber");
const { uploadMultiple } = require("../utils/cloudinaryUploader");

exports.getData = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id }).select(
      "createdAt location description original"
    );
    const obstructions = await Obstruction.find({
      reporter: req.user.id,
    }).select("createdAt location description");

    const data = [...reports, ...obstructions].map((item) => ({
      createdAt: item.createdAt,
      location: item.location,
      description: item.description,
      original: item.original,
      _id: item._id,
      plateNumber: item.plateNumber ? true : false,
    }));

    res.status(200).json({ data: data });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error on Fetching Report Data" });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reports = await Report.find({ postIt: true, status: "Approved" })
      .skip((page - 1) * limit)
      .limit(Number(limit));
      
      const filteredReports = reports.map((report) => {
      const reportObject = report.toObject(); 
      delete reportObject.plateNumber; 
      return reportObject;
    });

    const obstructions = await Obstruction.find({
      postIt: true,
      status: "Approved",
    })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const data = [...filteredReports, ...obstructions];
    res.status(200).json({ data: data });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: "Error on Fetching All Report Data" });
  }
};

exports.getAllDataApproved = async (req, res) => {
  try {
    const report = await PlateNumber.aggregate([
      {
        $lookup: {
          from: "reports",
          localField: "violations.report",
          foreignField: "_id",
          as: "reportDetails",
        },
      },
      {
        $addFields: {
          reportDetails: {
            $filter: {
              input: "$reportDetails",
              as: "detail",
              cond: { $ne: ["$$detail.status", "Disapproved"] },
            },
          },
          violations: {
            $filter: {
              input: "$violations",
              as: "violation",
              cond: {
                $in: ["$$violation.report", "$reportDetails._id"],
              },
            },
          },
        },
      },
      {
        $match: {
          "reportDetails.status": { $ne: "Pending" },
          count: { $gt: 0 },
        },
      },
    ]);
    const data = [...report];
    res.status(200).json({ data: data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error on Fetching All Approved Data" });
  }
};

exports.getAllDataApprovedObstruction = async (req, res) => {
  try {
    const data = await Obstruction.find({ status: "Approved" });
    res.status(200).json({ data: data });
  } catch (erro) {
    console.error(error);
    res.status(500).json({ message: "Error on Fetching All Approved Data" });
  }
};

exports.updateStatusResolved = async (req, res) => {
  try {
    const { status, reportId, plateId } = req.body;
    const images = await uploadMultiple(req.files, "ConfirmationImages");

    // Update the status of the reports to "Resolved"
    await Report.updateMany(
      { _id: { $in: reportId } },
      { status: status, confirmationImages: images }
    );

    await PlateNumber.deleteById(plateId);

    res.status(200).json({ message: "Status Updated to Resolved" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error on Updating Status to Resolved" });
  }
};
