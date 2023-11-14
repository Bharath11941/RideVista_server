import express from 'express'
import { addMessage } from '../controllers/messageController.js'

const messageRouter = express.Router()

messageRouter.post('/',addMessage)
messageRouter.get('/:chatId',getMessages)


export default messageRouter