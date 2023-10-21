import jwt from "jsonwebtoken";
const userSecret = process.env.USER_SECRET;
const partnerSecret = process.env.PARTNER_SECRET;
const adminSecret = process.env.ADMIN_SECRET;
import User from "../models/userModel.js";
import Partner from "../models/partnerModel.js";

export const userTokenVerify = async (req, res, next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({ message: "Access Denied" });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, userSecret);
    req.user = verified;
    if (verified.role == "user") {
      const user = await User.findOne({ email: verified.email });
      if (user.isBlocked) {
        return res.status(403).json({ message: "User is blocked " });
      } else {
        next();
      }
    } else {
      return res.status(403).json({ message: "Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const partnerTokenVerify = async (req, res, next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({ message: "Access Denied" });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, partnerSecret);
    req.partner = verified;
    if (verified.role == "partner") {
      const partner = await Partner.findOne({ email: verified.email });
      if (partner.isBlocked) {
        return res.status(403).json({ message: "Partner is blocked" });
      } else {
        next();
      }
    } else {
      return res.status(403).json({ message: "Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const adminTokenVerify = async (req, res, next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({ message: "Access Denied" });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, adminSecret);
    req.admin = verified;
    if (verified.role == "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
