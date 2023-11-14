import express from 'express';
const app = express()
const PORT = process.env.PORT || 3000
import cors from 'cors'



import dbconnect from "./config/mongodb.js"
dbconnect()

app.use(cors({
  origin:"http://localhost:5173",
  methods:['GET','POST','PUT','PATCH'],
  credentials:true
}))

app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({limit:'50mb',extended:true}))

import userRoute from "./routes/userRouter.js"
app.use("/",userRoute)

import partnerRoute from "./routes/partnerRouter.js"
app.use('/partner',partnerRoute)

import adminRoute from"./routes/adminRouter.js"
app.use('/admin',adminRoute)

import chatRouter from './routes/chatRouter.js';
app.use('/chat',chatRouter)

import messageRouter from './routes/messageRouter.js';
app.use('/message',messageRouter)

app.listen(PORT,()=>{
  console.log(`server running on port http://localhost:${PORT}`);
})