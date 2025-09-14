import express from 'express';
import multer from 'multer';
import { extractTextFromImage, analyzeImageWithAI } from '../utils/imageAnalyzer.js';
import { encryptMemory } from '../utils/encryptor.js';
import { uploadToLighthouse } from '../utils/uploadToLighthouse.js';
import Memory from '../models/Memory.js';
import fs from 'fs/promises';

const imageRouter = express.Router();

// 👇 Use memoryStorage to avoid saving to disk
const upload = multer({ storage: multer.memoryStorage() });

imageRouter.post('/upload/image', upload.single('file'), async (req, res) => {
  const { userId, tags = [], emotion = 'neutral' } = req.body;

  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No image buffer found" });
    }

    const buffer = req.file.buffer;
    const originalName = req.file.originalname;

    // 🧠 1. Try to extract text from image buffer (OCR)
    let text = await extractTextFromImage(buffer);
    if (!text || text.trim().length < 10) {
      // 🤖 2. If text is weak, use AI to analyze image buffer
      text = await analyzeImageWithAI(buffer, originalName); // Make sure your function accepts Buffer
    }

    // 🔐 3. Encrypt and Upload
    const encryptedText = encryptMemory(text);
    const ipfsUrl = await uploadToLighthouse(encryptedText);

    // 🧠 4. Save memory entry
    const newMemory = new Memory({
      userId,
      tags: [...tags, "image"],
      emotion,
      ipfsUrl,
      content: "[🔐 Encrypted]",
      encrypted: true,
    });

    await newMemory.save();

    res.json({ message: "✅ Image memory stored", memory: newMemory });
  } catch (err) {
    console.error("❌ Image upload error:", err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

export default imageRouter;
