import { Router } from "express";
import Task from "../models/Task.js";
import { detectAgentSupport } from "../utils/agentCapabilities.js";

import { executeAgentTask } from '../utils/executeAgentTask.js';

const router = Router();

// Create new task

router.post("/tasks", async (req, res) => {
  const { userId, title, description, assignedToAgent = false } = req.body;
  if (!userId || !title) return res.status(400).json({ error: "Missing userId or title" });

  const agentType = assignedToAgent ? detectAgentSupport(title + " " + description) : "none";
  const agentSupported = assignedToAgent && agentType !== null;
  const status = agentSupported ? "assigned" : assignedToAgent ? "manual" : "pending";

  const task = await Task.create({
    userId,
    title,
    description,
    assignedToAgent,
    agentType,
    agentSupported,
    status,
  });

  if (agentSupported && agentType === "blog") {
    const result = await executeAgentTask(task);
    if (result.success) {
      task.status = "done";
      task.link = result.link;
      await task.save();
    } else {
      console.error("Agent execution failed:", result.error);
    }
  }

  res.json({ task });
});


// Fetch tasks by status
router.get("/tasks/:userId", async (req, res) => {
  const { userId } = req.params;
  const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
  res.json({ tasks });
});

// Update task status (e.g. mark as done)
router.patch("/tasks/:taskId", async (req, res) => {
  const { status } = req.body;
  const task = await Task.findByIdAndUpdate(req.params.taskId, { status }, { new: true });
  res.json({ task });
});

// Delete task by ID
router.delete("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    await Task.findByIdAndDelete(taskId);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Failed to delete task:", err.message);
    res.status(500).json({ error: "Failed to delete task" });
  }
});


export default router;
