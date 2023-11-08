import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
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
  wallet: {
    type: Number,
    default: 0,
  },

})

export default mongoose.model("user",userSchema)