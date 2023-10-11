const mongoose = require("mongoose")

require("dotenv").config()

module.exports = {
  dbconnect:()=>{
    mongoose.connect(process.env.MONGO_URL,{
      useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(()=>{
      console.log("database connected successfully")
    }).catch((err)=>{
      console.log(err);
    })
  }
}