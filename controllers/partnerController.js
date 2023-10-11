const Partner = require("../models/partnerModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const Otp = require("../models/otpModel");
const securePassword = require("../utils/securePassword");
const partnerSendEmail = require("../utils/nodeMailer");
let otpId;

const partnerRegister = async (req, res) => {
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
    otpId = await partnerSendEmail.sendEmail(
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
const partnerEmailVerify = async (req, res) => {
  try {
    const { otp, partnerId } = req.body;
    console.log("server", partnerId);
    const otpData = await Otp.find({ userId: partnerId });
    console.log(otpData, "otp data");
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
const partnerResendOtp = async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const { _id, name, email } = await Partner.findOne({ email: partnerEmail });
    const otpId = partnerSendEmail.sendEmail(name, email, _id);
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

const partnerLoginVerify = async (req, res) => {
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
const partnerLoginWithGoogle = async (req,res) => {
  try {
    const { partnerEmail } = req.body;
    console.log(partnerEmail,"controller");
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
      res
        .status(200)
        .json({
          registeredPartner,
          token,
          message: `Welome ${registeredPartner.name}`,
        });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}
module.exports = {
  partnerRegister,
  partnerEmailVerify,
  partnerResendOtp,
  partnerLoginVerify,
  partnerLoginWithGoogle,
};
