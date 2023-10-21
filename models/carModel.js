import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
  partnerId : {
    type:mongoose.Types.ObjectId,
    ref:'partner',
    required:true
  },
  carName:{
    type:String,
    required:true
  },
  price:{
    type:String,
    required:true
  },
  fuelType:{
    type:String,
    required:true
  },
  transitionType:{
    type:String,
    required:true
  },
  modelType:{
    type:String,
    required:true
  },
  location:{
    type:String,
    required:true
  },
  verificationStatus:{
    type:String,
    default:"Pending"
  },
  carImages:{
    type:Array,
    required:true,
  },
  certificate:{
    type:String,
    required:true
  }

})
export default mongoose.model('car',carSchema)