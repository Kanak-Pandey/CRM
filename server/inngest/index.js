import { Inngest } from "inngest";
import { db } from "../configs/db.js"; // back to simple import

export const inngest = new Inngest({ id: "project-management" });

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk", triggers: [{ event: "clerk/user.created" }] },
  async ({ event }) => {
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
    await db.user.upsert({
      where: { id: data.id },
      update: { email: data.email_addresses[0]?.email_address, name: fullName, image: data.image_url },
      create: { id: data.id, email: data.email_addresses[0]?.email_address, name: fullName, image: data.image_url },
    });
  }
);

const syncUserSession = inngest.createFunction(
  { id: "sync-user-session-clerk", triggers: [{ event: "clerk/session.created" }] },
  async ({ event }) => {
    const { user } = event.data;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    await db.user.upsert({
      where: { id: user.id },
      update: { email: user.email_addresses[0]?.email_address, name: fullName, image: user.image_url },
      create: { id: user.id, email: user.email_addresses[0]?.email_address, name: fullName, image: user.image_url },
    });
  }
);

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    await db.user.delete({ where: { id: event.data.id } });
  }
);

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk", triggers: [{ event: "clerk/user.updated" }] },
  async ({ event }) => {
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
    await db.user.update({
      where: { id: data.id },
      data: { email: data.email_addresses[0]?.email_address, name: fullName, image: data.image_url },
    });
  }
);

//inngest fucntion to save workspace data to a databse  
const syncWorkspaceCreation = inngest.createFunction(
  {id:'sync-workspace-from-clerk'},
  {event:'clerk/organization.created'},
  async({event})=>{
    const {data}=event;
    await Prisma.workspace.create({
      data: {
        id:data.id,
        name: data.name,
        slug: data.slug,
        ownerId:data.created_by,
        image_url: data.image_url,
      }
    })

    //add creater as Admin memeber
    await prisma.workspaceMember.create({
      data:{
        userId: data.created_by,
        workspaceId: data.id,
        role:'ADMIN'
      }
    })
  }
)

//inngest function to add the workspace data in the database
const syncWorkspaceUpdation =inngest.createFunction(
  {id: 'update-workspacce-from-clerk'},
  {event:'clerk/organization.updated'},
  async({event})=>{
    const {data} =event;
    await prisma.workspace.update({
      where:{
        id:data.id
      },
      data:{
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      }
    })
  }
)

//inngest function to delete workspace
const syncWorkspaceDeletion=inngest.createFunction(
  {id:'delete-workspce-with-clerk'},
  {event:'clerk/organization.deleted'},
  async({event})=>{
    const {data}=event;
    await prisma.workspace.delete({
      where:{
        id: data.id
      }
    })
  }
)

//inngest function to save workspace member data  to a database

const syncWorkspaceMemberCreation=inngest.createFunction(
  {id:'sync-workspace-member-from-clerk'},
  {event:'clerk/organizationInvitation.accepted'},
  async({event})=>{
    const{data}=event;
    await prisma.workspaceMember.create({
      data:{
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase(),
      }
    }
      
    )
  }
)
export const functions = [
  syncUserCreation, 
  syncUserDeletion, 
  syncUserUpdation, 
  syncUserSession,
  syncWorkspaceCreation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation,
  syncWorkspaceUpdation];