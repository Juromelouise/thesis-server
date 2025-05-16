const User = require("../model/User");
const sendToken = require("../utils/jwtToken");
const { uploadSingle } = require("../utils/cloudinaryUploader");
const path = require("path");
const { email } = require("../utils/Email");

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
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
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
    const users = await User.findWithDeleted();
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }
    const data = users.filter((user) => user.role === "user");

    res.status(200).json({
      success: true,
      users: data,
    });
  } catch (e) {
    console.error("Error in Getting all users: ", e);
    res.status(500).json({ message: "Error in Getting all users" });
  }
};

exports.banUser = async (req, res) => {
  try {
    console.log(req.file);
    console.log(req.body);
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.banUser();
    const data = await User.findWithDeleted();
    const emailData = {
      to: user.email,
      subject: "Account Banned",
      text: `Your account has been banned. Please contat csupport for more information.`,
      html: `
      <div style="max-width:480px;margin:40px auto;padding:32px 24px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);font-family:'Segoe UI',Arial,sans-serif;">
        <div style="text-align:center;">
        <svg width="64" height="64" fill="none" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="32" fill="#ff4d4f"/>
          <path d="M20 20l24 24M44 20L20 44" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <h2 style="color:#ff4d4f;margin:24px 0 8px;font-size:2rem;font-weight:700;">Account Banned</h2>
        <p style="color:#333;font-size:1.1rem;line-height:1.6;margin-bottom:24px;">
          Your account has been <span style="color:#ff4d4f;font-weight:600;">banned</span>.<br>
          Please contact our support team for more information or to appeal this decision.
        </p>
        <a href="mailto:juromefernando@example.com" style="display:inline-block;padding:12px 28px;background:#ff4d4f;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;box-shadow:0 2px 8px rgba(255,77,79,0.12);transition:background 0.2s;">Contact Support</a>
        </div>
      </div>
      `,
    };
    await email(emailData)
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
