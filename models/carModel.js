import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Types.ObjectId,
    ref: "partner",
    required: true,
  },
  carName: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  fuelType: {
    type: String,
    required: true,
  },
  transitionType: {
    type: String,
    required: true,
  },
  modelType: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  verificationStatus: {
    type: String,
    default: "Pending",
  },
  carImages: {
    type: Array,
    required: true,
  },
  certificate: {
    type: String,
    required: true,
  },
  ratings: [
    {
      star: Number,
      description: String,
      postedBy: { type: mongoose.Types.ObjectId, ref: "user" },
      postedDate: { type: Date}
    },
  ],
  totalRating:{
    type:String,
    default:0
  },
  bookingDates: [
    {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
  ],
});
export default mongoose.model("car", carSchema);
