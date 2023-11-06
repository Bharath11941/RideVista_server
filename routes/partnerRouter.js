import express from 'express';
const partnerRoute = express()
import { partnerTokenVerify } from '../middlewares/authVerify.js';
import {partnerRegister,partnerEmailVerify,partnerResendOtp,partnerResetPassword,partnerLoginVerify,partnerLoginWithGoogle,addCar, MyCarListDetails, editcarDetails, editCar,partnerForgotPass, deleteCarImage} from "../controllers/partnerController.js"


partnerRoute.post('/signup',partnerRegister)
partnerRoute.post('/otp',partnerEmailVerify)
partnerRoute.post('/resendOtp',partnerResendOtp)
partnerRoute.post('/login',partnerLoginVerify)
partnerRoute.post('/googleLogin',partnerLoginWithGoogle)
partnerRoute.post('/partnerForget',partnerForgotPass)
partnerRoute.patch('/partnerResetPass/:id/:token',partnerResetPassword)
partnerRoute.post('/addCar',partnerTokenVerify,addCar)
partnerRoute.get('/myCars/:partnerId',partnerTokenVerify,MyCarListDetails)
partnerRoute.get('/editcarDetails/:carId',partnerTokenVerify,editcarDetails)
partnerRoute.put('/editCar',partnerTokenVerify,editCar)
partnerRoute.patch("/deleteImage",partnerTokenVerify,deleteCarImage)

export default partnerRoute














