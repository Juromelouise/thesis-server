const Tesseract = require("tesseract.js");

exports.imageExtract = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imagePath = req.file.path;
    console.log("Processing file:", imagePath);

    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng");
    console.log("Extracted text:", text);

    res.status(200).json({ extractedText: text });
  } catch (error) {
    console.error("Error extracting text:", error);
    res.status(500).json({ message: "Error processing image" });
  }
};
