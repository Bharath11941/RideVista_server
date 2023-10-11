const express = require("express")
const userController = require("../controllers/userController")
const authVerify = require("../middlewares/authVerify")
const userRoute = express()

userRoute.post('/signup',userController.userSignup)
userRoute.post('/otp',userController.emailOtpVerification)
userRoute.post('/resendOtp',userController.resendOtp)
userRoute.post("/login",userController.loginVerification)
userRoute.post('/googleLogin',userController.userGoogleLogin)
userRoute.post("/forgetPassword",userController.forgetPassword)
userRoute.put('/resetPassword/:id/:token',userController.resetPassword)

module.exports = userRoute



