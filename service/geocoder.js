const NodeGeocoder = require("node-geocoder");

exports.geocodeFomatter = async (address) => {

  const options = {
    provider: "google",
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    formatter: null,
  };
  
  const geocoder = NodeGeocoder(options);
  try {
    const res = await geocoder.geocode({
      address: address,
      countryCode: "PH",
      city: "Taguig City",
      state: "Metro Manila",
      minConfidence: 0.5,
    });
    return res;
  } catch (error) {
    console.error("Error during geocoding:", error);
    throw error; 
  }
};
