const Report = require("../model/Report");
const Obstruction = require("../model/Obstruction");
const axios = require("axios");

const nominatimClient = axios.create({
  baseURL: "https://nominatim.openstreetmap.org",
  headers: {
    "User-Agent": "BOVO/1.0 (juromefernando@gmail.com)",
    Referer: "https://client-thesis.vercel.app",
  },
  timeout: 10000,
});

// Configure axios instance for Overpass
const overpassClient = axios.create({
  baseURL: "https://overpass-api.de/api/interpreter",
  timeout: 30000,
});

async function getStreetGeometry(streetName, referenceLat, referenceLon) {
  try {
    console.log(`Fetching geometry for: ${streetName} at ${referenceLat},${referenceLon}`);
    
    // Simplify the street name for better matching
    const simplifiedStreetName = streetName
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();

    let query;
    const bboxSize = 100; // meters around the reference point
    
    if (referenceLat && referenceLon && 
        !isNaN(referenceLat) && !isNaN(referenceLon) &&
        Math.abs(referenceLat) <= 90 && Math.abs(referenceLon) <= 180) {
      
      query = `
        [out:json][timeout:25];
        (
          way["highway"]["name"~"^${simplifiedStreetName}$",i](around:${bboxSize},${referenceLat},${referenceLon});
        );
        out geom;
      `;
    } else {
      query = `
        [out:json][timeout:25];
        area["name"="Western Bicutan"]["admin_level"="10"]->.searchArea;
        (
          way["highway"]["name"~"^${simplifiedStreetName}$",i](area.searchArea);
        );
        out geom;
      `;
    }

    // Clean and encode the query
    const cleanQuery = query.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
    const encodedQuery = encodeURIComponent(cleanQuery);
    
    console.log(`Executing Overpass query: ${cleanQuery}`);
    
    // Add retry logic with exponential backoff
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const response = await overpassClient.get(`?data=${encodedQuery}`, {
          timeout: 30000
        });

        const ways = response.data.elements?.filter(el => el.type === "way") || [];
        
        if (ways.length === 0) {
          console.log(`No ways found for street: ${streetName}`);
          return null;
        }

        // Find the way with the most points (likely the main segment)
        let selectedWay = ways.reduce((longest, way) => 
          way.geometry?.length > longest.geometry?.length ? way : longest, 
          ways[0]
        );

        // If we have reference coordinates, find the closest way
        if (referenceLat && referenceLon && ways.length > 1) {
          let minDistance = Infinity;
          ways.forEach(way => {
            way.geometry?.forEach(point => {
              const distance = Math.sqrt(
                Math.pow(point.lat - referenceLat, 2) + 
                Math.pow(point.lon - referenceLon, 2)
              );
              if (distance < minDistance) {
                minDistance = distance;
                selectedWay = way;
              }
            });
          });
        }

        const coordinates = selectedWay.geometry.map(point => [point.lon, point.lat]);
        return {
          type: "LineString",
          coordinates: coordinates,
        };
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          const delay = Math.pow(2, 3 - retries) * 1000; // Exponential backoff
          console.log(`Retry attempt ${4-retries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Failed after retries');
    
  } catch (error) {
    console.error(`Error fetching street geometry for ${streetName}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

async function getStreetData(latitude, longitude) {
  try {
    // Add delay to respect rate limits (max 1 request per second)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const response = await nominatimClient.get(
      `/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );

    const address = response.data.address;
    console.log("Fetched address:", address);
    const streetName =
      address.road || address.pedestrian || address.footway || "Unnamed Road";

    // Add another delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const [streetGeocode, streetGeometry] = await Promise.all([
      nominatimClient
        .get(
          `/search?q=${encodeURIComponent(
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
      getStreetGeometry(streetName, latitude, longitude),
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
    const { month, year } = req.query;

       const matchQuery = {
      "geocode.latitude": { $exists: true, $ne: null },
      "geocode.longitude": { $exists: true, $ne: null },
    };

    if (month && year) {
      matchQuery.$expr = {
        $and: [
          { $eq: [{ $month: "$createdAt" }, parseInt(month)] },
          { $eq: [{ $year: "$createdAt" }, parseInt(year)] },
        ],
      };
    }

    const reports = await Report.find(matchQuery).lean();
    const obstructions = await Obstruction.find(matchQuery).lean();
    console.log("Fetched reports:", reports.length, "obstructions:", obstructions.length);

    const allDocuments = [...reports, ...obstructions];
    const streetCounts = {};
    const streetDetails = {};

    // Process documents in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (doc) => {
        const { latitude, longitude } = doc.geocode;
        let streetName, streetGeometry;

        // For reports, use the stored location field
        if (doc.__t === "Report" || doc.plateNumber) {
          streetName = doc.location;
          // Only fetch geometry if we don't already have it for this street
          if (!streetDetails[streetName]?.geometry) {
            streetGeometry = await getStreetGeometry(streetName, latitude, longitude);
          }
        } 
        // For obstructions, use the API to get street name and geometry
        else {
          const streetData = await getStreetData(latitude, longitude);
          streetName = streetData.streetName;
          streetGeometry = streetData.streetGeometry;
        }

        if (!streetName) return;

        // Initialize street entry if it doesn't exist
        if (!streetCounts[streetName]) {
          streetCounts[streetName] = 0;
          streetDetails[streetName] = {
            reports: 0,
            obstructions: 0,
            geometry: streetDetails[streetName]?.geometry || streetGeometry,
            pointLocation: { latitude, longitude },
          };
        }

        streetCounts[streetName]++;
        if (doc.__t === "Report" || doc.plateNumber) {
          streetDetails[streetName].reports++;
        } else {
          streetDetails[streetName].obstructions++;
        }
      }));

      // Add delay between batches to respect API rate limits
      if (i + batchSize < allDocuments.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const result = Object.keys(streetCounts)
      .filter(streetName => streetDetails[streetName])
      .map(streetName => ({
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