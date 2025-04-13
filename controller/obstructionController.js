const Obstruction = require("../model/Obstruction");
const { uploadMultiple } = require("../utils/cloudinaryUploader");

exports.createObstruction = async (req, res) => {
  try {
    const reporter = req.user.id;
    req.body.original = req.body.description.original;
    req.body.description = req.body.description.translation;
    const { location, description, original, violations } = req.body;
    const images = await uploadMultiple(req.files, "ObstructionImages");


    const obstruction = await Obstruction.create({
      location,
      description,
      images,
      original,
      reporter,
      violations,
    });

    res.status(200).json({
      obstruction,
    });
  } catch (e) {
    console.error("Error in creating obstruction:", e);
    res.status(500).json({ error: "Failed to create report" });
  }
};

exports.updateObstruction = async (req, res) => {
  try {
    req.body.original = req.body.description.original;
    req.body.description = req.body.description.translation;
    const { location, description, original, violations } = req.body;
    let images = [];
    if (req.files?.length > 0) {
      images = await uploadMultiple(req.files, "ObstructionImages");
    }
    const obstruction = await Obstruction.findByIdAndUpdate(
      req.params.id,
      { location, description, original, violations, images },
      {
        new: true,
        runValidators: true,
      }
    );
    res
      .status(201)
      .json({ message: "Obstruction is Updated", obstruction: obstruction });
  } catch (e) {
    console.log("Error in Updated obstruction:" + e);
    res.status(500).json({ message: "Error in updating obstruction" });
  }
};

exports.deleteObstruction = async (req, res) => {
  try {
    await Obstruction.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (e) {
    console.log("Error in deleting obstruction: " + e);
    res.status(500).json({ message: "Error in deleting obstruction" });
  }
};

exports.getAllobstructions = async (req, res) => {
  try {
    const obstructions = await Obstruction.find();;
    res.status(200).json({ obstructions });
  } catch (e) {
    console.log("Error in getting all obstructions: " + e);
    res.status(500).json({ message: "Error in getting all obstructions" });
  }
};

exports.getSingleObstruction = async (req, res) => {
  try {
    const obstruction = await Obstruction.findById(req.params.id);
    res.status(200).json({ data: obstruction });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error on Fetching Obstruction Data" });
  }
};

exports.editableStatusObs = async (req, res) => {
  try {
    let report;
    const editableStatus = await Obstruction.findById(req.params.id);

    if (editableStatus.editableStatus < 3) {
      report = await Obstruction.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          editableStatus: editableStatus.editableStatus + 1,
        },
        { new: true }
      );
    } else {
      return res
        .status(400)
        .json({ message: "Report status can be updated only three times" });
    }

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({ report });
  } catch (error) {
    console.log("Error in updating report status: " + error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.updateObstructionViolations = async (req, res) => {
  try {
    const { violations } = req.body;
    const obstruction = await Obstruction.findByIdAndUpdate(
      req.params.id,
      { violations },
      { new: true }
    );
    res.status(200).json({ report: obstruction });
  } catch (error) {
    console.error("Error updating violations:", error);
    res.status(500).json({ message: "Failed to update violations." });
  }
};
