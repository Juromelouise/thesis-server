// Import libraries
const natural = require("natural");
const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

// Example violation labels
const violationLabels = [
  "Blocking Driveway",
  "No Parking Zone",
  "Fire Hydrant Parking",
  "Sidewalk Parking",
];

// Create a new Bayesian classifier
const classifier = new natural.BayesClassifier();

// Example training data for Naive Bayes Classifier (user reports)
const violationReports = [
  {
    description: "The car is blocking the driveway",
    violation: "Blocking Driveway",
  },
  { description: "Parked in a no parking zone", violation: "No Parking Zone" },
  {
    description: "Parked in front of a fire hydrant",
    violation: "Fire Hydrant Parking",
  },
  {
    description: "The car is parked on the sidewalk",
    violation: "Sidewalk Parking",
  },
];

// Add training data to Bayesian classifier
violationReports.forEach((report) => {
  classifier.addDocument(report.description.toLowerCase(), report.violation);
});

// Train the Naive Bayes classifier
classifier.train();

// Function to classify new user reports with Naive Bayes Classifier
function classifyWithNaiveBayes(userDescription) {
  const classification = classifier.classify(userDescription.toLowerCase());
  console.log(
    `Naive Bayes -> Report: "${userDescription}" -> Violation: ${classification}`
  );
  return classification;
}

// Load and tokenize input using TensorFlow.js model
async function loadBERTModel() {
  try {
    const model = await tf.loadGraphModel(
      "https://tfhub.dev/tensorflow/bert_en_uncased_L-12_H-768_A-12/3",
      { fromTFHub: true }
    );
    return model;
  } catch (error) {
    console.error("Error loading BERT model:", error);
  }
}

// Function to tokenize and prepare input for BERT (simplified for this example)
async function tokenizeInput(inputText) {
  // Normally, you'd need to implement a tokenizer or use a pre-trained tokenizer for BERT.
  // In this example, we are simplifying the process.
  // Here, you would convert the input text into tokens that BERT can understand.
  const tokens = tf.tensor([
    /* tokenized input as Tensor */
  ]);
  return tokens;
}

// Combine TensorFlow.js BERT for semantic analysis and Naive Bayes for classification
async function classifyReportWithBERTAndNaiveBayes(userDescription) {
  // Step 1: Use TensorFlow.js BERT for semantic analysis
  const model = await loadBERTModel();
  const tokenizedInput = await tokenizeInput(userDescription);
  const prediction = model.predict(tokenizedInput); // Prediction from BERT model
  console.log(`BERT Prediction -> ${prediction}`);

  // Step 2: Use Naive Bayes classifier to classify the report
  const bayesClassification = classifyWithNaiveBayes(userDescription);

  // Return both the BERT prediction and Bayesian classification result
  return {
    bertPrediction: prediction,
    bayesViolation: bayesClassification,
  };
}

// Example usage
const newReport =
  "The car is parked in front of the fire hydrant and blocking the driveway";

classifyReportWithBERTAndNaiveBayes(newReport).then((result) => {
  console.log(
    `Final Result -> BERT Prediction: ${result.bertPrediction}, Naive Bayes Violation: ${result.bayesViolation}`
  );
});

module.exports = classifyReportWithBERTAndNaiveBayes;