const mongoose = require("mongoose")

const partnerSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true,
  },
  mobile:{
    type:Number,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  isEmailVerified:{
    type:Boolean,
    default:false
  },
  isBlocked:{
    type:Boolean,
    default:false
  },

})

module.exports = mongoose.model("partner",partnerSchema)