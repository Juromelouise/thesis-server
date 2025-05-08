const Report = require("../model/Report");
const Comment = require("../model/Comment");

exports.addCommentToReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const comment = new Comment({
      content: text,
      user: req.user._id,
    });

    await comment.save();

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.comment.push(comment._id);
    await report.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};