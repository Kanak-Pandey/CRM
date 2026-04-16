import express from "express"
import { addComment, gettaskComments } from "../controllers/commentsController.js"

const commentsRouter= express.Router()

commentsRouter.post('/',addComment)
commentsRouter.get('/:taskId', gettaskComments)

export default commentsRouter