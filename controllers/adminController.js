import Partner from "../models/partnerModel.js";
import User from "../models/userModel.js";
import Car from "../models/carModel.js";
import Booking from "../models/bookingModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const adminLogin = (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const userName = "Admin";
  try {
    const { email, password } = req.body;
    if (adminEmail === email) {
      if (adminPassword === password) {
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
      } else {
        res.status(403).json({ message: "Incorrect Password" });
      }
    } else {
      res.status(401).json({ message: "Incorrect email" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const usersList = async (req, res) => {
  try {
    const users = await User.find().populate({
      path: "report.reportedBy",
      select: "name",
    });
    res.status(200).json({ users });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const partnersList = async (req, res) => {
  try {
    const partners = await Partner.find().populate({
      path: "report.reportedBy",
      select: "name",
    });
    res.status(200).json({ partners });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const carsList = async (req, res) => {
  try {
    const cars = await Car.find().populate("partnerId");
    res.status(200).json({ cars });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const singleCarDetails = async (req, res) => {
  try {
    const { carId } = req.params;
    const car = await Car.findById(carId).populate("partnerId");
    res.status(200).json({ car });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const verifyCarDetails = async (req, res) => {
  try {
    const { carId, action } = req.body;
    if (action === "approve") {
      const car = await Car.findByIdAndUpdate(
        { _id: carId },
        { $set: { verificationStatus: "Approved" } },
        { new: true }
      );
      res.status(200).json({ succMessage: "Arroved", car });
    } else {
      const car = await Car.findByIdAndUpdate(
        { _id: carId },
        { $set: { verificationStatus: "Rejected" } },
        { new: true }
      );
      res.status(200).json({ errMessage: "Rejected", car });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const userBlock = async (req, res) => {
  try {
    const { userId, status } = req.body;
    await User.findByIdAndUpdate(
      { _id: userId },
      { $set: { isBlocked: !status } }
    );
    res.status(200).json({ message: "updated" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const partnerBlock = async (req, res) => {
  try {
    const { partnerId, status } = req.body;
    await Partner.findByIdAndUpdate(
      { _id: partnerId },
      { $set: { isBlocked: !status } }
    );
    res.status(200).json({ message: "updated" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const totalBookings = async (req,res) => {
  try {
    const bookingList = await Booking.find()
      .populate("car")
      .populate("user")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({ bookingList });

  } catch (error) {
     console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}
export const AdminReport = async (req, res) => {
  try {
    const totalRevenue = await Booking.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: {
              $multiply: ["$totalBookingCharge", 0.2], // 20% of totalBookingCharge
            },
          },
          totalBookings: { $sum: 1 }, // Counting the number of bookings
        },
      },
    ]);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const earningsByMonth = await Booking.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
          $expr: { $eq: [{ $month: "$createdAt" }, currentMonth] },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          monthlyEarnings: {
            $sum: { $multiply: ["$totalBookingCharge", 0.2] },
          },
        },
      },
    ]);

    const currentMonthEarnings = earningsByMonth.find(
      (monthEarnings) => monthEarnings._id === currentMonth
    );

    const monthName = currentDate.toLocaleString("default", { month: "long" });
    let date = new Date();
    let year = date.getFullYear();
    let currentYear = new Date(year, 0, 1);
    let users = []
    let usersByYear = await User.aggregate([
      {
        $match: { createdAt: { $gte: currentYear }, isBlocked: { $ne: true } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    for (let i = 1; i <= 12; i++) {
      let result = true;
      for (let j = 0; j < usersByYear.length; j++) {
        result = false;
        if (usersByYear[j]._id == i) {
          users.push(usersByYear[j]);
          break;
        } else {
          result = true;
        }
      }
      if (result) users.push({ _id: i, count: 0 });
    }
    let usersData = [];
    for (let i = 0; i < users.length; i++) {
      usersData.push(users[i].count);
    }

    let partners = []
    let partnersByYear = await Partner.aggregate([
      {
        $match: { createdAt: { $gte: currentYear }, isBlocked: { $ne: true } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    for (let i = 1; i <= 12; i++) {
      let result = true;
      for (let j = 0; j < partnersByYear.length; j++) {
        result = false;
        if (partnersByYear[j]._id == i) {
          partners.push(partnersByYear[j]);
          break;
        } else {
          result = true;
        }
      }
      if (result) partners.push({ _id: i, count: 0 });
    }
    let partnersData = [];
    for (let i = 0; i < partners.length; i++) {
      partnersData.push(partners[i].count);
    }
    const trendingCarsDetails = await Booking.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: "$car",
          totalBookings: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalBookings: -1,
        },
      },
      {
        $limit: 4, // Adjust the limit as per your requirement
      },
      {
        $lookup: {
          from: "cars", // Replace "cars" with the actual name of your Car model's collection
          localField: "_id",
          foreignField: "_id",
          as: "carDetails",
        },
      },
      {
        $unwind: "$carDetails",
      },
      {
        $project: {
          _id: "$carDetails._id",
          totalBookings: 1,
          carDetails: {
            carName: "$carDetails.carName",
            carImage:"$carDetails.carImages",
            price:"$carDetails.price" // Replace with actual field names
            // Add other fields you need from the Car model
          },
        },
      },
    ]);
    
    const result = {
      totalRevenue: totalRevenue[0] || { totalEarnings: 0, totalBookings: 0 },
      currentMonthEarnings: currentMonthEarnings || { monthlyEarnings: 0 },
      currentMonthName: monthName,
      partnersData,
      usersData,
      trendingCarsDetails
    };

    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
