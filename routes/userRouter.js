import express from "express";
import {
  userSignup,
  emailOtpVerification,
  resendOtp,
  loginVerification,
  userGoogleLogin,
  forgetPassword,
  resetPassword,
  homeCarList,
  carBooking,
  verifyBooking,
  filterCarDateLocation,
  myBookings,
  cancelBooking,
  getUserDetails,
  reviewCar,
  reportCarOwner,
  updateProfileImage,
  updateProfile,
  carRatings,
} from "../controllers/userController.js";
import { userTokenVerify } from "../middlewares/authVerify.js";
import sanitizeInput from "../middlewares/inputSanitisation.js";
const userRoute = express();

userRoute.post("/signup", sanitizeInput, userSignup);
userRoute.post("/otp", sanitizeInput, emailOtpVerification);
userRoute.post("/resendOtp", sanitizeInput, resendOtp);
userRoute.post("/login", sanitizeInput, loginVerification);
userRoute.post("/googleLogin", sanitizeInput, userGoogleLogin);
userRoute.post("/forgetPassword", sanitizeInput, forgetPassword);
userRoute.put("/resetPassword/:id/:token", sanitizeInput, resetPassword);
userRoute.get("/homeCarList", homeCarList);
userRoute.post("/filterCars",sanitizeInput, filterCarDateLocation);
userRoute.get("/reviews/:id", carRatings);
userRoute.post("/carBooking", userTokenVerify, sanitizeInput, carBooking);
userRoute.post("/verifyPayment", userTokenVerify, verifyBooking);
userRoute.get("/myBookings/:userId", userTokenVerify, myBookings);
userRoute.get("/userDetails/:id", userTokenVerify, getUserDetails);
userRoute.post("/cancelBooking", userTokenVerify,sanitizeInput, cancelBooking);
userRoute.put("/reviewCar", userTokenVerify, sanitizeInput, reviewCar);
userRoute.patch("/reportOwner", userTokenVerify, sanitizeInput, reportCarOwner);
userRoute.patch(
  "/profileImage",
  userTokenVerify,
  sanitizeInput,
  updateProfileImage
);
userRoute.put("/editProfile", userTokenVerify, sanitizeInput, updateProfile);
export default userRoute;
