import mongoose from "mongoose"

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
  report: [
    { 
      reportedBy: { type: mongoose.Types.ObjectId, ref: "user" },
      reason : String
    },
  ],
  isBlocked:{
    type:Boolean,
    default:false
  },

},{timestamps:true})

export default mongoose.model("partner",partnerSchema)