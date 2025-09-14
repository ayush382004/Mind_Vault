import { Router } from "express";
import multer from "multer";
import fs from "fs";
import { extractTextFromImage } from "../utils/imageAnalyzer.js";
import { extractTextFromPDF } from "./document.js";

const upload = multer({ dest: "uploads/" });
const analyseRouter = Router();

analyseRouter.post("/analyse/:type", upload.single("buffer"), async (req, res) => {
  const { type } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    let extractedText = "";

    if (type === "image") {
      extractedText = await extractTextFromImage(file.path);
    } else if (type === "pdf") {
      const fileBuffer = fs.readFileSync(file.path);
      extractedText = await extractTextFromPDF(fileBuffer);
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    fs.unlinkSync(file.path); // cleanup uploaded file
    res.json({ text: extractedText });
  } catch (error) {
    console.error("Error analyzing file:", error);
    res.status(500).json({ error: "Failed to analyze file" });
  }
});

export default analyseRouter;
