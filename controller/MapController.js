const Report = require("../model/Report");

exports.getCoordinates = async (req, res) => {
    try {
      const coordinates = await Report.getGroupedCoordinates();
      res.status(200).json(coordinates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };