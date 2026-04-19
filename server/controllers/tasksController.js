import { db } from "../configs/db.js";
import { inngest } from "../inngest/index.js";

export const createTask = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {projectId, title, description, type, status, priority, assigneeId, due_date} = req.body;
        const origin = req.get('origin');

        const project = await db.project.findUnique({
            where: {id: projectId}, 
            include: {members: {include: {user: true}}}
        })
        if (!project) {
            return res.status(404).json({message: "Project Not Found"});
        } else if (project.team_lead != userId) {
            return res.status(403).json({message: "You don't have admin privileges for this project"});
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) { 
            return res.status(403).json({message: "Assignee is not a member of the project"});
        }

        const task = await db.task.create({
            data: {
                projectId,
                title,
                description,
                priority,
                assigneeId: assigneeId || null,
                status,
                type,
                due_date: due_date ? new Date(due_date) : null 
            }
        })

        const taskWithAssignee = await db.task.findUnique({
            where: {id: task.id},
            include: {assignee: true}
        })

        await inngest.send({
            name: "app/task.assigned",
            data: {taskId: task.id, origin}
        })

        res.json({task: taskWithAssignee, message: "Task created successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.code || error.message})
    }
}

export const updateTask = async (req, res) => {
    try {
        const task = await db.task.findUnique({
            where: {id: req.params.id}
        })
        if (!task) {
            return res.status(404).json({message: "Task not found"})
        }

        const {userId} = await req.auth();
        const project = await db.project.findUnique({
            where: {id: task.projectId},
            include: {members: {include: {user: true}}}
        })
        if (!project) {
            return res.status(404).json({message: "Project Not Found"});
        } else if (project.team_lead != userId) {
            return res.status(403).json({message: "You don't have admin privileges for this project"});
        }

        const updatedTask = await db.task.update({
            where: {id: req.params.id},
            data: req.body
        })

        res.json({task: updatedTask, message: "Task updated successfully"}) 
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.code || error.message}) 
    }
}

export const deleteTask = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {taskIds} = req.body

        const tasks = await db.task.findMany({
            where: {id: {in: taskIds}}
        })
        if (tasks.length === 0) {
            return res.status(404).json({message: "Tasks not found"})
        }

        const project = await db.project.findUnique({
            where: {id: tasks[0].projectId}, 
            include: {members: {include: {user: true}}}
        })
        if (!project) {
            return res.status(404).json({message: "Project Not Found"});
        } else if (project.team_lead != userId) {
            return res.status(403).json({message: "You don't have admin privileges for this project"});
        }

        await db.task.deleteMany({
            where: {id: {in: taskIds}}
        })

        res.json({message: "Tasks deleted successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.code || error.message}) 
    }
}