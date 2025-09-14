import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { encryptMemory } from "../utils/encryptor.js";
import { uploadToLighthouse } from "../utils/uploadToLighthouse.js";
import Memory from "../models/Memory.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

router.post("/voice-memory", upload.single("audio"), async (req, res) => {
  const { userId, emotion = "neutral" } = req.body;

  let tags = [];
  if (typeof req.body.tags === "string") {
    tags = req.body.tags.split(",").map(tag => tag.trim());
  }

  if (!userId || !req.file || !req.file.buffer) {
    return res.status(400).json({ error: "Missing userId or audio file" });
  }

  try {
    console.log("🎧 Audio file received in memory:", req.file.originalname);

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype || "audio/mpeg",
    });
    formData.append("model", "distil-whisper-large-v3-en");

    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const transcript = groqRes.data.text;
    console.log("📝 Transcript:", transcript);

    // Encrypt transcript & upload to IPFS
    const encryptedTranscript = encryptMemory(transcript);
    const ipfsUrl = await uploadToLighthouse(encryptedTranscript);

    // Encrypt audio buffer (base64)
    const base64Audio = req.file.buffer.toString("base64");
    const encryptedAudio = encryptMemory(base64Audio);
    const voiceUrl = await uploadToLighthouse(encryptedAudio);

    // Save to MongoDB
    const memory = await Memory.create({
      userId,
      content: "[🎙️ Voice Note Transcribed]",
      tags: [...tags, "voice"],
      emotion,
      ipfsUrl,
      voiceUrl,
      encrypted: true,
    });

    console.log("✅ Voice memory stored:", memory._id);
    res.json({ message: "Voice memory saved", memory, transcript });

  } catch (err) {
    console.error("❌ Error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to process voice memory" });
  }
});

export default router;
