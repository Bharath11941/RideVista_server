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
    // const chat = await Chat.find({ members: { $in: [userId] } }).sort({ timestamp: -1 });
    // console.log(chat,'chat')
    // res.status(200).json(chat)
    const chats = await Chat.aggregate([
      {
        $match: { members: userId },
      },
      {
        $lookup: {
          from: 'messages', // Replace with the actual name of your messages collection
          let: { chatIdToString: { $toString: '$_id' } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$chatId", "$$chatIdToString"] }, // Match on the converted chatId
              },
            },
            {
              $sort: { createdAt: -1 }, // Sort messages in descending order based on timestamp
            },
            {
              $limit: 1, // Get only the latest message
            },
          ],
          as: 'messages',
        },
      },
      {
        $addFields: {
          lastMessageTimestamp: {
            $ifNull: [{ $first: '$messages.createdAt' }, null],
          },
        },
      },
      {
        $sort: { lastMessageTimestamp: -1 }, // Sort chats based on the latest message timestamp
      },
    ]);
    res.status(200).json(chats);
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




