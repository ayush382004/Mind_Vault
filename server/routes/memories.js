import { Router } from "express";
import Memory from "../models/Memory.js";
import { encryptMemory } from "../utils/encryptor.js";
import { uploadToLighthouse } from "../utils/uploadToLighthouse.js";
import prepareEmbeddingsForUser from "../utils/embeddingsForUser.js";

const memoryRouter = Router();

memoryRouter.post("/memories", async (req, res) => {
  const { userId, content, tags, emotion } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "Missing userId or content" });
  }

  try {
    const encrypted = encryptMemory(content);
    const ipfsUrl = await uploadToLighthouse(encrypted);

    const newMemory = new Memory({
      userId,
      content: "[🔐 Encrypted]",
      tags: tags || [],
      emotion: emotion || "neutral",
      ipfsUrl,
      encrypted: true,
    });

    await newMemory.save();
    console.log("✅ Encrypted memory stored for user:", userId);

    await prepareEmbeddingsForUser(userId);
    console.log("🔄 Vector store updated after memory upload");

    res.json({
      message: "Encrypted memory stored and embedded",
      memory: newMemory,
    });
  } catch (err) {
    console.error("❌ Failed to store memory:", err.message);
    res.status(500).json({ error: "Failed to store encrypted memory" });
  }
});

// GET: Fetch separate notes, voices, and documents
memoryRouter.get("/memories/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const allMemories = await Memory.find({ userId }).sort({ createdAt: -1 });

    const notes = allMemories.filter((mem) => mem.tags.includes("note"));
    const voices = allMemories.filter((mem) => mem.tags.includes("voice"));
    const documents = allMemories.filter((mem) =>
      mem.tags.includes("document")
    );
    const extensions = allMemories.filter((mem) =>
      mem.tags.includes("extension")
    );
    const images = allMemories.filter((mem) =>
      mem.tags.includes("image")
    );


    res.json({ notes, voices, documents, extensions,images });
  } catch (err) {
    console.error("❌ Failed to fetch memories:", err.message);
    res.status(500).json({ error: "Failed to fetch memories" });
  }
});

// GET: Fetch all combined memories (for debug or analysis)
memoryRouter.get("/memories/combined/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const memories = await Memory.find({ userId }).sort({ createdAt: -1 });
    res.json({ memories });
  } catch (err) {
    console.error("❌ Failed to fetch combined memories:", err.message);
    res.status(500).json({ error: "Failed to fetch combined memories" });
  }
});

export default memoryRouter;
