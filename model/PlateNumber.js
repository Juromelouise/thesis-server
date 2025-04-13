const mongoose = require("mongoose");
const populate = require("mongoose-autopopulate");
const Report = require("./Report");
const mongooseDelete = require("mongoose-delete");

const plateNumberSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    trim: true,
  },
  violations: [
    {
      report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
        required: true,
        autopopulate: true,
      },
      types: [
        {
          type: String,
          trim: true,
          required: true,
        },
      ],
    },
  ],
  count: {
    type: Number,
    default: 1,
  },
  offense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offense",
    autopopulate: true,
  },
  checkOffense: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

plateNumberSchema.methods.remove = async function (next) {
  try {
    await Report.updateMany(
      { plateNumber: this._id },
      { $unset: { plateNumber: "" } }
    );
    next();
  } catch (err) {
    next(err);
  }
};

plateNumberSchema.plugin(populate);
plateNumberSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model("PlateNumber", plateNumberSchema);
