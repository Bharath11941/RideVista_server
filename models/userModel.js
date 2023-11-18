import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  referalCode:{
    type:String,
    required:true,
    unique:true
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  report: [
    { 
      reportedBy: { type: mongoose.Types.ObjectId, ref: "partner" },
      reason : String
    },
  ],
  walletHistory: [
    {
      date: {
        type: Date,
      },
      amount: {
        type: Number,
      },
      description: {
        type: String,
      },
    },
  ],
  wallet: {
    type: Number,
    default: 0,
  },
},{timestamps:true});

export default mongoose.model("user", userSchema);
