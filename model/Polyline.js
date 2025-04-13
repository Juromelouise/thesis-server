const { Schema } = require("mongoose");

const polylineSchema = new Schema({
  street: {
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
  },
});

module.exports = polylineSchema;
