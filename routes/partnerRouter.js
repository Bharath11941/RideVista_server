const express = require('express')
const partnerRoute = express()
const partnerController = require("../controllers/partnerController")

partnerRoute.post('/signup',partnerController.partnerRegister)
partnerRoute.post('/otp',partnerController.partnerEmailVerify)
partnerRoute.post('/resendOtp',partnerController.partnerResendOtp)
partnerRoute.post('/login',partnerController.partnerLoginVerify)
partnerRoute.post('/googleLogin',partnerController.partnerLoginWithGoogle)


module.exports = partnerRoute



