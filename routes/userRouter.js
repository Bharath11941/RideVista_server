import express from 'express';
import {userSignup,emailOtpVerification,resendOtp,loginVerification,userGoogleLogin,forgetPassword,resetPassword, homeCarList, carBooking, verifyBooking, filterCarDateLocation} from "../controllers/userController.js"
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
userRoute.post("/carBooking",carBooking)
userRoute.post("/verifyPayment",verifyBooking)




export default userRoute



