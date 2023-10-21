import mongoose from ("mongoose")

const otpPartnerSchema = new mongoose.Schema({
  partnerId: mongoose.Types.ObjectId,
  otp: String,
  createdAt: Date,
  expiresAt: Date

})

export default mongoose.model("partnerOtp",otpPartnerSchema)