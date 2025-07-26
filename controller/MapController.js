const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");
const axios = require("axios");

async function getStreetGeometry(streetName) {
  try {
    const response = await axios.get(
      `https://overpass-api.de/api/interpreter?data=[out:json][timeout:30];
      area[name="Taguig"]->.city;
      way(area.city)["name"="${streetName}"]["highway"](around:1000,14.5095,121.0380);
      (._;>;);
      out geom;`
    );

    const ways = response.data.elements.filter((el) => el.type === "way");

    if (ways.length === 0) return null;

    // Process all street segments into a single polyline
    const coordinates = [];
    ways.forEach((way) => {
      if (way.geometry) {
        way.geometry.forEach((point) => {
          coordinates.push([point.lon, point.lat]);
        });
      }
    });

    return {
      type: "LineString",
      coordinates: coordinates,
    };
  } catch (error) {
    console.error("Error fetching street geometry:", error);
    return null;
  }
}

async function getStreetData(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );

    const address = response.data.address;
    const streetName =
      address.road || address.pedestrian || address.footway || "Unnamed Road";

    // Get both point location and full geometry
    const [streetGeocode, streetGeometry] = await Promise.all([
      axios
        .get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            streetName + ", Western Bicutan, Taguig"
          )}&format=json&addressdetails=1&limit=1`
        )
        .then((res) =>
          res.data[0]
            ? {
                latitude: parseFloat(res.data[0].lat),
                longitude: parseFloat(res.data[0].lon),
              }
            : null
        ),
      getStreetGeometry(streetName),
    ]);

    return {
      streetName,
      streetGeocode,
      streetGeometry,
    };
  } catch (error) {
    console.error("Error fetching street data:", error);
    return {
      streetName: "Unknown Street",
      streetGeocode: null,
      streetGeometry: null,
    };
  }
}

exports.getCoordinates = async (req, res) => {
  try {
    const { month, year } = req.query;

    const monthNum = month ? parseInt(month) : null;
    const yearNum = year ? parseInt(year) : null;

    const matchQuery = {
      status: "Resolved",
      "geocode.latitude": { $ne: null },
      "geocode.longitude": { $ne: null },
    };

    if (monthNum && yearNum) {
      matchQuery.$expr = {
        $and: [
          { $eq: [{ $month: "$createdAt" }, monthNum] },
          { $eq: [{ $year: "$createdAt" }, yearNum] },
        ],
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
          year: { $year: "$createdAt" },
        },
      },
    ]);

    const obstructionCoordinates = await Obstruction.aggregate([
      { $match: matchQuery },
      {
        $project: {
          lat: "$geocode.latitude",
          lng: "$geocode.longitude",
          location: "$location",
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
    ]);

    const coordinates = [...ReportCoordinates, ...obstructionCoordinates];
    res.status(200).json(coordinates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.streetOccupiedMost = async (req, res) => {
  try {
    // Fetch all reports and obstructions with geocodes
    const reports = await Report.find({
      "geocode.latitude": { $exists: true, $ne: null },
      "geocode.longitude": { $exists: true, $ne: null },
    }).lean();

    const obstructions = await Obstruction.find({
      "geocode.latitude": { $exists: true, $ne: null },
      "geocode.longitude": { $exists: true, $ne: null },
    }).lean();

    // Combine all documents
    const allDocuments = [...reports, ...obstructions];

    // Process each document to get street data and count
    const streetCounts = {};
    const streetDetails = {};

    // Process in parallel for better performance
    await Promise.all(
      allDocuments.map(async (doc) => {
        const { latitude, longitude } = doc.geocode;
        const { streetName, streetGeocode, streetGeometry } =
          await getStreetData(latitude, longitude);

        // Skip if we couldn't get street data
        if (!streetGeocode || !streetGeometry) return;

        // Initialize street in counts if not exists
        if (!streetCounts[streetName]) {
          streetCounts[streetName] = 0;
          streetDetails[streetName] = {
            pointLocation: streetGeocode,
            geometry: streetGeometry,
            reports: 0,
            obstructions: 0,
          };
        }

        // Increment counts
        streetCounts[streetName]++;
        if (doc.__t === "Report" || doc.plateNumber) {
          streetDetails[streetName].reports++;
        } else {
          streetDetails[streetName].obstructions++;
        }
      })
    );

    // Convert to array and sort by total count in descending order
    const result = Object.keys(streetCounts)
      .filter((streetName) => streetDetails[streetName])
      .map((streetName) => ({
        streetName,
        totalCases: streetCounts[streetName],
        reports: streetDetails[streetName].reports,
        obstructions: streetDetails[streetName].obstructions,
        geometry: streetDetails[streetName].geometry,
        pointLocation: streetDetails[streetName].pointLocation
      }))
      .sort((a, b) => b.totalCases - a.totalCases);

    // Changed response structure to match frontend expectations
    res.status(200).json({
      features: result, // Changed from 'result' to 'features'
      barangay: "Western Bicutan",
      city: "Taguig"
    });
  } catch (error) {
    console.error("Error in streetOccupiedMost:", error);
    res.status(500).json({ error: error.message });
  }
};
