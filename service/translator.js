const { Translate } = require("@google-cloud/translate").v2;
const projectId = "thesis-434709";

const translate = new Translate();

exports.translator = async (req, res, next) => {
  try {
    let description = req.body.description;
    const [translation] = await translate.translate(req.body.description, {
      from: "tl", // Source language (Tagalog)
      to: "en", // Target language (English)
    });

    // Log the translation for debugging

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
