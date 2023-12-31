import securePassword from "../utils/securePassword.js";
import sendEmail from "../utils/nodeMailer.js";
import Partner from "../models/partnerModel.js";
import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import Car from "../models/carModel.js";
import Bookings from "../models/bookingModel.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import chatModel from "../models/chatModel.js";
import { generateReferralCode } from "../utils/randomCode.js";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
dotenv.config();
let otpId;

export const userSignup = async (req, res) => {
  try {
    const { name, email, mobile, password, referralCode } = req.sanitisedData;
    const ownReferalCode = generateReferralCode(name);
    let referrer;
    const hashedPassword = await securePassword(password);
    const emailExist = await User.findOne({ email: email });
    if (emailExist) {
      return res
        .status(409)
        .json({ message: "User already registered with this email" });
    }
    if (referralCode) {
      referrer = await User.findOne({ referalCode: referralCode });

      if (!referrer) {
        return res.status(400).json({ message: "Invalid referral code." });
      }
    }
    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      password: hashedPassword,
      referalCode: ownReferalCode,
    });
    const userData = await user.save();
    if (referrer) {
      // Increase the wallet of the referring user by 50 rupees
      await User.updateOne(
        { _id: referrer._id },
        {
          $inc: { wallet: 50 },
          $push: {
            walletHistory: {
              date: new Date(),
              amount: +50,
              description: `Money credited through refferring ${userData.name}`,
            },
          },
        }
      );

      // Increase the wallet of the new user by 50 rupees
      await User.updateOne(
        { _id: userData._id },
        {
          $inc: { wallet: 50 },
          $push: {
            walletHistory: {
              date: new Date(),
              amount: +50,
              description: `Money credited through refferal code of ${referrer.name} `,
            },
          },
        }
      );
    }
    otpId = await sendEmail(userData.name, userData.email, userData._id);

    res.status(201).json({
      status: `Otp has sent to ${email}`,
      user: userData,
      otpId: otpId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const emailOtpVerification = async (req, res) => {
  try {
    const { otp, userId } = req.sanitisedData;
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
    const { userEmail } = req.sanitisedData;
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
    const { email, password } = req.sanitisedData;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "User not registered" });
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
          return res.status(403).json({ message: "Incorrect password" });
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
    const { userEmail } = req.sanitisedData;
    const registeredUser = await User.findOne({ email: userEmail });
    if (!registeredUser) {
      return res.status(401).json({ message: "User is not regitered" });
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
    const { userEmail } = req.sanitisedData;
    const secret = process.env.PASSWORD_SECRET;
    const oldUser = await User.findOne({ email: userEmail });
    if (!oldUser) {
      return res.status(401).json({ message: "User is not regitered" });
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
      text: `https://ride-vista-client.vercel.app/resetPassword/${oldUser._id}/${token}`,
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
    const { password } = req.sanitisedData;
    const { id, token } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({ message: "user not found" });
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
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await User.findOne({ _id: id });
    res.status(200).json({ userData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const { userId, image, prevImg } = req.sanitisedData;
    try {
      if (prevImg) {
        const publicId = prevImg.match(/\/v\d+\/(.+?)\./)[1]; // Extract public ID from URL

        const deletionResult = await cloudinary.uploader.destroy(publicId, {
          folder: "profileImage", // Optional, specify the folder if necessary
        });
      }

      const profileFile = await cloudinary.uploader.upload(image, {
        folder: "profileImage",
      });
      const userData = await User.findByIdAndUpdate(
        { _id: userId },
        { $set: { profileImage: profileFile.secure_url } },
        { new: true }
      );
      return res.status(200).json({ userData });
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res
        .status(500)
        .json({ message: "Error uploading image to Cloudinary" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { email, name, mobile } = req.sanitisedData;
    const userData = await User.findOneAndUpdate(
      { email: email },
      { $set: { name, mobile } },
      { new: true }
    );
    return res.status(200).json({ userData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const homeCarList = async (req, res) => {
  try {
    const carData = await Car.find({verificationStatus:"Approved"}).populate("partnerId").limit(6);
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
export const carBooking = async (req, res) => {
  try {
    const {
      _id,
      totalAmount,
      partnerId,
      startDate,
      endDate,
      userId,
      pickUpLocation,
      returnLocation,
      walletChecked,
    } = req.sanitisedData;
    let method = walletChecked ? "Wallet" : "Razorpay";
    const booking = new Bookings({
      user: userId,
      partner: partnerId,
      car: _id,
      totalBookingCharge: totalAmount,
      startDate,
      endDate,
      pickUpLocation,
      method,
      returnLocation,
    });
    const bookingData = await booking.save();
    if (walletChecked) {
      const user = await User.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            walletHistory: {
              date: new Date(),
              amount: -totalAmount,
              description: "Payment using wallet",
            },
          },
          $inc: { wallet: -totalAmount },
        },
        { new: true }
      );
      const bookingDetails = await Bookings.findByIdAndUpdate(
        { _id: bookingData._id },
        { $set: { bookingStatus: "Success" } },
        { new: true }
      );
      const carDetails = await Car.findByIdAndUpdate(
        { _id: _id },
        {
          $push: {
            bookingDates: {
              startDate: startDate,
              endDate: endDate,
            },
          },
        },
        { new: true }
      );
      const chatExist = await chatModel.findOne({
        members: { $all: [userId, partnerId] },
      });
      if (!chatExist) {
        const newChat = new chatModel({
          members: [userId.toString(), partnerId.toString()],
        });
        await newChat.save();
      }

      res.status(200).json({
        message: "Your booking succeffully completed",
        carDetails,
        user,
        bookingDetails,
      });
    } else {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
      });
      const options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "" + bookingData._id,
      };
      instance.orders.create(options, function (err, booking) {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Something went wrong" });
        }
        res.status(200).json({ bookingData: booking });
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyBooking = async (req, res) => {
  try {
    const { response, bookingData } = req.body;
    let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(
      response.razorpay_order_id + "|" + response.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac === response.razorpay_signature) {
      const bookingDetails = await Bookings.findByIdAndUpdate(
        { _id: bookingData.receipt },
        { $set: { bookingStatus: "Success" } },
        { new: true }
      );
      const carDetails = await Car.findByIdAndUpdate(
        { _id: bookingData.carId },
        {
          $push: {
            bookingDates: {
              startDate: bookingData.startDate,
              endDate: bookingData.endDate,
            },
          },
        },
        { new: true }
      );
      const chatExist = await chatModel.findOne({
        members: {
          $all: [
            bookingDetails.user.toString(),
            bookingDetails.partner.toString(),
          ],
        },
      });
      if (!chatExist) {
        const newChat = new chatModel({
          members: [
            bookingDetails.user.toString(),
            bookingDetails.partner.toString(),
          ],
        });
        await newChat.save();
      }

      res.status(200).json({
        message: "Your booking succeffully completed",
        carDetails,
        bookingDetails,
      });
    } else {
      await Bookings.deleteOne({ _id: bookingData.receipt });
      res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const reviewCar = async (req, res) => {
  try {
    const { carId, userId, rating, reason } = req.sanitisedData;
    const carData = await Car.findById(carId);
    let alreadyRated = carData.ratings.find(
      (user) => user.postedBy.toString() === userId.toString()
    );
    if (alreadyRated) {
      await Car.updateOne(
        { ratings: { $elemMatch: alreadyRated } },
        {
          $set: {
            "ratings.$.star": rating,
            "ratings.$.description": reason,
            "ratings.$.postedDate": Date.now(),
          },
        }
      );
    } else {
      await Car.findByIdAndUpdate(carId, {
        $push: {
          ratings: { star: rating, description: reason, postedBy: userId },
        },
      });
    }
    const getAllRatings = await Car.findById(carId);
    const totalRating = getAllRatings.ratings.length;
    const ratingSum = getAllRatings.ratings
      .map((rating) => rating.star)
      .reduce((prev, curr) => prev + curr, 0);
    const actualRating = (ratingSum / totalRating).toFixed(1);
    await Car.findByIdAndUpdate(carId, { $set: { totalRating: actualRating } });
    res
      .status(200)
      .json({ message: "Thank you so much.Your review has been recieved" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const carRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: "$ratings" },
      { $sort: { "ratings.postedDate": -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users", // Assuming your user collection is named "users"
          localField: "ratings.postedBy",
          foreignField: "_id",
          as: "ratings.postedBy",
        },
      },
      { $unwind: "$ratings.postedBy" },
      {
        $group: {
          _id: "$_id",
          ratings: { $push: "$ratings" },
        },
      },
    ]);

    // Extract the ratings array from the result
    const ratings = car.length > 0 ? car[0].ratings : [];

    res.status(200).json(ratings);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const filterCarDateLocation = async (req, res) => {
  try {
    const { pickUpLocation, returnLocation, pickUpDate, returnDate } =
      req.sanitisedData;
    const availableCars = await Car.aggregate([
      {
        $match: {
          $or: [
            { location: { $regex: new RegExp(pickUpLocation, "i") } },
            { location: { $regex: new RegExp(returnLocation, "i") } },
          ],
          verificationStatus:"Approved"
        },
      },
      {
        $lookup: {
          from: "partners",
          localField: "partnerId",
          foreignField: "_id",
          as: "partner",
        },
      },
    ]);
    const filteredCars = availableCars.filter((car) => {
      const bookingDates = car.bookingDates;
      if (!bookingDates || bookingDates.length === 0) {
        return true;
      }
      const pickUp = new Date(pickUpDate).getTime();
      const returnD = new Date(returnDate).getTime();
      for (const booking of bookingDates) {
        const startDate = booking.startDate.getTime();
        const endDate = booking.endDate.getTime();

        if (
          (pickUp >= startDate && pickUp < endDate) ||
          (returnD > startDate && returnD <= endDate)
        ) {
          return false;
        }
      }
      return true;
    });
    res.status(200).json({ cars: filteredCars });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const myBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookingList = await Bookings.find({ user: userId })
      .populate("car")
      .populate("partner")
      .sort({
        createdAt: -1,
      });
    res.status(200).json({ bookingList });
  } catch (error) {
    console.log(error.message);
  }
};
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason } = req.sanitisedData;
    const updataedData = await Bookings.findByIdAndUpdate(
      { _id: bookingId },
      { $set: { cancelReason: reason, cancelStatus: "Pending" } },
      { new: true }
    );
    const userId = updataedData.user;
    const bookingList = await Bookings.find({ user: userId })
      .populate("car")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      bookingList,
      message:
        "Cancel request has been sent.We will verify and refound your amount",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const reportCarOwner = async (req, res) => {
  try {
    const { userId, reason, ownerId } = req.sanitisedData;
    const partnerData = await Partner.findById(ownerId);
    let alreadyReported = partnerData.report.find(
      (partner) => partner.reportedBy.toString() === userId.toString()
    );
    if (alreadyReported) {
      await Partner.updateOne(
        { report: { $elemMatch: alreadyReported } },
        { $set: { "report.$.reason": reason } }
      );
    } else {
      await Partner.findByIdAndUpdate(ownerId, {
        $push: {
          report: { reason: reason, reportedBy: userId },
        },
      });
    }
    res.status(200).json({ message: "Successfully Reported Owner" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
