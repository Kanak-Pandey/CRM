import { Inngest } from "inngest";
import { prisma } from "../configs/db.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// Sync User Creation
const syncUserCreation = inngest.createFunction(
  { 
    id: "sync-user-from-clerk",
    // This is the correct way to define the trigger in v4
    triggers: [{ event: "clerk/user.created" }] 
  },
  async ({ event }) => {
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
    console.log(process.env.DATABASE_URL);
    await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: data.email_addresses[0]?.email_address,
        name: fullName,
        image: data.image_url,
      },
      create: {
        id: data.id,
        email: data.email_addresses[0]?.email_address,
        name: fullName,
        image: data.image_url,
      },
    });
  }
);

const syncUserSession = inngest.createFunction(
  { 
    id: "sync-user-session-clerk", 
    triggers: [{ event: "clerk/session.created" }] 
  },
  async ({ event }) => {
    const { user } = event.data; // Clerk nests the user object inside 'data' for sessions
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email_addresses[0]?.email_address,
        name: fullName,
        image: user.image_url,
      },
      create: {
        id: user.id,
        email: user.email_addresses[0]?.email_address,
        name: fullName,
        image: user.image_url,
      },
    });
  }
);

// Sync User Deletion
const syncUserDeletion = inngest.createFunction(
  { 
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }] 
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
      where: { id: data.id },
    });
  }
);

// Sync User Update
const syncUserUpdation = inngest.createFunction(
  { 
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }] 
  },
  async ({ event }) => {
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    await prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email_addresses[0]?.email_address,
        name: fullName,
        image: data.image_url,
      },
    });
  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncUserSession
];