import express  from "express";
import {  partnerData, userChats, userData } from "../controllers/chatController.js";

const chatRouter = express.Router()

chatRouter.get('/partnerData/:id',partnerData)
chatRouter.get('/userData/:id',userData)
chatRouter.get("/:userId",userChats)


export default chatRouter