import { db } from "../configs/db.js";

//Add comment
export const addComment = async (req , res)=>{
    try {
        const {userId}= await req.auth();
        const {content, taskId}=req.body

        //check if user is project member

        const task= await db.task.findUnique({
            where:{ id: taskId}
        })

        const project =await db.project.findUnique({
            where:{id: task.projectId},
            include: {members: {include: {user: true}}}
        })

        if(!project){
            return res.status(404).json({message:"Project not found"})
        }

        const member= project.member.find((member) => member.userId === userId);
        if(!member){
            return res.status(403).json({message:"Your are not member of this project "})
        }

        const comment = await db.comment.create({
            data:{taskId,content,userId},
            include:{user: true}
        })

        res.json({comment})
    } catch (error) {
        console.log(error)
        res.status(500),json({message: error.code || error.message})
    }
}

//get comments for individual task
export const gettaskComments = async (req,res) =>{
    try {
        const {taskId} = req.params;
        const comments= await db.comment.findMany({
            where: {taskId},
            include:{ user: true}
        })

        res.json({comments})
    } catch (error) {
        console.log(error)
        res.status(500),json({message: error.code || error.message})
    }
}

