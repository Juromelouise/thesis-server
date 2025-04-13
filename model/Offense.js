const mongoose = require("mongoose");

const offenseSchema = new mongoose.Schema({
  offense: {
    type: Number,
    default: 0,
  },
  fine: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Offense", offenseSchema);
