import 'dotenv/config'
import { Inngest } from "inngest";
import { db } from "../configs/db.js"; // ✅ single import, correct name

export const inngest = new Inngest({ id: "project-management" });

// Sync User Creation
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },        // ✅ correct v4 syntax
  async ({ event }) => {
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    await db.user.upsert({               // ✅ using 'db' not 'prisma'
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

// Sync User Session
const syncUserSession = inngest.createFunction(
  { id: "sync-user-session-clerk" },
  { event: "clerk/session.created" },     // ✅ correct v4 syntax
  async ({ event }) => {
    const { user } = event.data;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    await db.user.upsert({               // ✅ using 'db'
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
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },        // ✅ correct v4 syntax
  async ({ event }) => {
    const { data } = event;
    await db.user.delete({               // ✅ using 'db'
      where: { id: data.id },
    });
  }
);

// Sync User Update
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },        // ✅ correct v4 syntax
  async ({ event }) => {
    const { data } = event;
    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    await db.user.update({               // ✅ using 'db'
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