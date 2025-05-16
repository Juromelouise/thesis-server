import mongoose from "mongoose";
const populate = require("mongoose-autopopulate");

const banSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    autopopulate: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: null,
  },
});

banSchema.plugin(populate);

module.exports = mongoose.model("Ban", banSchema);
