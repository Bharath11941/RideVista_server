import Chat from "../models/chatModel.js";
import partnerModel from "../models/partnerModel.js";
import userModel from "../models/userModel.js";

export const createChat = async (req, res) => {
  try {
    const { senderId, recieverId } = req.body;
    const newChat = new Chat({ members: [senderId, recieverId] });
    const result = await newChat.save();

    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const partnerData = async (req,res) => {
  try {
    const {id} = req.params
    const result = await partnerModel.findOne({_id:id})
    res.status(200).json(result)
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
export const userData = async (req,res) => {
  try {
    const {id} = req.params
    const result = await userModel.findOne({_id:id})
    res.status(200).json(result)
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
export const userChats = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)
    const chat = await Chat.find({ members: { $in: [userId] } });
    console.log(chat,"from userchats")
    res.status(200).json(chat)
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const findChat = async (req,res) => {
  try {
    const {firstId,secondId} = req.params
    const chat = await Chat.findOne({members:{$all:[firstId,secondId]}})
    res.status(200).json(chat)
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
