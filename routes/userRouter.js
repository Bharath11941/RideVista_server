import express from 'express';
import {userSignup,emailOtpVerification,resendOtp,loginVerification,userGoogleLogin,forgetPassword,resetPassword, homeCarList, carBooking, verifyBooking, filterCarDateLocation, myBookings, cancelBooking, getUserDetails, reviewCar, reportCarOwner, updateProfileImage, updateProfile, carRatings} from "../controllers/userController.js"
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
userRoute.get('/reviews/:id',carRatings)
userRoute.post("/carBooking",userTokenVerify,carBooking)
userRoute.post("/verifyPayment",userTokenVerify,verifyBooking)
userRoute.get("/myBookings/:userId",userTokenVerify,myBookings)
userRoute.get('/userDetails/:id',userTokenVerify,getUserDetails)
userRoute.post("/cancelBooking",userTokenVerify,cancelBooking)
userRoute.put('/reviewCar',userTokenVerify,reviewCar)
userRoute.patch("/reportOwner",userTokenVerify,reportCarOwner)
userRoute.patch('/profileImage',userTokenVerify,updateProfileImage)
userRoute.put('/editProfile',userTokenVerify,updateProfile)
export default userRoute



