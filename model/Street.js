const mongoose = require("mongoose");

const streetSchema = new mongoose.Schema({
  streetName: {
    type: String,
    required: true,
  },
  coordinates: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  ],
  color: {
    type: String,
  },
});

module.exports = mongoose.model("Street", streetSchema);