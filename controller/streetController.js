const Street = require("../model/Street");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
// const Street = mongoose.model("Street", require("../model/Street"));

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
    const jsonFiles = ["streets.json"];

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

exports.deleteStreet = async (req, res) => {
  try {
    const result = await Street.find({
      streetName: "South Luzon Expressway",
    }).deleteMany();
    if (!result) {
      return res.status(404).json({ message: "Street not found" });
    }
    res.status(200).json({ message: "Street deleted successfully" });
  } catch (error) {
    console.error("Error deleting street:", error);
    res.status(500).json({
      message: "Failed to delete street",
      error: error.message,
    });
  }
};

exports.getAllStreetName = async (req, res) => {
  try {
    const streets = await Street.find({}, "streetName").distinct("streetName");
    if (!streets || streets.length === 0) {
      return res.status(404).json({ message: "No street names found" });
    }
    res.status(200).json({ streetNames: streets });
  } catch (error) {
    console.error("Error fetching street names:", error);
    res.status(500).json({
      message: "Failed to fetch street names",
      error: error.message,
    });
  }
};

exports.getStreetName = async (req, res) => {
  try {
    const data = await Street.find({ streetName: "Champaca Street" });
    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Error fetching street name:", error);
    res.status(500).json({
      message: "Failed to fetch street name",
      error: error.message,
    });
  }
};
