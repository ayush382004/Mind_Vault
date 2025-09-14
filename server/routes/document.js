import express from "express";
import multer from "multer";
import path from "path";
import pdf from "pdf-parse";

import { encryptMemory } from "../utils/encryptor.js";
import { uploadToLighthouse } from "../utils/uploadToLighthouse.js";
import Memory from "../models/Memory.js";

const documentRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Extract text from PDF using pdf-parse
export async function extractTextFromPDF(buffer) {
  const data = await pdf(buffer);
  return data.text.trim() || "No extractable text found in PDF.";
}

documentRouter.post("/upload", upload.single("document"), async (req, res) => {
  const { userId, tags = "", emotion = "neutral" } = req.body;
  const file = req.file;

  if (!userId || !file) {
    return res.status(400).json({ error: "Missing userId or file" });
  }

  try {
    console.log("📄 Document received:", file.originalname);

    const ext = path.extname(file.originalname).toLowerCase();
    let extractedText = "";

    if (ext === ".pdf") {
      extractedText = await extractTextFromPDF(file.buffer);
    } else if (ext === ".txt" || ext === ".md") {
      extractedText = file.buffer.toString("utf8").trim();
    } else {
      extractedText = `Unsupported file type: ${ext}`;
    }

    const base64Doc = file.buffer.toString("base64");
    const encryptedDoc = encryptMemory(base64Doc);
    const docUrl = await uploadToLighthouse(encryptedDoc);

    const encryptedText = encryptMemory(extractedText);
    const ipfsUrl = await uploadToLighthouse(encryptedText);

    const tagList =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const memory = await Memory.create({
      userId,
      content: `[📄 Document Uploaded] ${file.originalname}`,
      fileName: file.originalname,
      tags: [...tagList, "document"],
      emotion,
      ipfsUrl,
      voiceUrl: docUrl,
      encrypted: true,
    });

    console.log("✅ Document saved successfully");

    res.json({
      message: "📄 Document uploaded and stored.",
      memory,
      docUrl,
      ipfsUrl,
    });
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    res.status(500).json({ error: "Failed to upload and process document" });
  }
});

export default documentRouter;
