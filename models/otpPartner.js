const mongoose = require("mongoose")

const otpPartnerSchema = new mongoose.Schema({
  partnerId: mongoose.Types.ObjectId,
  otp: String,
  createdAt: Date,
  expiresAt: Date

})

module.exports = mongoose.model("partnerOtp",otpPartnerSchema)