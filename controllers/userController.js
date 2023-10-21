import securePassword from "../utils/securePassword.js";
import sendEmail from "../utils/nodeMailer.js";
import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import Car from "../models/carModel.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();
let otpId;

export const userSignup = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const hashedPassword = await securePassword(password);
    const emailExist = await User.findOne({ email: email });
    if (emailExist) {
      return res
        .status(409)
        .json({ status: "User already registered with this email" });
    }

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      password: hashedPassword,
    });
    const userData = await user.save();
    otpId = await sendEmail(userData.name, userData.email, userData._id);

    res.status(201).json({
      status: `Otp has sent to ${email}`,
      user: userData,
      otpId: otpId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const emailOtpVerification = async (req, res) => {
  try {
    const { otp, userId } = req.body;
    const otpData = await Otp.find({ userId: userId });
    const { expiresAt } = otpData[otpData.length - 1];
    const correctOtp = otpData[otpData.length - 1].otp;
    if (otpData && expiresAt < Date.now()) {
      return res.status(401).json({ message: "Email OTP has expired" });
    }
    if (correctOtp === otp) {
      await Otp.deleteMany({ userId: userId });
      await User.updateOne(
        { _id: userId },
        { $set: { isEmailVerified: true } }
      );
      res.status(200).json({
        status: true,
        message: "User registered successfully,You can login now",
      });
    } else {
      res.status(400).json({ status: false, message: "Incorrect OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const resendOtp = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const { _id, name, email } = await User.findOne({ email: userEmail });
    const otpId = sendEmail(name, email, _id);
    if (otpId) {
      res.status(200).json({
        message: `An OTP has been resent to ${email}.`,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again later." });
  }
};
export const loginVerification = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not registered" });
    }
    if (user.isEmailVerified) {
      if (user.isBlocked === false) {
        const correctPassword = await bcrypt.compare(password, user.password);
        if (correctPassword) {
          const token = jwt.sign(
            { name: user.name, email: user.email, id: user._id, role: "user" },
            process.env.USER_SECRET,
            {
              expiresIn: "1h",
            }
          );
          res.status(200).json({ user, token, message: `Welome ${user.name}` });
        } else {
          return res.status(401).json({ message: "Incorrect password" });
        }
      } else {
        return res.status(403).json({ message: "User is blocked by admin" });
      }
    } else {
      return res.status(401).json({ message: "Email is not verified" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const userGoogleLogin = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const registeredUser = await User.findOne({ email: userEmail });
    if (!registeredUser) {
      return res.status(404).json({ message: "User is not regitered" });
    } else {
      if (registeredUser.isBlocked === true)
        return res.status(403).json({ message: "User is blocked " });

      const token = jwt.sign(
        {
          name: registeredUser.name,
          email: registeredUser.email,
          id: registeredUser._id,
          role: "user",
        },
        process.env.USER_SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({
        registeredUser,
        token,
        message: `Welome ${registeredUser.name}`,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const secret = process.env.PASSWORD_SECRET;
    const oldUser = await User.findOne({ email: userEmail });
    if (!oldUser) {
      return res.status(404).json({ message: "User is not regitered" });
    }
    const token = jwt.sign({ id: oldUser._id }, secret, { expiresIn: "5m" });
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Forgot password",
      text: `http://localhost:5173/resetPassword/${oldUser._id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ message: "Failed to send email for password reset." });
      } else {
        console.log("Email sent:", info.response);
        return res
          .status(200)
          .json({ message: "Email sent successfully for password reset." });
      }
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    try {
      const verify = jwt.verify(token, process.env.PASSWORD_SECRET);
      if (verify) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(
          { _id: id },
          { $set: { password: hashedPassword } }
        );
        return res
          .status(200)
          .json({ message: "Successfully changed password" });
      }
    } catch (error) {
      console.log(error.message);
      return res.status(400).json({ message: "Something wrong with token" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const HomeCarList = async (req, res) => {
  try {
    const carData = await Car.find();
    if (carData) {
      res.status(200).json({ cars: carData });
    } else {
      res
        .status(500)
        .json({ message: "Something wrong with finding car data" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};