// filepath: c:\Thesis\System\backend\service\translator.js
const { Translate } = require("@google-cloud/translate").v2;
require("dotenv").config({ path: "../config/.env" });

exports.translator = async (req, res, next) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Initialize the Translate client with the API key
  const translate = new Translate({ key: apiKey });

  try {
    let description = req.body.description;
    const [translation] = await translate.translate(req.body.description, {
      from: "tl", // Source language (Tagalog)
      to: "en", // Target language (English)
    });

    // Update the request body with the translated description
    req.body.description = {};
    req.body.description.translation = translation;
    req.body.description.original = description;
    console.log("Translated text:", req.body.description);
    next();
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ message: "Error translating text" });
  }
};
