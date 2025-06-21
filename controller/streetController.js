// const Street = require("../model/Street");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Street = mongoose.model("Street", require("../model/Street"));

exports.getAllStreets = async (req, res) => {
  try {
    const merged = await Street.aggregate([
      {
        $group: {
          _id: "$streetName",
          segments: { $push: "$coordinates" },
          color: { $first: "$color" },
        },
      },
      {
        $project: {
          _id: 0,
          streetName: "$_id",
          segments: 1,
          color: 1,
        },
      },
    ]);
    res.status(200).json({ data: merged });
  } catch (err) {
    console.error("Aggregation error:", err);
    res.status(500).json({ message: "Aggregation failed", error: err.message });
  }
};
exports.putStreet = async (req, res) => {
  try {
    // List all your JSON files
    const jsonFiles = [
      "streets.json"
    ];

    let totalImported = 0;
    const results = [];

    // Remove all existing street data before import (optional, for clean import)
    await Street.deleteMany({});

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(__dirname, "../temp", file);
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Insert data into MongoDB
        const inserted = await Street.insertMany(fileData);
        totalImported += inserted.length;
        results.push({
          file,
          imported: inserted.length,
          status: "success",
        });
      } catch (fileError) {
        console.error(`Error processing ${file}:`, fileError);
        results.push({
          file,
          imported: 0,
          status: "failed",
          error: fileError.message,
        });
      }
    }

    res.status(200).json({
      message: "Street data import completed",
      totalImported,
      details: results,
    });
  } catch (error) {
    console.error("Error in street import:", error);
    res.status(500).json({
      message: "Failed to import street data",
      error: error.message,
    });
  }
};

exports.streetColor = async (req, res) => {
  try {
    // Update all streets' color to gray (#808080)
    const result = await Street.updateMany({}, { $set: { color: "#808080" } });
    res.status(200).json({
      message: "All street colors updated to gray.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating street colors:", error);
    res.status(500).json({
      message: "Failed to update street colors.",
      error: error.message,
    });
  }
};
