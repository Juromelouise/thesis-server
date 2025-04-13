const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const populate = require("mongoose-autopopulate");

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    autopopulate: true,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    autopopulate: true,
  },
});
commentSchema.plugin(mongooseDelete, { overrideMethods: "all" });
commentSchema.plugin(populate);

module.exports = mongoose.model("Comment", commentSchema);
