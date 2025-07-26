const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");
const axios = require("axios");
const NodeCache = require("node-cache");
const geoCache = new NodeCache({ stdTTL: 86400 });

const nominatimClient = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  headers: {
    'User-Agent': 'BOVO/1.0 (juromefernando@gmail.com)',
    'Referer': 'https://client-thesis.vercel.app'
  },
  timeout: 10000
});

// Configure axios instance for Overpass
const overpassClient = axios.create({
  baseURL: 'https://overpass-api.de/api/interpreter',
  timeout: 30000
});

async function getStreetGeometry(streetName) {
  try {
    const response = await overpassClient.get(
      `?data=[out:json][timeout:30];
      area[name="Taguig"]->.city;
      way(area.city)["name"="${streetName}"]["highway"](around:1000,14.5095,121.0380);
      out geom;`
    );

    const ways = response.data.elements.filter((el) => el.type === "way");
    if (ways.length === 0) return null;

    const coordinates = ways[0].geometry.map(point => [point.lon, point.lat]);
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
    // Add delay to respect rate limits (max 1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const response = await nominatimClient.get(
      `/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );

    const address = response.data.address;
    const streetName = address.road || address.pedestrian || address.footway || "Unnamed Road";

    // Add another delay between requests
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const [streetGeocode, streetGeometry] = await Promise.all([
      nominatimClient.get(
        `/search?q=${encodeURIComponent(streetName + ", Western Bicutan, Taguig")}&format=json&addressdetails=1&limit=1`
      ).then(res => res.data[0] ? {
        latitude: parseFloat(res.data[0].lat),
        longitude: parseFloat(res.data[0].lon),
      } : null),
      getStreetGeometry(streetName)
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

// async function getStreetGeometry(streetName) {
//   try {
//     const response = await axios.get(
//       `https://overpass-api.de/api/interpreter?data=[out:json][timeout:30];
//       area[name="Taguig"]->.city;
//       way(area.city)["name"="${streetName}"]["highway"](around:1000,14.5095,121.0380);
//       (._;>;);
//       out geom;`
//     );

//     const ways = response.data.elements.filter((el) => el.type === "way");

//     if (ways.length === 0) return null;

//     // Process all street segments into a single polyline
//     const coordinates = [];
//     ways.forEach((way) => {
//       if (way.geometry) {
//         way.geometry.forEach((point) => {
//           coordinates.push([point.lon, point.lat]);
//         });
//       }
//     });

//     return {
//       type: "LineString",
//       coordinates: coordinates,
//     };
//   } catch (error) {
//     console.error("Error fetching street geometry:", error);
//     return null;
//   }
// }

// async function getStreetData(latitude, longitude) {
//   const cacheKey = `street-${latitude}-${longitude}`;
//   const cached = geoCache.get(cacheKey);
//   if (cached) return cached;

//   try {
//     // Respect rate limits
//     await new Promise((resolve) => setTimeout(resolve, 1100));

//     const response = await nominatimClient.get(
//       `/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
//     );

//     const address = response.data.address;
//     const streetName =
//       address.road || address.pedestrian || address.footway || "Unnamed Road";

//     // Get data from cache if available
//     const streetCacheKey = `street-geo-${streetName}`;
//     const cachedStreet = geoCache.get(streetCacheKey);
//     if (cachedStreet) {
//       geoCache.set(cacheKey, cachedStreet);
//       return cachedStreet;
//     }

//     const [streetGeocode, streetGeometry] = await Promise.all([
//       (async () => {
//         await new Promise((resolve) => setTimeout(resolve, 1100));
//         const res = await nominatimClient.get(
//           `/search?q=${encodeURIComponent(
//             streetName + ", Western Bicutan, Taguig"
//           )}&format=json&addressdetails=1&limit=1`
//         );
//         return res.data[0]
//           ? {
//               latitude: parseFloat(res.data[0].lat),
//               longitude: parseFloat(res.data[0].lon),
//             }
//           : null;
//       })(),
//       getStreetGeometry(streetName),
//     ]);

//     const result = {
//       streetName,
//       streetGeocode,
//       streetGeometry,
//     };

//     // Cache results
//     geoCache.set(cacheKey, result);
//     geoCache.set(streetCacheKey, result);

//     return result;
//   } catch (error) {
//     console.error("Error fetching street data:", error);
//     return {
//       streetName: "Unknown Street",
//       streetGeocode: null,
//       streetGeometry: null,
//     };
//   }
// }

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
    const batchSize = 10; // Process 10 documents at a time
    const reports = await Report.find({
      "geocode.latitude": { $exists: true, $ne: null },
      "geocode.longitude": { $exists: true, $ne: null },
    }).lean();

    const obstructions = await Obstruction.find({
      "geocode.latitude": { $exists: true, $ne: null },
      "geocode.longitude": { $exists: true, $ne: null },
    }).lean();

    const allDocuments = [...reports, ...obstructions];
    const streetCounts = {};
    const streetDetails = {};

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (doc) => {
          const { latitude, longitude } = doc.geocode;
          const { streetName, streetGeocode, streetGeometry } =
            await getStreetData(latitude, longitude);

          if (!streetGeocode || !streetGeometry) return;

          if (!streetCounts[streetName]) {
            streetCounts[streetName] = 0;
            streetDetails[streetName] = {
              pointLocation: streetGeocode,
              geometry: streetGeometry,
              reports: 0,
              obstructions: 0,
            };
          }

          streetCounts[streetName]++;
          if (doc.__t === "Report" || doc.plateNumber) {
            streetDetails[streetName].reports++;
          } else {
            streetDetails[streetName].obstructions++;
          }
        })
      );

      // Add delay between batches
      if (i + batchSize < allDocuments.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const result = Object.keys(streetCounts)
      .filter((streetName) => streetDetails[streetName])
      .map((streetName) => ({
        streetName,
        totalCases: streetCounts[streetName],
        reports: streetDetails[streetName].reports,
        obstructions: streetDetails[streetName].obstructions,
        geometry: streetDetails[streetName].geometry,
        pointLocation: streetDetails[streetName].pointLocation,
      }))
      .sort((a, b) => b.totalCases - a.totalCases);

    res.status(200).json({
      features: result,
      barangay: "Western Bicutan",
      city: "Taguig",
    });
  } catch (error) {
    console.error("Error in streetOccupiedMost:", error);
    res.status(500).json({
      error: error.message,
      suggestion: "Please try again later or contact support",
    });
  }
};
