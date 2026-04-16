import { Inngest } from "inngest";
import { db } from "../configs/db.js"; // back to simple import
import sendEmail from "../configs/nodemailer.js";


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
  { id: 'sync-workspace-from-clerk', triggers: [{ event: 'clerk/organization.created' }] },
  async ({ event }) => {
    const { data } = event;
    await db.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url || "",
      }
    })
    await db.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: 'ADMIN'
      }
    })
  }
)

const syncWorkspaceUpdation = inngest.createFunction(
  { id: 'update-workspace-from-clerk', triggers: [{ event: 'clerk/organization.updated' }] },
  async ({ event }) => {
    const { data } = event;
    await db.workspace.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url || "",
      }
    })
  }
)

const syncWorkspaceDeletion = inngest.createFunction(
  { id: 'delete-workspace-with-clerk', triggers: [{ event: 'clerk/organization.deleted' }] },
  async ({ event }) => {
    const { data } = event;
    await db.workspace.delete({
      where: { id: data.id }
    })
  }
)

const syncWorkspaceMemberCreation = inngest.createFunction(
  { id: 'sync-workspace-member-from-clerk', triggers: [{ event: 'clerk/organizationMembership.created' }] },
  async ({ event }) => {
    const { data } = event;
    await db.workspaceMember.create({
      data: {
        userId: data.public_user_data?.user_id,
        workspaceId: data.organization?.id,
        role: String(data.role).toUpperCase() === 'ORG:ADMIN' ? 'ADMIN' : 'MEMBER',
      }
    })
  }
)

//inngest function to send email on task creation
// ✅ Correct — 2 arguments, triggers inside first object
const sendTaskAssignmentEmail = inngest.createFunction(
  { 
    id: "send-task-assignment-mail",
    triggers: [{ event: "app/task.assigned" }]  // ← move trigger here
  },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true }
    });

    await sendEmail({
      to: task.assignee.email,
      subject: `New task assignment in ${task.project.name}`,
      body: `Hi ${task.assignee.name}, you have been assigned: ${task.title}. 
Due: ${new Date(task.due_date).toLocaleDateString()} 
<a href="${origin}">View Task</a>`
    });

    if (new Date(task.due_date).toDateString() !== new Date().toDateString()) {
      await step.sleepUntil('wait-for-the-due-date', new Date(task.due_date));

      await step.run('check-if-task-is-completed', async () => {
        const updatedTask = await db.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true }
        });

        if (!updatedTask) return;

        if (updatedTask.status !== "DONE") {
          await sendEmail({
            to: updatedTask.assignee.email,
            subject: `Reminder for ${updatedTask.project.name}`,
            body: `<div style="max-width:600px;">
              <h2>Hi ${updatedTask.assignee.name},</h2>
              <p>You have a task due in ${updatedTask.project.name}</p>
              <p style="font-weight:bold; color:#007bff;">${updatedTask.title}</p>
              <p><strong>Description:</strong> ${updatedTask.description}</p>
              <p><strong>Due Date:</strong> ${new Date(updatedTask.due_date).toLocaleDateString()}</p>
              <a href="${origin}" style="background:#007bff; padding:12px 24px; border-radius:5px; color:#fff; text-decoration:none;">
                View Task
              </a>
            </div>`
          });
        }
      });
    }
  }
);

export const functions = [
  syncUserCreation, 
  syncUserDeletion, 
  syncUserUpdation, 
  syncUserSession,
  syncWorkspaceCreation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation,
  syncWorkspaceUpdation,
  sendTaskAssignmentEmail
];