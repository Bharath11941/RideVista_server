const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  otp: String,
  createdAt: Date,
  expiresAt: Date

})

module.exports = mongoose.model("otp",otpSchema)