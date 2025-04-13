const mongoose = require("mongoose");
const populate = require("mongoose-autopopulate");
const mongooseDelete = require("mongoose-delete");

const obstructionSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    autopopulate: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  original: {
    type: String,
    trim: true,
  },
  violations: [],
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Approved", "Disapproved", "Resolved"],
    default: "Pending",
  },
  editableStatus: {
    type: Number,
    default: 0,
    required: true,
  },
  confirmationImages: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  reason: {
    type: String,
    trim: true,
  },
  postIt: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

obstructionSchema.plugin(populate);
obstructionSchema.plugin(mongooseDelete, { overrideMethods: "all" });
module.exports = mongoose.model("Obstruction", obstructionSchema);
