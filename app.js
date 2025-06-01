const express = require("express");
const app = express();
// const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");

const google = require("./router/google");
const user = require("./router/user");
const announce = require("./router/announcement");
const report = require("./router/report");
const plateNumber = require("./router/plateNumber");
const maps = require("./router/maps");
const comment = require("./router/comment")

app.use(cors({
  origin: "*", 
  credentials: true
}));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
  session({
    // secret: "BOVO APP",
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
// app.use(cookieParser());

app.use("/auth", google);
app.use("/user", user);
app.use("/announce", announce);
app.use("/report", report);
app.use("/plate", plateNumber);
app.use("/map", maps);
app.use("/comment", comment);

module.exports = app;
