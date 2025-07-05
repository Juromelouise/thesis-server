const axios = require("axios");
const FormData = require("form-data");

exports.classifyReport = async (req, res, next) => {
  try {
    if (!req.body.description || !req.body.description.translation) {
      return res.status(400).json({
        message: "Missing required field: description.translation",
      });
    }

    const reportText = req.body.description.translation
      .toString()
      .toLowerCase();
    console.log("Classifying report text:", reportText);

    const formData = new FormData();
    formData.append("text", reportText);

    const formHeaders = formData.getHeaders();

    const response = await axios.post(
      `${process.env.CURL_API}/classify-violation`,
      formData,
      {
        headers: {
          ...formHeaders,
          Accept: "application/json",
        },
        timeout: 5000,
      }
    );

    console.log("Predicted violations:", response.data.predicted_violations);

    req.body.violations = response.data.predicted_violations;
  
    next();
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
      });
    }

    res.status(error.response?.status || 500).json({
      message: "Classification failed",
      error: error.message,
      details: error.response?.data || "No additional details",
    });
  }
};
