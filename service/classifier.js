const natural = require("natural");
const classifier = new natural.BayesClassifier();

exports.classifyReport = async (req, res, next) => {
  try {
    const violationReports = [
      {
        description: "car has park 24 hours",
        violation: "Overnight parking",
      },
      {
        description:
          "a vehicle being parked in a location that creates a danger or obstruction, often violating traffic rules.",
        violation: "Hazard parking",
      },
      {
        description: "parking a vehicle in a restricted or prohibited area.",
        violation: "Illegal parking",
      },
      {
        description:
          "an area where vehicles are not allowed to park, and violators are subject to being towed.",
        violation: "Towing Zone",
      },
      {
        description:
          "Stopping or Parking that can cause traffic conflict, Loading, unloading, stopping, or parking is prohibited in certain areas unless necessary to avoid traffic conflicts or when directed by authorities. These restricted areas include crosswalks or sidewalks; within 6 meters of an intersection or street corner; within 30 meters of any signalized intersection; within 6 meters of fire station driveways or directly across from them; within 2 meters of any public or private driveway; within 3 meters of a school gate or entrance; and in front of any traffic sign or device where visibility may be obstructed. For delivery vehicles, if the loading or unloading of goods will take more than two (2) minutes, it must be done within the establishment’s own compound. In cases where no parking space is available within the premises, loading and unloading is only allowed during specific time intervals: 9:00 AM to 11:00 AM, 1:00 PM to 3:00 PM, and 8:00 PM to 5:00 AM the following day. Public utility vehicles are also not allowed to stop or park for loading and unloading outside designated zones, and it is unlawful for any driver to park and wait for passengers unless in emergency situations.",
        violation: "Loading and Unloading",
      },
      {
        description:
          "Blocking or misusing sidewalks for unauthorized activities.\n\nillegal use of Streets and Sidewalks -\nVendors- selling of foods in sidewalks, Religious Activities- conducting a religious activities in street or side walks, Household Chores- doing washing cloths or hanging cloths in street or side walks, Vehicles Parked- illegally parking in street, Dump Garbage's- Garbage left on the side of the road or sidewalks., Basketball/Volleyball Courts and alike- illegal setting up a basketball court in street , Animal Pens/Cages – Animal enclosures blocking roads or sidewalks.\nConstruction Materials – Building items obstructing public paths.\nBusiness Signboards – Signs placed on walkways causing obstruction.\nPublic Terminals – Transport spots occupying public space.",
        violation: "Illegal Sidewalk Use",
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

    // req.body.description.translation = 
    const reportText = req.body.description.translation.toLowerCase();

    // Get all classifications with probabilities
    const classifications = classifier.getClassifications("the car is parked where it  and blocking the sidewalk");

    // Sort classifications by probability in descending order
    const sortedClassifications = classifications.sort(
      (a, b) => b.value - a.value
    );

    // Convert probabilities to percentages
    // Convert probabilities to percentages
    const totalProbability = sortedClassifications.reduce(
      (sum, c) => sum + c.value,
      0
    );
    const classificationsWithPercentages = sortedClassifications.map((c) => ({
      label: c.label,
      percentage: (c.value / totalProbability) * 100,
    }));
    
    // Compare the top two percentages
    let predictedViolations = [];
    if (classificationsWithPercentages.length > 1) {
      const diff = classificationsWithPercentages[0].percentage - classificationsWithPercentages[1].percentage;
      if (diff > 20) {
        // If the top violation is much higher than the second, only include the top one
        predictedViolations = [classificationsWithPercentages[0].label];
      } else {
        // Otherwise, include all with the same top percentage (in case of ties)
        const topPercent = classificationsWithPercentages[0].percentage;
        predictedViolations = classificationsWithPercentages
          .filter(c => c.percentage === topPercent)
          .map(c => c.label);
      }
    } else if (classificationsWithPercentages.length === 1) {
      predictedViolations = [classificationsWithPercentages[0].label];
    }
    
    req.body.violations = predictedViolations;
    next();
  } catch (error) {
    console.error("Error classifying report:", error);
    res.status(500).json({ message: "Error classifying report" });
  }
};
