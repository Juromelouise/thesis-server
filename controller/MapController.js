// In your controller file
const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");

exports.getCoordinates = async (req, res) => {
  try {
    const { month, year } = req.query; 
    
    const monthNum = month ? parseInt(month) : null;
    const yearNum = year ? parseInt(year) : null;
    
    const matchQuery = {
      status: "Resolved",
      "geocode.latitude": { $ne: null },
      "geocode.longitude": { $ne: null }
    };
    
    if (monthNum && yearNum) {
      matchQuery.$expr = {
        $and: [
          { $eq: [{ $month: "$createdAt" }, monthNum] },
          { $eq: [{ $year: "$createdAt" }, yearNum] }
        ]
      };
    }

    const ReportCoordinates = await Report.aggregate([
      { $match: matchQuery },
      {
        $project: {
          lat: "$geocode.latitude",
          lng: "$geocode.longitude",
          location: "$location",
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        }
      }
    ]);

    const obstructionCoordinates = await Obstruction.aggregate([
      { $match: matchQuery },
      {
        $project: {
          lat: "$geocode.latitude",
          lng: "$geocode.longitude",
          location: "$location",
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        }
      }
    ]);

    const coordinates = [...ReportCoordinates, ...obstructionCoordinates];
    res.status(200).json(coordinates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};