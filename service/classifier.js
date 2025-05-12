const natural = require("natural");
const classifier = new natural.BayesClassifier();

exports.classifyReport = async (req, res, next) => {
  try {
    const violationReports = [
      { description: "overnight", violation: "Overnight Parking" },
      { description: "24 hours", violation: "Overnight Parking" },
      { description: "left overnight", violation: "Overnight Parking" },
      { description: "same spot", violation: "Overnight Parking" },
      { description: "dangerous", violation: "Hazard Parking" },
      { description: "traffic hazard", violation: "Hazard Parking" },
      { description: "corner view", violation: "Hazard Parking" },
      { description: "lane block", violation: "Hazard Parking" },
      { description: "blocking way", violation: "Illegal Parking" },
      { description: "no parking", violation: "Illegal Parking" },
      { description: "illegally parked", violation: "Illegal Parking" },
      { description: "not allowed", violation: "Illegal Parking" },
      { description: "towing area", violation: "Towing Zone" },
      { description: "tow-away", violation: "Towing Zone" },
      { description: "tow violation", violation: "Towing Zone" },
      {
        description: "loading zone",
        violation: "Loading and Unloading Violation",
      },
      {
        description: "unloading obstruction",
        violation: "Loading and Unloading Violation",
      },
      {
        description: "no loading",
        violation: "Loading and Unloading Violation",
      },
      { description: "crosswalk", violation: "Crosswalk Obstruction" },
      { description: "crosswalk block", violation: "Crosswalk Obstruction" },
      { description: "intersection", violation: "Intersection Obstruction" },
      { description: "fire station", violation: "Fire Station Obstruction" },
      { description: "driveway", violation: "Blocking Driveway" },
      { description: "vehicle path", violation: "Blocking Driveway" },
      {
        description: "school entrance",
        violation: "School Entrance Obstruction",
      },
      { description: "stop sign", violation: "Traffic Sign Obstruction" },
      { description: "truck block", violation: "Improper Delivery Parking" },
      {
        description: "PUV loading",
        violation: "Unauthorized Loading/Unloading by PUV",
      },
      { description: "vendor", violation: "Sidewalk Vendor Violation" },
      { description: "sidewalk park", violation: "Illegal Sidewalk Parking" },
      { description: "garbage", violation: "Improper Garbage Disposal" },
      {
        description: "basketball hoop",
        violation: "Unauthorized Court on Road",
      },
      { description: "animal pen", violation: "Animal Pen Obstruction" },
      {
        description: "construction debris",
        violation: "Construction Material Obstruction",
      },
      { description: "business sign", violation: "Business Sign Obstruction" },
      {
        description: "tricycle terminal",
        violation: "Public Terminal Obstruction",
      },
    ];

    // Train the classifier
    violationReports.forEach((report) => {
      classifier.addDocument(
        report.description.toLowerCase(),
        report.violation
      );
    });
    classifier.train();

     const reportText = req.body.description.translation.toLowerCase();

    // Get all classifications with probabilities
    const classifications = classifier.getClassifications(reportText);

    // Sort classifications by probability in descending order
    const sortedClassifications = classifications.sort((a, b) => b.value - a.value);

    // Convert probabilities to percentages
    const totalProbability = sortedClassifications.reduce((sum, c) => sum + c.value, 0);
    const classificationsWithPercentages = sortedClassifications.map((c) => ({
      label: c.label,
      percentage: (c.value / totalProbability) * 100,
    }));

    // Include all violations above a certain percentage threshold
    const percentageThreshold = 5; // Include violations with at least 5% probability
    const predictedViolations = classificationsWithPercentages
      .filter((c) => c.percentage >= percentageThreshold)
      .map((c) => c.label);

    req.body.violations = predictedViolations;
    next();
  } catch (error) {
    console.error("Error classifying report:", error);
    res.status(500).json({ message: "Error classifying report" });
  }
};
