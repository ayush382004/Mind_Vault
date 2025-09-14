import express from 'express';
import Memory from '../models/Memory.js';
import { encryptMemory } from '../utils/encryptor.js';
import { uploadToLighthouse } from '../utils/uploadToLighthouse.js';

const router = express.Router();

router.post('/extension/save', async (req, res) => {
  const { userId, rawText, emotion } = req.body;

  if (!userId || !rawText) {
    return res.status(400).json({ error: 'Missing userId or rawText' });
  }

  try {
    const finalText = rawText;
    const encrypted = encryptMemory(finalText);
    const ipfsUrl = await uploadToLighthouse(encrypted);

    const newMem = new Memory({
      userId,
      content: "[🔐 Encrypted]",
      emotion: emotion || "neutral",
      tags: ["extension"],
      ipfsUrl,
      encrypted: true
    });

    await newMem.save();

    res.json({ message: 'Saved via extension (no summarization)', newMem , ipfsUrl});
  } catch (err) {
    console.error('❌ Extension save error:', err.message);
    res.status(500).json({ error: 'Failed to save extension memory' });
  }
});

export default router;
