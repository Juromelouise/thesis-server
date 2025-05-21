const User = require("../model/User");
const sendToken = require("../utils/jwtToken");
const { uploadSingle } = require("../utils/cloudinaryUploader");
const bcrypt = require("bcrypt");

exports.mobile = async (req, res) => {
  console.log(req.body);
  const firstName = req.body.given_name;
  const lastName = req.body.family_name;
  const email = req.body.email;
  const avatar = await uploadSingle(req.body.picture, "Avatar");

  const body = { firstName, lastName, email, avatar };

  try {
    const user = await User.findOneWithDeleted({ email });
    const loginUser = await User.findOne({ email: email });
    console.log(user)

    if (user.deleted === false) {
      console.log("naglologin");
      sendToken(loginUser, 200, res);
    } else if (user.deleted === true) {
      res.status(400).json({
        status: false,
        message: "This account is Banned",
      });
    } else if (!user) {
      console.log("nagawa user");
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      body.password = hashedPassword;
      const newUser = await User.create(body);

      if (!newUser) {
        return res.status(500).json({
          status: false,
          message: "User not created",
        });
      }
      sendToken(newUser, 200, res);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.google = async (req, res, next) => {
  try {
    const firstName = req.body.name;
    const email = req.body.email;

    const body = { firstName, email };

    const loginUser = await User.find({ email: email });

    if (!loginUser) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }

    if (loginUser) {
      sendToken(loginUser, 200, res);
    } else {
      const avatar = await uploadSingle(req.body.avatar, "Avatar");
      body.avatar = avatar;
      const randomPassword = Math.random().toString(36).slice(-8);
      console.log(randomPassword);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      body.password = hashedPassword;

      const newUser = await User.create(body);

      if (!newUser) {
        return res.status(500).json({
          status: false,
          message: "User not created",
        });
      }

      sendToken(newUser, 200, res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
