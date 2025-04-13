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

reportSchema.methods.remove = async function (next) {
  try {
    await PlateNumber.updateMany(
      { "violations.report": this._id },
      { $pull: { violations: { report: this._id } } }
    );
    await this.delete({ _id: this._id });
    // next();
    return;
  } catch (err) {
    // next(err);
    return err;
  }
};

reportSchema.plugin(populate);
reportSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model("Report", reportSchema);
