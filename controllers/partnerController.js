import securePassword from "../utils/securePassword.js";
import partnerSendEmail from "../utils/nodeMailer.js";
import cloudinary from "../utils/cloudinary.js";
import Partner from "../models/partnerModel.js";
import Car from "../models/carModel.js";
import Otp from "../models/otpModel.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
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
      return res.status(404).json({ message: "Partner not registered" });
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
          return res
            .status(403)
            .json({ message: "Partner is blocked by admin" });
        }
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
      return res.status(404).json({ message: "Partner is not regitered" });
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
      return res.status(404).json({ message: "Partner is not regitered" });
    }
    const token = jwt.sign({ id: oldPartner._id }, secret, { expiresIn: "5m" });
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log("after transpot")
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: partnerEmail,
      subject: "Forgot password",
      text: `http://localhost:5173/partner/partnerReset/${oldPartner._id}/${token}`,
    };
    console.log("after mailoptons")
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
      return res.status(404).json({ message: "partner not found" });
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
      partnerId
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
      certificate:certificateFile.secure_url,
      carImages
    })
    res.status(201).json({message:"Car added successfully"})

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const MyCarListDetails = async (req,res) => {
  try {
    const {partnerId} = req.params
    const cars = await Car.find({partnerId:partnerId})
    if(cars){
      return res.status(200).json({cars})
    }else{
      return res.status(200).json({message:"something happened with finding car data"})
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}

export const editcarDetails = async(req,res) => {
  try {
    const {carId} = req.params
    const car = await Car.findById(carId)
    if(car){
      return res.json({car})
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}

export const editCar = async (req,res) => {
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
      carId
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
    await Car.findByIdAndUpdate({_id:carId},{$set:{
      carName,
      price,
      carImages,
      certificate:certificateFile.secure_url,
      fuelType,
      modelType,
      transitionType,
      location
    }})
    res.status(200).json({message:"Car updated"})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}