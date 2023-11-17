import express  from "express";
import { createChat, findChat, partnerData, userChats, userData } from "../controllers/chatController.js";

const chatRouter = express.Router()

chatRouter.post('/',createChat)
chatRouter.get('/partnerData/:id',partnerData)
chatRouter.get('/userData/:id',userData)
chatRouter.get("/:userId",userChats)
chatRouter.get("/find/:firstId/:secondId",findChat)

export default chatRouter