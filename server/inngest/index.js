import { Inngest } from "inngest";
import { createDb } from "../configs/db.js";

export const inngest = new Inngest({ id: "project-management" });

const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }]
  },
  async ({ event }) => {
    const db = createDb()
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    await db.user.upsert({
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
    const db = createDb()
    const { user } = event.data;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    await db.user.upsert({
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

const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }]
  },
  async ({ event }) => {
    const db = createDb()
    const { data } = event;
    await db.user.delete({
      where: { id: data.id },
    });
  }
);

const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }]
  },
  async ({ event }) => {
    console.log('DB URL inside inngest:', process.env.DATABASE_URL?.substring(0, 30))
    const db = createDb()
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    await db.user.update({
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
  syncUserSession,
];