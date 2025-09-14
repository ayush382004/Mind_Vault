import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

/**
 * Uploads any content (text or base64 audio) to Lighthouse IPFS
 * @param {string | Buffer} content - The content to upload (encrypted transcript or audio)
 * @param {string} filename - The name of the file (e.g., "audio.txt" or "memory.txt")
 * @param {string} mimeType - The MIME type (e.g., "text/plain" or "audio/mpeg")
 * @returns {Promise<string>} IPFS URL
 */
export async function uploadToLighthouse(content, filename = "file.txt", mimeType = "text/plain") {
  if (!LIGHTHOUSE_API_KEY) {
    throw new Error("❌ LIGHTHOUSE_API_KEY missing in .env");
  }

  const form = new FormData();
  form.append("file", Buffer.from(content), {
    filename,
    contentType: mimeType,
  });

  try {
    const res = await axios.post("https://node.lighthouse.storage/api/v0/add", form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${LIGHTHOUSE_API_KEY}`,
      },
    });

    const { Hash: cid } = res.data;
    const url = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    console.log("✅ Uploaded to IPFS:", url);
    return url;
  } catch (err) {
    console.error("❌ Upload failed:", err.response?.data || err.message);
    throw new Error("Failed to upload to Lighthouse");
  }
}
