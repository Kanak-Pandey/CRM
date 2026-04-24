import express from "express";
import { addMember, getUserWorkspaces,createWorkspace } from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get('/',getUserWorkspaces)
workspaceRouter.post('/create', createWorkspace)
workspaceRouter.post('/add-member',addMember)

export default workspaceRouter