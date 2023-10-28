import  mongoose  from "mongoose";

const bookingSchema = new mongoose.Schema({
  user:{
    type:mongoose.Types.ObjectId,
    ref:"user",
    required:true
  },
  car:{
    type:mongoose.Types.ObjectId,
    ref:"car",
    required:true
  },
  totalBookingCharge:{
    type:Number,
    required:true
  },
  startDate:{
    type:Date,
    required:true,
  },
  endDate:{
    type:Date,
    required:true
  },
  paymentStatus:{
    type:String,
    default:"Pending"
  }
},{timestamps:true})

export default mongoose.model('booking',bookingSchema)