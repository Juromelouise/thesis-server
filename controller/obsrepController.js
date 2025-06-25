const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");
const PlateNumber = require("../model/PlateNumber");
const { uploadMultiple } = require("../utils/cloudinaryUploader");

exports.getData = async (req, res) => {
  try {
    const reports = await Report.findWithDeleted({
      reporter: req.user._id.toString(),
    }).select("createdAt location description original");

    const obstructions = await Obstruction.findWithDeleted({
      reporter: req.user._id.toString(),
    }).select("createdAt location description original");

    const data = await Promise.all(
      [...reports, ...obstructions].map(async (item) => {
        let hasPlateNumber = false;
        if (item._id) {
          const plate = await PlateNumber.findOneWithDeleted({
            "violations.report": item._id,
          }).select("_id");
          hasPlateNumber = !!plate;
        }
        return {
          createdAt: item.createdAt,
          location: item.location,
          description: item.description,
          original: item.original,
          _id: item._id,
          plateNumber: hasPlateNumber,
        };
      })
    );

    res.status(200).json({ data });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error on Fetching Report Data" });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reports = await Report.find({ postIt: true })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const filteredReports = reports.map((report) => {
      const reportObject = report.toObject();
      delete reportObject.plateNumber;
      return reportObject;
    });

    const obstructions = await Obstruction.find({
      postIt: true,
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

exports.getAllDataComplaints = async (req, res) => {
  try {
    const obstructions = await Obstruction.findWithDeleted();
    const plateNumbers = await PlateNumber.findWithDeleted()
      .populate({
        path: "violations.report",
        select: "location description createdAt status",
      })
      .select("plateNumber violations createdAt");

    let allViolations = plateNumbers.flatMap((plateNumber) =>
      plateNumber.violations.map((violation) => ({
        plateNumber: plateNumber.plateNumber,
        location: violation.report.location,
        description: violation.report.description,
        createdAt: violation.report.createdAt,
        violations: violation.types,
        status: violation.report.status,
        _id: violation.report._id,
      }))
    );
    const data = [...obstructions, ...allViolations];
    res.status(200).json({ data: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error on Fetching All Complaints Data" });
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
              cond: {
                $and: [
                  { $ne: ["$$detail.status", "Declined"] },
                  { $ne: ["$$detail.status", "Pending"] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          violations: {
            $filter: {
              input: "$violations",
              as: "violation",
              cond: {
                $in: [
                  "$$violation.report",
                  {
                    $map: {
                      input: "$reportDetails",
                      as: "rd",
                      in: "$$rd._id",
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          $expr: { $gt: [{ $size: "$violations" }, 0] },
        },
      },
    ]);

    const approvedObstructions = await Obstruction.find({ status: "Approved" });

    const data = [...report, ...approvedObstructions];

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
