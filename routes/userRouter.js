import express from 'express';
import {userSignup,emailOtpVerification,resendOtp,loginVerification,userGoogleLogin,forgetPassword,resetPassword, homeCarList, carBooking, verifyBooking, filterCarDateLocation, myBookings, cancelBooking} from "../controllers/userController.js"
import {userTokenVerify} from "../middlewares/authVerify.js"
const userRoute = express()

userRoute.post('/signup',userSignup)
userRoute.post('/otp',emailOtpVerification)
userRoute.post('/resendOtp',resendOtp)
userRoute.post("/login",loginVerification)
userRoute.post('/googleLogin',userGoogleLogin)
userRoute.post("/forgetPassword",forgetPassword)
userRoute.put('/resetPassword/:id/:token',resetPassword)
userRoute.get('/homeCarList',homeCarList)
userRoute.post('/filterCars',filterCarDateLocation)
userRoute.post("/carBooking",userTokenVerify,carBooking)
userRoute.post("/verifyPayment",userTokenVerify,verifyBooking)
userRoute.get("/myBookings/:userId",userTokenVerify,myBookings)

userRoute.post("/cancelBooking",userTokenVerify,cancelBooking)

export default userRoute



