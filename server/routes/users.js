import { Router } from "express";
import User from "../models/User.js";

const userRouter = Router();

userRouter.post("/users", async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: "Missing UID or email" });
  }

  try {
    let user = await User.findOne({ uid });
    let isNewUser = false;

    if (!user) {
      user = new User({ uid, email, displayName, photoURL });
      await user.save();
      isNewUser = true;
      console.log("👤 New user saved:", displayName || email);
    } else {
      console.log("🔄 Returning user:", displayName || email);
    }

    res.json({ message: "User verified/saved", user, isNewUser });
  } catch (err) {
    console.error("❌ Error saving user:", err.message);
    res.status(500).json({ error: "Failed to save user" });
  }
});

export default userRouter;