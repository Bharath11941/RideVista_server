const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000
const cors = require('cors')



const db = require("./config/mongodb")
db.dbconnect()

app.use(cors({
  origin:"http://localhost:5173",
  methods:['GET','POST','PUT','PATCH'],
  credentials:true
}))

app.use(express.json())
app.use(express.urlencoded({extended:true}))

const userRoute = require("./routes/userRouter")
app.use("/",userRoute)

const partnerRoute = require("./routes/partnerRouter")
app.use('/partner',partnerRoute)

const adminRoute = require("./routes/adminRouter")
app.use('/admin',adminRoute)


app.get('/',(req,res)=>{
  res.send("hello world from server")
})

app.listen(PORT,()=>{
  console.log(`server running on port http://localhost:${PORT}`);
})