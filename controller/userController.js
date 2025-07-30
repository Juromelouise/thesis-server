const User = require("../model/User");
const Report = require("../model/Report");
const Obstruct = require("../model/Obstruction");
const sendToken = require("../utils/jwtToken");
const { uploadSingle } = require("../utils/cloudinaryUploader");
const path = require("path");
const { email } = require("../utils/Email");
const Ban = require("../model/Ban");
const { banningChoice } = require("../utils/banningChoice");

exports.registerUser = async (req, res) => {
  try {
    let image;
    if (req.file) {
      image = await uploadSingle(req.file.path, "Avatar");
    } else {
      const defaultAvatarPath = path.join(
        __dirname,
        "../image/defaultavatar.jpg"
      );
      image = await uploadSingle(defaultAvatarPath, "Avatar");
    }
    req.body.avatar = image;
    const user = await User.create(req.body);
    sendToken(user, 200, res);
  } catch (e) {
    console.error("Error in Creating user: ", e);
    res.status(500).json({ message: "Error in Register User" });
  }
};

exports.logout = async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
};

exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const reportCount = await Report.countDocuments({ reporter: req.user.id });
    const obstructionCount = await Obstruct.countDocuments({
      reporter: req.user.id,
    });

    const report1 = await Report.find({ reporter: req.user.id });
    const obstruction = await Obstruct.find({ reporter: req.user.id });

    const reportPostCount = await Report.countDocuments({
      reporter: req.user.id,
      postIt: true,
    });
    const obstructionPostCount = await Obstruct.countDocuments({
      reporter: req.user.id,
      postIt: true,
    });

    const report = [...report1, ...obstruction];

    const data = reportCount + obstructionCount;
    const data2 = reportPostCount + obstructionPostCount;

    res.status(200).json({
      success: true,
      user,
      data,
      data2,
      report,
    });
  } catch (e) {
    console.error("Error in Getting user: ", e);
    res.status(500).json({ message: "Error in Getting user" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const avatar = await uploadSingle(req.file.path, "Avatar");
      req.body.avatar = avatar;
      const user = await User.findByIdAndUpdate(req.user._id, req.body, {
        new: true,
      });
      res.status(200).json({
        success: true,
        user,
      });
    } else {
      const user = await User.findByIdAndUpdate(req.user._id, req.body, {
        new: true,
      });
      res.status(200).json({
        success: true,
        user,
      });
    }
  } catch (e) {
    console.error("Error in Updating Profile: ", e);
    res.status(500).json({ message: "Error in Updating Profile" });
  }
};

exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter email & password" });
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({ error: "Invalid Email or Password" });
  }
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return res.status(401).json({ error: "Invalid Email or Password" });
  }
  sendToken(user, 200, res);
};

exports.updatePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    if (!expoPushToken) {
      return res.status(400).json({ message: "Push token is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pushToken: expoPushToken },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Push token updated successfully",
      pushToken: user.pushToken,
    });
  } catch (error) {
    console.error("Error updating push token:", error);
    res.status(500).json({ message: "Error updating push token" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findWithDeleted({
      _id: { $ne: req.user._id },
      firstName: { $ne: "Admin" },
      lastName: { $ne: "admin" },
    });
    // const users = await User.findWithDeleted();
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({
      success: true,
      users: users,
    });
  } catch (e) {
    console.error("Error in Getting all users: ", e);
    res.status(500).json({ message: "Error in Getting all users" });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.banUser();
    const data = await User.findWithDeleted();
    console.log(req.body.endData);
    await Ban.create({
      user: user._id,
      reason: req.body.reason,
      endDate: req.body.endDate,
    });

    let fileUrl = null;
    let attachment = null;
    if (req.file) {
      fileUrl = req.file.originalname;
      attachment = req.file;
    }

    const { text, html } = banningChoice(
      req.body.reason,
      fileUrl,
      req.body.endDate
    );
    const emailData = {
      to: user.email,
      subject: "Account Banned",
      text,
      html,
      ...(attachment && { attachment }),
    };

    await email(emailData);
    res.status(200).json({ message: "User banned successfully", user: data });
  } catch (e) {
    console.error("Error in Banning user: ", e);
    res.status(500).json({ message: "Error in Banning user" });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneWithDeleted({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.unbanUser();
    const data = await User.findWithDeleted();
    res.status(200).json({ message: "User unbanned successfully", user: data });
  } catch (e) {
    console.error("Error in Unbanning user: ", e);
    res.status(500).json({ message: "Error in Unbanning user" });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneWithDeleted({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.role = req.body.role;
    await user.save();
    const data = await User.findWithDeleted();
    res
      .status(200)
      .json({ message: "User role changed successfully", users: data });
  } catch (e) {
    console.error("Error in Changing user role: ", e);
    res.status(500).json({ message: "Error in Changing user role" });
  }
};

exports.getMultipleUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs provided" });
    }

    const users = await User.findWithDeleted({ _id: { $in: ids } });
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error in getting multiple users:", error);
    res.status(500).json({ message: "Error in getting multiple users" });
  }
};
