const app = require("./app");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

dotenv.config({ path: "./config/.env" });

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((con) => {
      console.log(`Connected to MongoDB with Host: ${con.connection.host}`);
    })
    .catch((err) => {
      console.error("Database connection error:", err);
      process.exit(1);
    });
};

connectDatabase();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const startServer = async () => {
  try {
    app.listen(4000, () => {
      console.log(`Server is running on port 4000.`);
    });
  } catch (error) {
    console.error("Error establishing ngrok tunnel:", error);
    process.exit(1);
  }
};

startServer();
