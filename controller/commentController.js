const Report = require("../model/Report");
const Comment = require("../model/Comment");
const Obstruction = require("../model/Obstruction");

exports.addCommentToReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    console.log("Received text:", text);
    console.log("Received report ID:", id);

    const comment = new Comment({
      content: text,
      user: req.user._id,
    });

    await comment.save();

    const report = await Report.findById(id);
    if (!report) {
      const obstruction = await Obstruction.findById(id);
      if (!obstruction) {
        return res
          .status(404)
          .json({ message: "Report or Obstruction not found" });
      }
      obstruction.comment.push(comment._id);
      await obstruction.save();
      return res.status(201).json(comment);
    }

    report.comment.push(comment._id);
    await report.save();

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: error.message });
  }
};
