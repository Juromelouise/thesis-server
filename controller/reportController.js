const Report = require("../model/Report");
const PlateNumber = require("../model/PlateNumber");
const axios = require("axios");
const { uploadMultiple } = require("../utils/cloudinaryUploader");
const { offenseUpdater } = require("../functions/Offense");
const FormData = require("form-data");
const fs = require("fs").promises;
const path = require("path");
const { pushNotification } = require("../utils/Notification");
const { title } = require("process");

const ensureTempDirectoryExists = async () => {
  const tempDir = path.join(__dirname, "../temp");
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (err) {
    console.error("Error creating temp directory:", err);
  }
};

const blurImages = async (files) => {
  try {
    const blurredImages = [];

    await ensureTempDirectoryExists();

    for (const file of files) {
      const formData = new FormData();
      const fileBuffer = await fs.readFile(file.path);
      formData.append("file", fileBuffer, file.originalname);

      const response = await axios.post(
        `${process.env.CURL_API}/blur/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          responseType: "arraybuffer",
        }
      );

      const blurredImage = Buffer.from(response.data, "binary");
      const blurredImagePath = path.join(
        __dirname,
        "../temp",
        file.originalname
      );
      await fs.writeFile(blurredImagePath, blurredImage);
      blurredImages.push({
        path: blurredImagePath,
        originalname: file.originalname,
      });
    }

    return blurredImages;
  } catch (error) {
    console.error("Error in blurImages function:", error);
    throw error;
  }
};

exports.createReport = async (req, res) => {
  try {
    let plate;
    const reporter = req.user.id;
    req.body.original = req.body.description.original;
    req.body.description = req.body.description.translation;
    const { location, description, original, plateNumber, violations, postIt } =
      req.body;

    const blurredImages = await blurImages(req.files);

    const images = await uploadMultiple(blurredImages, "ReportImages/Blurred");
    const imagesAdmin = await uploadMultiple(req.files, "ReportImages");

    const report = await Report.create({
      location,
      description,
      images,
      imagesAdmin,
      original,
      reporter,
      postIt,
      plateNumber: null,
    });

    if (plateNumber) {
      const ple = await PlateNumber.findOne({ plateNumber });
      if (ple) {
        plate = await PlateNumber.findByIdAndUpdate(
          ple._id,
          {
            count: ple.count + 1,
            $push: {
              violations: {
                report: report._id,
                types: violations,
              },
            },
          },
          { new: true }
        );
      } else {
        plate = await PlateNumber.create({
          plateNumber,
          violations: [
            {
              report: report._id,
              types: violations,
            },
          ],
        });
      }

      report.plateNumber = plate._id;
      await report.save();
    }

    const data = {
      title: "Report Submitted Successfully",
      message: `A new report has been submitted by ${req.user.firstName}. Please review it.`,
      data: { data: report._id },
    };
    await pushNotification(data, req.user.pushToken);

    res.status(200).json({
      report,
      plate,
    });
  } catch (e) {
    console.error("Error in creating report:", e);
    res.status(500).json({ error: "Failed to create report" });
  }
};

exports.updateReport = async (req, res) => {
  try {
    let plate;
    req.body.original = req.body.description.original;
    req.body.description = req.body.description.translation;
    const { location, description, original, plateNumber, violations, postIt } =
      req.body;

    let images = [];
    let imagesAdmin = [];
    if (req.files?.length > 0) {
      const blurredImages = await blurImages(req.files);
      images = await uploadMultiple(blurredImages, "ReportImages");
      imagesAdmin = await uploadMultiple(req.files, "ReportImages");
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (
      plateNumber &&
      report.plateNumber &&
      report.plateNumber.toString() !== plateNumber
    ) {
      await PlateNumber.findByIdAndUpdate(report.plateNumber, {
        $pull: { violations: { report: report._id } },
        $inc: { count: -1 },
      });
    }

    report.location = location;
    report.description = description;
    report.original = original;
    report.images = images;
    report.imagesAdmin = imagesAdmin;
    report.postIt = postIt;

    if (plateNumber) {
      const ple = await PlateNumber.findOne({ plateNumber });
      if (ple) {
        plate = await PlateNumber.findByIdAndUpdate(
          ple._id,
          {
            $push: {
              violations: {
                report: report._id,
                types: violations,
              },
            },
            $inc: { count: 1 },
          },
          { new: true }
        );
      } else {
        plate = await PlateNumber.create({
          plateNumber,
          violations: [
            {
              report: report._id,
              types: violations,
            },
          ],
        });
      }

      report.plateNumber = plate._id;
    }

    await report.save();

    res.status(201).json({ message: "Report is Updated", report });
  } catch (e) {
    console.log("Error in Updated Report:" + e);
    res.status(500).json({ message: "Error in updating report" });
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    await PlateNumber.findByIdAndUpdate(report.plateNumber, {
      $inc: { count: -1 },
    });
    if (report) {
      await report.remove();
    }
    res.status(200).json({ success: true });
  } catch (e) {
    console.log("Error in deleting report: " + e);
    res.status(500).json({ message: "Error in deleting report" });
  }
};

exports.getAllDataAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, filterStatus } = req.query;

    const plateNumbers = await PlateNumber.find()
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
        types: violation.types,
        status: violation.report.status,
        _id: violation.report._id,
      }))
    );

    if (filterStatus) {
      allViolations = allViolations.filter(
        (violation) => violation.status === filterStatus
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedViolations = allViolations.slice(startIndex, endIndex);

    res.status(200).json({
      data: paginatedViolations,
      totalItems: allViolations.length,
      totalPages: Math.ceil(allViolations.length / limit),
      currentPage: parseInt(page),
    });
  } catch (e) {
    console.log("Error in fetching violations: " + e);
    res.status(500).json({ message: "Error in fetching violations" });
  }
};
exports.getSingleReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const violationTypes = report.plateNumber.violations
      .filter((violation) => violation.report._id.toString() === req.params.id)
      .map((violation) => violation.types);

    const reportData = {
      ...report.toObject(),
      plateNumber: {
        ...report.plateNumber.toObject(),
        violations: violationTypes,
      },
    };

    res.status(200).json({ report: reportData });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Error in fetching report" });
  }
};

exports.updateReportStatus = async (req, res, next) => {
  try {
    let report;
    const editableStatus = await Report.findById(req.params.id);

    if (editableStatus.editableStatus < 3) {
      report = await Report.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          reason: req.body.reason,
          // editableStatus: editableStatus.editableStatus + 1,
        },
        { new: true }
      );
      await offenseUpdater(report.plateNumber._id, req.body.status);
    } else {
      return res
        .status(400)
        .json({ message: "Report status can be updated only three times" });
    }

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    req.report = report;
    res.status(200).json({ report });
  } catch (error) {
    console.log("Error in updating report status:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
