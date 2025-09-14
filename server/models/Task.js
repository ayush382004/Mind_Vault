// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  assignedToAgent: { type: Boolean, default: false },
  agentType: { type: String, default: "none" },
  agentSupported: { type: Boolean, default: false },
  status: { type: String, default: "pending" }, // "pending", "assigned", "manual", "done"
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Task", taskSchema);
