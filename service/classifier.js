const natural = require("natural");
const classifier = new natural.BayesClassifier();

exports.classifyReport = async (req, res, next) => {
  try {
    const violationReports = [
      { description: "driveway", violation: "Blocking Driveway" },
      { description: "no parking zone", violation: "No Parking Zone" },
      { description: "fire hydrant", violation: "Fire Hydrant Parking" },
      { description: "sidewalk", violation: "Sidewalk Parking" },
      { description: "crosswalk", violation: "Crosswalk Obstruction" },
      { description: "loading zone", violation: "Loading Zone Violation" },
      { description: "bus stop", violation: "Blocking Bus Stop" },
      {
        description: "handicapped spot",
        violation: "Unauthorized Parking in Handicapped Spot",
      },
      { description: "intersection", violation: "Parking Near Intersection" },
      {
        description: "railroad crossing",
        violation: "Parking Near Railroad Crossing",
      },
      { description: "curb", violation: "Parking Too Close to Curb" },
      { description: "towed area", violation: "Parking in Towed Area" },
      {
        description: "vehicle obstruction",
        violation: "Obstructing Other Vehicles",
      },
      { description: "street corner", violation: "Parking at Street Corner" },
      { description: "emergency lane", violation: "Parking in Emergency Lane" },
      { description: "bicycle lane", violation: "Blocking Bicycle Lane" },
    ];

    // Add violation descriptions to the classifier
    violationReports.forEach((report) => {
      classifier.addDocument(
        report.description.toLowerCase(),
        report.violation
      );
    });

    classifier.train();

    const report = req.body.description.translation;

    const descriptionTokens = report.toLowerCase().split(" ");
    const detectedViolations = [];

    // Check for detected violations
    violationReports.forEach((reportItem) => {
      let found = false;
      reportItem.description
        .toLowerCase()
        .split(" ")
        .forEach((word) => {
          if (descriptionTokens.includes(word)) {
            found = true;
          }
        });

      if (found) {
        detectedViolations.push(reportItem.violation);
      }
    });

    // Classify the report and store it in an array for potential multiple violations
    const predictedViolations = [];
    const predictedViolation = classifier.classify(report.toLowerCase());

    // Check if the predicted violation is relevant
    if (predictedViolation) {
      predictedViolations.push(predictedViolation);
    }

    // Combine detected and predicted violations
    const finalViolations = [
      ...new Set([...detectedViolations, ...predictedViolations]),
    ];
    req.body.violations = finalViolations;
    next();
  } catch (error) {
    console.error("Error classifying report:", error);
    res.status(500).json({ message: "Error classifying report" });
  }
};
