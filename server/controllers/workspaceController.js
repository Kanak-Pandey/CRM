import { db } from "../configs/db.js";

export const createWorkspace = async (req, res) => {
    try {
        const { userId } = await req.auth()
        const { name } = req.body
        const slug = name.toLowerCase().replace(/\s+/g, '-')

        const workspace = await db.workspace.create({
            data: {
                id: `ws_${Date.now()}`,
                name,
                slug,
                ownerId: userId,
                image_url: '',
                members: {
                    create: {
                        userId,
                        role: 'ADMIN'
                    }
                }
            },
            include: { members: { include: { user: true } }, projects: true, owner: true }
        })

        res.json({ workspace })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
//get all workspace for user
export const getUserWorkspaces = async(req,res)=>{
    try{
        const {userId}=await req.auth();
        const workspaces=await db.workspace.findMany({
            where:{
                members: {some: {userId: userId}}
            },
            include:{
                members:{include :{user: true}},
                projects:{
                    include:{
                        tasks:{include:{assignee: true,comments: {include:{user:true}}}},
                        members:{include:{user:true}}
                    }
                },
                owner: true
            }
        });
        res.json({workspaces})
    }catch(error){
        console.log(error);
        res.status(500).json({
            msg: error.code || error.message
        })
    }
}

//add memeber to workspace
export const addMember =async(req,res)=>{
    try{
        const {userId}= await req.auth();
        const {email,role,workspaceId,message }= req.body;

        //check of user exists
        const user= await db.user.findUnique({
            where:{email}
        })
        if(!user){
            return res.status(404).json({
                message:"User Not Found"
            })
        }
        if(!workspaceId || !role){
            return res.status(404).json({
                message:"Missing required parameters"
            })
        }
        if(!["ADMIN","MEMBER"].includes(role)){
            return res.status(404).json({
                message:"Invalid Role"
            })
        }

        //fetch workspace
        const workspace=await db.workspace.findUnique({
            where :{id:workspaceId},include: {members:true}
        })
        if(!workspace){
            return res.status(403).json({
                message:"workspace not found"
            })
        }

        //check creator has admin role or not
        if(!workspace.members.find((member)=>member.userId==userId && member.role=="ADMIN")){
            return res.status(401).json({
                message:"You dont have admin privileges"
            })
        }

        //check if user is already a member
        const existingMember = workspace.members.find((member)=> member.userId===user.id);
        if( existingMember ){
            return res.status(400).json({message:"User is already a member"})
        }

        const member =await db.workspaceMember.create({
            data:{
                userId:user.id,
                workspaceId,
                role,
                message
            }
        })

        res.json({member,message:"Memeber Added Sussessfully"})
    }catch(error){
        console.log(error);
        res.status(500).json({
            msg: error.code || error.message
        })
    }
}