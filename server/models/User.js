import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  photoURL: String,
  createdAt: { type: Date, default: Date.now },
  preferences: {
    theme: { type: String, default: "dark" },
    aiPersonality: { type: String, default: "empathetic" },
  },
});

export default mongoose.model("User", userSchema);
