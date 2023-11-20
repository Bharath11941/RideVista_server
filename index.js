import express from 'express';
import socketConnection from './socketIo.js';
import userRoute from "./routes/userRouter.js"
import partnerRoute from "./routes/partnerRouter.js"
import adminRoute from"./routes/adminRouter.js"
import chatRouter from './routes/chatRouter.js';
import messageRouter from './routes/messageRouter.js';
const app = express()
const PORT = process.env.PORT || 3000
import cors from 'cors'
import http from 'http'


import dbconnect from "./config/mongodb.js"
dbconnect()

app.use(cors({
  origin:"http://localhost:5173",
  methods:['GET','POST','PUT','PATCH'],
  credentials:true
}))

app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({limit:'50mb',extended:true}))


app.use("/",userRoute)
app.use('/partner',partnerRoute)
app.use('/admin',adminRoute)
app.use('/chat',chatRouter)
app.use('/message',messageRouter)

const server = http.createServer(app)
socketConnection(server)
server.listen(PORT,()=>{
  console.log(`server running on port http://localhost:${PORT}`);
})