import Tesseract from 'tesseract.js';
import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * OCR text extraction from image buffer using Tesseract
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>}
 */
export async function extractTextFromImage(imageBuffer) {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
  return text.trim();
}

/**
 * AI-based image analysis if no good OCR result
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - original file name (used for mime detection)
 * @returns {Promise<string>}
 */
export async function analyzeImageWithAI(buffer, filename = 'image.jpg') {
  const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const base64 = buffer.toString('base64');

  const payload = {
    model: "compound-beta",
    messages: [
      {
        role: "system",
        content: "You are an intelligent assistant that summarizes images into notes."
      },
      {
        role: "user",
        content: "Describe this image in 3 lines as a memory note."
      }
    ],
    images: [
      {
        type: "image_url",
        image_url: `data:${mimeType};base64,${base64}`
      }
    ]
  };

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    payload,
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content.trim();
}
