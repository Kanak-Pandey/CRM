import { db } from "../configs/db.js";

// create project
export const createProject= async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {workspaceId, description, name, status, start_date, end_date,team_members, team_lead, progress, priority}=req.body;

        //check user has admin role for workspace
        const workspace= await db.workspace.findUnique({
            where: {id: workspaceId},
            include: {members: {include: {user: true}}}
        })

        if(!workspace){
            return res.status(404).json({
                message:"WorkSpace not found"
            })
        }
        if(!workspace.members.some((member)=> member.userId=== userId && member.role ==="ADMIN")){
            return res.status(403).json({
                message:"You don't hace permission to create project in this workspace"
            })
        }

        //get team lead using email
        const teamLead= await db.user.findUnique({
            where: {email: team_lead},
            select: {id: true}
        }) 

        const project= await db.project.create({
            data:{
                workspaceId,
                description,
                name,
                status,
                priority,
                progress,
                team_lead: teamLead?.id,
                start_date: start_date? new Date(start_date): null,
                end_date: end_date? new Date(end_date) :null,
            }
        })

        //add members to project if they are in the workspace
        // After creating ProjectMembers in createProject:
if (team_members?.length > 0) {
    const membersToAdd = []
    workspace.members.forEach(member => {
        if (team_members.includes(member.user.email)) {
            membersToAdd.push(member.user.id)
        }
    })
    
    await db.projectMember.createMany({
        data: membersToAdd.map(memberId => ({
            projectId: project.id,
            userId: memberId
        }))
    })

    // ✅ Ensure all project members are also workspace members
    for (const memberId of membersToAdd) {
        const exists = await db.workspaceMember.findFirst({
            where: { userId: memberId, workspaceId }
        })
        if (!exists) {
            await db.workspaceMember.create({
                data: { userId: memberId, workspaceId, role: "MEMBER" }
            })
        }
    }
}
        const projectWithMembers= await db.project.findUnique({
            where: {id:project.id},
            include:{
                members: {include: {user: true}},
                tasks: {include: {assignee: true, comments: {include: {user: true}}}},
                owner: true
            }
        })

        res.json({project: projectWithMembers, message:"Project created successfully"})
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.code || error.message
        })
    }
}

//update project
export const updateProject= async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {id, workspaceId, description, name, status, start_date, end_date,team_members, team_lead, progress, priority}=req.body;

        //check if user has ADMIN role for workspace
        const workspace= await db.workspace.findUnique({
            where: {id: workspaceId},
            include: {members: {include: {user: true}}}
        })

        if(!workspace){
            return res.status(404).json({message:"Workspace not found"})
        }
        if(!workspace.members.some((member)=>member.userId === userId && member.role==="ADMIN")){
            const project=await db.project.findUnique({
                where: {id}
            })
            if(!project){
                return res.status(404).json({message:"Project not found"});
            }else if(project.team_lead!=userId){
                return res.status(403).json({ message:"You don't have permission to update projects in this workspace"});
            }
        }

        const project = await db.project.update({
            where:{ id},
            data: {
                workspaceId,
                description,
                name,
                status,
                priority,
                progress,
                start_date: start_date? new Date(start_date): null,
                end_date: end_date? new Date(end_date) :null,
            }
        })

        res.json({project, message:"Project updated successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.code || error.message
        })
    }
}

//Add member to project
export const addMember = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {projectId} = req.params;
        const {email} = req.body;

        const project = await db.project.findUnique({
            where: {id: projectId},
            include: { members: {include: {user: true}}}
        })

        if (!project) {
            return res.status(404).json({message: "Project not found"});
        } else if (project.team_lead != userId) {
            return res.status(403).json({message: "You don't have permission to update projects in this workspace"});
        }

        const existingMember = project.members.find((member) => member.user.email === email) // ← was member.email, bug fix
        if (existingMember) {
            return res.status(400).json({message: "User is already member"})
        }

        const user = await db.user.findUnique({where: {email}});
        if (!user) {
            return res.status(404).json({message: "User not Found"})
        }

        // Add to project
        const member = await db.projectMember.create({
            data: {
                userId: user.id,
                projectId
            }
        })

        // ✅ Also add to workspace if not already a member
        const existingWorkspaceMember = await db.workspaceMember.findFirst({
            where: {
                userId: user.id,
                workspaceId: project.workspaceId
            }
        })

        if (!existingWorkspaceMember) {
            await db.workspaceMember.create({
                data: {
                    userId: user.id,
                    workspaceId: project.workspaceId,
                    role: "MEMBER"
                }
            })
        }

        res.json({member, message: "Member Added Successfully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}