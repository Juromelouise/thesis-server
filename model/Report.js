const mongoose = require("mongoose");
const populate = require("mongoose-autopopulate");
const PlateNumber = require("./PlateNumber");
const mongooseDelete = require("mongoose-delete");

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    autopopulate: true,
  },
  plateNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PlateNumber",
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
  imagesAdmin: [
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
    enum: ["Pending", "Reviewed for Proper Action", "Ongoing Investigation", "Approved", "Declined", "Resolved"],
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
  comment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      autopopulate: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reportSchema.methods.remove = async function (next) {
  try {
    await PlateNumber.updateMany(
      { "violations.report": this._id },
      { $pull: { violations: { report: this._id } } }
    );
    await this.delete({ _id: this._id });
    return;
  } catch (err) {
    return err;
  }
};

reportSchema.statics.getGroupedCoordinates = async function () {
  try {
    const reports = await this.find({
      "geocode.latitude": { $ne: null },
      "geocode.longitude": { $ne: null },
    }).select("geocode -_id");

    return reports.map((report) => ({
      lat: report.geocode.latitude,
      lng: report.geocode.longitude,
    }));
  } catch (err) {
    throw new Error("Error fetching grouped coordinates: " + err.message);
  }
};

reportSchema.plugin(populate);
reportSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model("Report", reportSchema);
