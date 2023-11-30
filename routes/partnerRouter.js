import express from "express";
const partnerRoute = express();
import { partnerTokenVerify } from "../middlewares/authVerify.js";
import {
  partnerRegister,
  partnerEmailVerify,
  partnerResendOtp,
  partnerResetPassword,
  partnerLoginVerify,
  partnerLoginWithGoogle,
  addCar,
  MyCarListDetails,
  editcarDetails,
  editCar,
  partnerForgotPass,
  deleteCarImage,
  bookingListParner,
  cancelBookingPartner,
  changeBookingStatus,
  getReviews,
  cancelRequests,
  apporveCancelRequest,
  reportUser,
  partnerReport,
  updateProfileImage,
  updateProfile,
} from "../controllers/partnerController.js";
import sanitizeInput from "../middlewares/inputSanitisation.js";

partnerRoute.post("/signup", sanitizeInput, partnerRegister);
partnerRoute.post("/otp", sanitizeInput, partnerEmailVerify);
partnerRoute.post("/resendOtp", sanitizeInput, partnerResendOtp);
partnerRoute.post("/login", sanitizeInput, partnerLoginVerify);
partnerRoute.post("/googleLogin", sanitizeInput, partnerLoginWithGoogle);
partnerRoute.post("/partnerForget", sanitizeInput, partnerForgotPass);
partnerRoute.patch(
  "/partnerResetPass/:id/:token",
  sanitizeInput,
  partnerResetPassword
);
partnerRoute.post("/addCar", partnerTokenVerify, sanitizeInput, addCar);
partnerRoute.get("/myCars/:partnerId", partnerTokenVerify, MyCarListDetails);
partnerRoute.get("/editcarDetails/:carId", partnerTokenVerify, editcarDetails);
partnerRoute.put("/editCar", partnerTokenVerify, sanitizeInput, editCar);
partnerRoute.patch("/deleteImage", partnerTokenVerify, deleteCarImage);
partnerRoute.get("/bookingsPartner/:partnerId", bookingListParner);
partnerRoute.post(
  "/cancelBooking",
  partnerTokenVerify,
  sanitizeInput,
  cancelBookingPartner
);
partnerRoute.patch("/changeStatus", partnerTokenVerify, changeBookingStatus);
partnerRoute.get("/getReviews/:id", partnerTokenVerify, getReviews);
partnerRoute.get(
  "/cancelRequests/:partnerId",
  partnerTokenVerify,
  cancelRequests
);
partnerRoute.patch("/approveCancel", partnerTokenVerify, apporveCancelRequest);
partnerRoute.patch(
  "/reportUser",
  partnerTokenVerify,
  sanitizeInput,
  reportUser
);
partnerRoute.get("/report/:partnerId", partnerTokenVerify, partnerReport);
partnerRoute.patch(
  "/profileImage",
  partnerTokenVerify,
  sanitizeInput,
  updateProfileImage
);
partnerRoute.put(
  "/editProfile",
  partnerTokenVerify,
  sanitizeInput,
  updateProfile
);
export default partnerRoute;
