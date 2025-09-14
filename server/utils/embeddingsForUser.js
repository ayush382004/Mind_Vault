import axios from "axios";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

import Memory from "../models/Memory.js";
import { decryptMemory } from "../utils/encryptor.js";

const userMemoryStores = new Map();

const formatMemoryText = (content, tags = []) => {
  const label = tags.includes("voice")
    ? "[🎙 Voice Memo]"
    : tags.includes("document")
    ? "[📄 Document]"
    : "[📝 Note]";
  return `${label} ${content}`;
};

const prepareEmbeddingsForUser = async (userId, forceRebuild = true) => {
  if (forceRebuild) {
    userMemoryStores.delete(userId);
  }

  if (userMemoryStores.has(userId)) {
    console.log(`📋 Using cached vector store for ${userId}`);
    return userMemoryStores.get(userId);
  }

  console.log(`⏳ Building fresh vector store for user: ${userId}`);

  const memories = await Memory.find({ userId });
  if (!memories || memories.length === 0) {
    console.warn(`⚠️ No memories found for userId: ${userId}`);
    return null;
  }

  const decryptedContents = await Promise.all(
    memories.map(async (m) => {
      try {
        if (m.encrypted && m.ipfsUrl) {
          const res = await axios.get(m.ipfsUrl);
          const decrypted = decryptMemory(res.data);
          return formatMemoryText(decrypted, m.tags);
        } else if (m.content && m.content !== "[🔐 Encrypted]") {
          return formatMemoryText(m.content, m.tags);
        }
        return null;
      } catch (err) {
        console.warn(
          `⚠️ Decryption failed for IPFS (${m.ipfsUrl}):`,
          err.message
        );
        return null;
      }
    })
  );

  const validText = decryptedContents.filter(Boolean).join("\n");

  if (!validText || validText.trim().length === 0) {
    console.warn(`⚠️ No valid memory text found for vectorization.`);
    return null;
  }

  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([validText]);

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  userMemoryStores.set(userId, vectorStore);
  console.log("📦 All vectorized memory chunks:");
  docs.forEach((doc, index) => {
    console.log(`--- Chunk ${index + 1} ---`);
    console.log(doc.pageContent);
    console.log();
  });

  console.log(`✅ Vector store ready for ${userId} with ${docs.length} chunks`);
  return vectorStore;
};

export default prepareEmbeddingsForUser;
