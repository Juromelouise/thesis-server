const translator = require("open-google-translator");

exports.translator = async (req, res, next) => {
  try {
    const data = await translator.TranslateLanguageData({
      listOfWordsToTranslate: [req.body.description],
      fromLanguage: "tl",
      toLanguage: "en",
    });

    // console.log(data[0].translation);

    req.body.description = data[0];
    next();
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ message: "Error translating text" });
  }
};
