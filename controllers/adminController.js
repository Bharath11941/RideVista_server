import Partner from "../models/partnerModel.js";
import User from '../models/userModel.js'
import Car from '../models/carModel.js'
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const adminLogin = (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const userName = "Admin"
  try {
    const { email, password } = req.body;
    if(adminEmail === email){
      if(adminPassword === password){
        const token = jwt.sign(
          {
            name: userName,
            email: adminEmail,
            role: "admin",
          },
          process.env.ADMIN_SECRET,
          {
            expiresIn: "1h",
          }
        );
        res
          .status(200)
          .json({ userName, token, message: `Welome ${userName}` });
      }else{
        res.status(403).json({message:"Incorrect Password"})
      }
    }else{
      res.status(401).json({message:"Incorrect email"})
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const usersList = async (req,res) => {
  try {
    const users = await User.find().populate({
      path: "report.reportedBy",
      select: "name",
    })
    res.status(200).json({users})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}

export const partnersList = async (req,res) => {
  try {
    
    const partners = await Partner.find().populate({
      path: "report.reportedBy",
      select: "name",
    })
    res.status(200).json({partners})

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}
export const carsList = async (req,res) => {
  try {
    const cars = await Car.find().populate('partnerId')
    res.status(200).json({cars})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}
export const singleCarDetails = async (req,res) => {
  try {
    const {carId} = req.params
    const car = await Car.findById(carId).populate('partnerId')
    res.status(200).json({car})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}
export const verifyCarDetails = async (req,res) => {
  try {
    const {carId,action} = req.body
    if(action === "approve"){
      const car = await Car.findByIdAndUpdate({_id:carId},{$set:{verificationStatus:"Approved"}},{new:true})
      res.status(200).json({succMessage:"Arroved",car})
    }else{
      const car = await Car.findByIdAndUpdate({_id:carId},{$set:{verificationStatus:"Rejected"}},{new:true})
      res.status(200).json({errMessage:"Rejected",car})
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
} 
export const userBlock = async (req,res) => {
  try {
    const {userId,status} = req.body
    await User.findByIdAndUpdate({_id:userId},{$set:{isBlocked:!status}})
    res.status(200).json({message:"updated"})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}

export const partnerBlock = async (req,res) => {
  try {
    const {partnerId,status} = req.body
    await Partner.findByIdAndUpdate({_id:partnerId},{$set:{isBlocked:!status}})
    res.status(200).json({message:"updated"})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}