const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");

exports.getCoordinates = async (req, res) => {
  try {
    const ReportCoordinates = await Report.getResolvedCasesPerMonth();
    const obstructionCoordinates = await Obstruction.getResolvedCasesPerMonth();

    console.log("Report Coordinates:", ReportCoordinates);
    console.log("Obstruction Coordinates:", obstructionCoordinates);
    
    const coordinates = [...ReportCoordinates, ...obstructionCoordinates];

    res.status(200).json(coordinates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
