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
  geocode: {
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
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
  comment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      autopopulate: true,
    },
  ],
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

obstructionSchema.statics.getResolvedCasesPerMonth = async function () {
  try {
    const result = await this.aggregate([
      {
        $match: {
          status: "Resolved",
          "geocode.latitude": { $ne: null },
          "geocode.longitude": { $ne: null },
        },
      },
      {
        $addFields: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $group: {
          _id: {
            month: "$month",
            year: "$year",
            lat: "$geocode.latitude",
            lng: "$geocode.longitude",
            location: "$location",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          lat: "$_id.lat",
          lng: "$_id.lng",
          location: "$_id.location",
          count: 1,
        },
      },
      {
        $sort: { year: 1, month: 1, count: -1 },
      },
    ]);
    return result;
  } catch (err) {
    throw new Error("Error fetching resolved cases per month: " + err.message);
  }
};

obstructionSchema.plugin(populate);
obstructionSchema.plugin(mongooseDelete, { overrideMethods: "all" });
module.exports = mongoose.model("Obstruction", obstructionSchema);
