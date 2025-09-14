import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

if (!SECRET_KEY) {
  throw new Error("❌ ENCRYPTION_SECRET is missing in .env");
}

/**
 * Encrypt plain text using AES and a secret key
 * @param {string} text - The text to encrypt
 * @returns {string} - AES encrypted string
 */
export function encryptMemory(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

/**
 * Decrypt AES-encrypted text using the secret key
 * @param {string} cipherText - The encrypted string to decrypt
 * @returns {string} - Decrypted plain text
 */
export function decryptMemory(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error("❌ Failed to decrypt: invalid or tampered ciphertext.");
  return decrypted;
}
