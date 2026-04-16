import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';
import projectRouter from './routes/projectRoutes.js';
import taskRouter from './routes/taskRoute.js';
import commentsRouter from './routes/commentsRoute.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => {
  res.send('Server is Live!');
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPreview: process.env.DATABASE_URL?.substring(0, 40) + '...',
    nodeEnv: process.env.NODE_ENV,
  });
});

app.use("/api/inngest", serve({ client: inngest, functions }));

//routes
app.use("/api/workspaces",protect, workspaceRouter)
app.use("/api/projects",protect,projectRouter)
app.use("/api/tasks",protect,taskRouter)
app.use("/api/comments",protect,commentsRouter)
// For local dev only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app; 