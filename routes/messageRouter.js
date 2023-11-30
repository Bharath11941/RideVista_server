import express from 'express'
import { addMessage, getMessages } from '../controllers/messageController.js'
import sanitizeInput from '../middlewares/inputSanitisation.js'

const messageRouter = express.Router()


messageRouter.post('/',sanitizeInput,addMessage)
messageRouter.get('/:chatId',getMessages)


export default messageRouter


