import express from "express";
const adminRoute = express();
import {
  adminLogin,
  partnersList,
  usersList,
  userBlock,
  partnerBlock,
  carsList,
  singleCarDetails,
  verifyCarDetails,
  AdminReport,
  totalBookings
} from "../controllers/adminController.js";

import { adminTokenVerify } from "../middlewares/authVerify.js";
adminRoute.post("/login", adminLogin);
adminRoute.get("/users", adminTokenVerify, usersList);
adminRoute.get("/partners", adminTokenVerify, partnersList);
adminRoute.get("/cars", adminTokenVerify, carsList);
adminRoute.get('/singleCarDetails/:carId',adminTokenVerify,singleCarDetails)
adminRoute.patch('/verifyCar',adminTokenVerify,verifyCarDetails)
adminRoute.patch("/blockUser", adminTokenVerify, userBlock);
adminRoute.patch("/blockPartner", adminTokenVerify, partnerBlock);
adminRoute.get('/report',adminTokenVerify,AdminReport)
adminRoute.get('/bookings',adminTokenVerify,totalBookings)
export default adminRoute;
