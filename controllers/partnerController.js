import securePassword from "../utils/securePassword.js";
import partnerSendEmail from "../utils/nodeMailer.js";
import cloudinary from "../utils/cloudinary.js";
import Partner from "../models/partnerModel.js";
import Car from "../models/carModel.js";
import Otp from "../models/otpModel.js";
import Bookings from "../models/bookingModel.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
dotenv.config();
let otpId;

export const partnerRegister = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const hashedPassword = await securePassword(password);
    const emailExist = await Partner.findOne({ email: email });
    if (emailExist) {
      return res
        .status(409)
        .json({ status: "Partner already registered with this email" });
    }
    const partner = new Partner({
      name: name,
      email: email,
      mobile: mobile,
      password: hashedPassword,
    });
    const partnerData = await partner.save();
    otpId = await partnerSendEmail(
      partnerData.name,
      partnerData.email,
      partnerData._id
    );

    res.status(201).json({
      status: `Otp has sent to ${email}`,
      partner: partnerData,
      otpId: otpId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const partnerEmailVerify = async (req, res) => {
  try {
    const { otp, partnerId } = req.body;
    const otpData = await Otp.find({ userId: partnerId });
    const { expiresAt } = otpData[otpData.length - 1];
    const correctOtp = otpData[otpData.length - 1].otp;
    if (otpData && expiresAt < Date.now()) {
      return res.status(401).json({ message: "Email OTP has expired" });
    }

    if (correctOtp === otp) {
      await Otp.deleteMany({ userId: partnerId });
      const partnerData = await Partner.updateOne(
        { _id: partnerId },
        { $set: { isEmailVerified: true } }
      );
      res.status(200).json({
        status: true,
        message: "Partner registered successfully,You can login now",
      });
    } else {
      res.status(400).json({ status: false, message: "Incorrect OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const partnerResendOtp = async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const { _id, name, email } = await Partner.findOne({ email: partnerEmail });
    const otpId = partnerSendEmail(name, email, _id);
    if (otpId) {
      res.status(200).json({
        message: `An OTP has been resent to ${email}.`,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const partnerLoginVerify = async (req, res) => {
  try {
    const { email, password } = req.body;
    const partner = await Partner.findOne({ email: email });
    if (!partner) {
      return res.status(401).json({ message: "Partner not registered" });
    }
    if (partner.isEmailVerified) {
      if (partner.isBlocked === false) {
        const correctPassword = await bcrypt.compare(
          password,
          partner.password
        );
        if (correctPassword) {
          const token = jwt.sign(
            {
              name: partner.name,
              email: partner.email,
              id: partner._id,
              role: "partner",
            },
            process.env.PARTNER_SECRET,
            {
              expiresIn: "1h",
            }
          );
          res
            .status(200)
            .json({ partner, token, message: `Welome ${partner.name}` });
        } else {
          return res.status(403).json({ message: "Incorrect Password" });
        }
      } else {
        return res.status(403).json({ message: "Partner is blocked by admin" });
      }
    } else {
      return res.status(401).json({ message: "Email is not verified" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const partnerLoginWithGoogle = async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const registeredPartner = await Partner.findOne({ email: partnerEmail });
    if (!registeredPartner) {
      return res.status(401).json({ message: "Partner is not regitered" });
    } else {
      if (registeredPartner.isBlocked === true)
        return res.status(403).json({ message: "Partner is blocked " });

      const token = jwt.sign(
        {
          name: registeredPartner.name,
          email: registeredPartner.email,
          id: registeredPartner._id,
          role: "partner",
        },
        process.env.PARTNER_SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({
        registeredPartner,
        token,
        message: `Welome ${registeredPartner.name}`,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const partnerForgotPass = async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const secret = process.env.PASSWORD_SECRET_PARTNER;
    const oldPartner = await Partner.findOne({ email: partnerEmail });
    if (!oldPartner) {
      return res.status(401).json({ message: "Partner is not regitered" });
    }
    const token = jwt.sign({ id: oldPartner._id }, secret, { expiresIn: "5m" });
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log("after transpot");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: partnerEmail,
      subject: "Forgot password",
      text: `http://localhost:5173/partner/partnerReset/${oldPartner._id}/${token}`,
    };
    console.log("after mailoptons");
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

export const partnerResetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(401).json({ message: "partner not found" });
    }
    try {
      const verify = jwt.verify(token, process.env.PASSWORD_SECRET_PARTNER);
      if (verify) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await Partner.findByIdAndUpdate(
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
export const addCar = async (req, res) => {
  try {
    const {
      certificate,
      carImage,
      carName,
      price,
      location,
      fuelType,
      transitionType,
      modelType,
      partnerId,
    } = req.body;
    const certificateFile = await cloudinary.uploader.upload(certificate, {
      folder: "CarDocuments",
    });
    const uploadPromises = carImage.map((image) => {
      return cloudinary.uploader.upload(image, {
        folder: "CarImages",
      });
    });
    // Wait for all the uploads to complete using Promise.all
    const uploadedImages = await Promise.all(uploadPromises);

    // Store the URLs in the carImages array
    let carImages = uploadedImages.map((image) => image.secure_url);
    await Car.create({
      carName,
      partnerId,
      price,
      location,
      fuelType,
      transitionType,
      modelType,
      certificate: certificateFile.secure_url,
      carImages,
    });
    res.status(201).json({ message: "Car added successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const MyCarListDetails = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const cars = await Car.find({ partnerId: partnerId });
    if (cars) {
      return res.status(200).json({ cars });
    } else {
      return res
        .status(200)
        .json({ message: "something happened with finding car data" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editcarDetails = async (req, res) => {
  try {
    const { carId } = req.params;
    const car = await Car.findById(carId);
    if (car) {
      return res.status(200).json({ car });
    }
    return res.status(404).json({ message: "Car not found" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editCar = async (req, res) => {
  try {
    const {
      certificate,
      carImage,
      carName,
      price,
      location,
      fuelType,
      transitionType,
      modelType,
      carId,
    } = req.body;
    let certificateFile;
    let existingImage = [];

    const existingCar = await Car.findById(carId);
    if (certificate.length === 0) {
      certificateFile = existingCar.certificate
    }else{
      certificateFile = await cloudinary.uploader.upload(certificate, {
        folder: "CarDocuments",
      })
    }
    if (carImage.length === 0) {
     existingImage = existingCar.carImages
    }else{
      const uploadPromises = carImage.map((image) => {
        return cloudinary.uploader.upload(image, {
          folder: "CarImages",
        });
      });
      // Wait for all the uploads to complete using Promise.all
      const uploadedImages = await Promise.all(uploadPromises);

      if (
        existingCar &&
        existingCar.carImages &&
        existingCar.carImages.length > 0
      ) {
        existingImage = existingCar.carImages;
      }

      // Store the URLs in the carImages array
      let carImages = uploadedImages.map((image) => image.secure_url);
      for (let i = 0; i < carImages.length; i++) {
        existingImage.push(carImages[i]);
      }
    }
    
    await Car.findByIdAndUpdate(
      { _id: carId },
      {
        $set: {
          carName,
          price,
          carImages: existingImage,
          certificate: certificateFile.secure_url,
          fuelType,
          modelType,
          transitionType,
          location,
        },
      }
    );
    res.status(200).json({ message: "Car updated" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const deleteCarImage = async (req, res) => {
  try {
    const { imageUrl, carId } = req.body;
    const publicId = imageUrl.match(/\/v\d+\/(.+?)\./)[1]; // Extract public ID from URL

    const deletionResult = await cloudinary.uploader.destroy(publicId, {
      folder: "CarImages", // Optional, specify the folder if necessary
    });

    if (deletionResult.result === "ok") {
    
      const updatedData = await Car.findByIdAndUpdate(
        { _id: carId },
        { $pull: { carImages: imageUrl } },
        { new: true }
      );
      if (!updatedData) {
        return res.status(404).json({ message: "Car not found" });
      }

      return res
        .status(200)
        .json({ message: "Image removed successfully", updatedData });
    } else {
      console.error(
        `Failed to delete image at ${imageUrl} in CarImages from Cloudinary.`
      );
      return res.status(500).json({ message: "image not found in cloudinary" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const bookingListParner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const bookingList = await Bookings.find({ partner: partnerId })
      .populate("car")
      .populate("user")
      .sort({
        timestampField: -1,
      });

    res.status(200).json({ bookingList });
  } catch (error) {
    console.log(error.message);
  }
};
export const cancelBookingPartner = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const updataedData = await Bookings.findByIdAndUpdate(
      { _id: bookingId },
      { $set: { cancelReason: reason, bookingStatus: "Cancelled" } },
      { new: true }
    );
    const partner = updataedData.partner;
    const userId = updataedData.user;
    const refoundAmount = 0.9 * updataedData.totalBookingCharge;
    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $inc: { wallet: refoundAmount },
        $push: {
          walletHistory: {
            date: new Date(),
            amount: +refoundAmount,
            description: `Refunded for cancel booking  - Booking Id: ${updataedData._id}`,
          },
        },
      }
    );
    const bookingList = await Bookings.find({ partner: partner })
      .populate("car")
      .sort({
        timestampField: -1,
      });

    res.status(200).json({
      bookingList,
      message: "Booking cancelled,Refound will be credited in your wallet",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const cancelRequests = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const totalRequests = await Bookings.find({
      cancelStatus: "Pending",
      partner: partnerId,
    })
      .populate("car")
      .populate("user")
      .sort({
        createdAt: -1,
      });
    res.status(200).json({ totalRequests: totalRequests });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const apporveCancelRequest = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    if (status === "Approved") {
      const updataedData = await Bookings.findByIdAndUpdate(
        { _id: bookingId },
        { $set: { bookingStatus: "Cancelled", cancelStatus: status } },
        { new: true }
      );
      const userId = updataedData.user;
      const refoundAmount = 0.9 * updataedData.totalBookingCharge;
      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: { wallet: refoundAmount },
          $push: {
            walletHistory: {
              date: new Date(),
              amount: +refoundAmount,
              description: `Refunded for cancel booking  - Booking Id: ${updataedData._id}`,
            },
          },
        }
      );
      const totalRequests = await Bookings.find({ cancelStatus: "Pending" })
        .populate("car")
        .sort({
          createdAt: -1,
        });
      res.status(200).json({
        totalRequests: totalRequests,
        message: "Cancel reuest has been appoved",
      });
    } else if (status === "Rejected") {
      const updataedData = await Bookings.findByIdAndUpdate(
        { _id: bookingId },
        { $set: { cancelStatus: status } },
        { new: true }
      );
      const totalRequests = await Bookings.find({ cancelStatus: "Pending" })
        .populate("car")
        .sort({
          createdAt: -1,
        });
      res.status(200).json({
        totalRequests: totalRequests,
        message: "Cancel reuest has been rejected",
      });
    }
  } catch (error) {}
};

export const changeBookingStatus = async (req, res) => {
  try {
    const { status, bookingId, startDate, endDate, carId } = req.body;
    await Bookings.findByIdAndUpdate(
      { _id: bookingId },
      { $set: { bookingStatus: status } }
    );
    if (status === "Returned") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      await Car.findByIdAndUpdate(
        { _id: carId._id },
        { $pull: { bookingDates: { startDate: start, endDate: end } } }
      );
    }
    res.status(200).json({ message: `Car Successfully Delivered to User` });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const carData = await Car.findById(id).populate({
      path: "ratings.postedBy",
      select: "name",
    });
    res.status(200).json(carData);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const reportUser = async (req, res) => {
  try {
    const { userId, reason, partnerId } = req.body;
    const userData = await User.findById(userId);
    let alreadyReported = userData.report.find(
      (user) => user.reportedBy.toString() === partnerId.toString()
    );
    if (alreadyReported) {
      await User.updateOne(
        { report: { $elemMatch: alreadyReported } },
        { $set: { "report.$.reason": reason } }
      );
    } else {
      await User.findByIdAndUpdate(userId, {
        $push: {
          report: { reason: reason, reportedBy: partnerId },
        },
      });
    }
    res.status(200).json({ message: "Successfully Reported User" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
