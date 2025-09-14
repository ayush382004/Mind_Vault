import mongoose from "mongoose";

const memorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String, required: true },
  fileName: { type: String },
  ipfsUrl: { type: String },
  voiceUrl: { type: String },
  encrypted: { type: Boolean, default: false },
  tags: [String],
  emotion: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Memory", memorySchema);
