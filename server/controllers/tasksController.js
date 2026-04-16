//create task

import { db } from "../configs/db.js";
import { inngest } from "../inngest/index.js";

export const createTask = async (req, res)=>{
    try {
        const {userId}= await req.auth();
        const {projectId, title , description, type, status, priority, assigneeId, due_date} =req.body;
        const origin= req.get('origin')

        //CHECK IF USER HAVE ADMIN ROLE FOR PROJECT
        const project= await db.project.findUnique({
            where: {projectId},
            include: {members: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message: "Project Not Found"});
        }else if(project.team_lead != userId){
            return res.status(404).json({message: "You don't have admin priveleges for this project"});
        }else if(assigneeId && !project.members.find((member)=>{member.user.id === assigneeId})){
            return res.status(403).json({message:"Assignee is not a member of the project/workspace"})
        }

        const task= await  db.task.create({
            data: {
                projectId,
                title,
                description,
                priority,
                assigneeId,
                status,
                dur_date: new Date(due_date)
            }
        })

        const taskWithAsignee= await db.task.findUnique({
            where: {id: task.id},
            include: {assignee: true}
        })

        await inngest.send({
            name:"app/task.assigned",
            data:{
                taskId:task.id, origin
            }
        })
        res.json({task: taskWithAsignee, message:"Task created successfully"})
    } catch (error) {
        console.log(error)
        res.status(500),json({message: error.code || error.message})
    }
}

//update task
export const updateTask = async (req, res)=>{
    try {
        const task= await db.task.findUnique({
            where:{id: req.params.id}
        })

        if(!task){
            return res.status(404).json({message:"Task not found"})
        }
        const {userId}= await req.auth();
    
        const project = await db.project.findUnique({
            where: {id: task.projectId},
            include: {members: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message: "Project Not Found"});
        }else if(project.team_lead != userId){
            return res.status(404).json({message: "You don't have admin priveleges for this project"});
        }

        const updatedTask = await db.task.update({
            where: {id: req.params.id},
            data: req.body
        })

        res.json({task: updateTask, message:"Task updated successfully"})
    } catch (error) {
        console.log(error)
        res.status(500),json({message: error.code || error.message})
    }
}

//delete task
export const deleteTask = async (req, res)=>{
    try {
       
        const {userId}= await req.auth();
        const {taskIds}=req.body
        const tasks=await db.task.findMany({
            where:{id:{in:taskIds}}
        })

        if(tasks.length == 0 ){
            return res.status(404).json({message:"Task not found"})
        }
 
        const project = await db.project.findUnique({
            where: {id: task[0].projectId},
            include: {members: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message: "Project Not Found"});
        }else if(project.team_lead != userId){
            return res.status(404).json({message: "You don't have admin priveleges for this project"});
        }

        await db.task.deleteMany({
            where:{id:{in:taskIds}}
        })

        res.json({message:"Task deleted successfully"})
    } catch (error) {
        console.log(error)
        res.status(500),json({message: error.code || error.message})
    }
}