import { Router } from "express";
import Memory from "../models/Memory.js";
import ChatMessage from "../models/ChatMessage.js";
import prepareEmbeddingsForUser from "../utils/embeddingsForUser.js";
import getAIReply from "../utils/getAIReply.js";
import { decryptMemory } from "../utils/encryptor.js";
import axios from "axios";

const queryRouter = Router();

const classifyIntent = async (message) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "compound-beta",
        messages: [
          {
            role: "system",
            content: "You are an intent classifier. Analyze the user message and return ONLY the most relevant intent from the given list. Be precise and consider context.",
          },
          {
            role: "user",
            content: `Classify this message: "${message}"\n\nAvailable intents:\n- hackathon_idea: Ideas, brainstorming, innovation\n- project_discussion: Technical projects, coding, development\n- personal_event: Life events, experiences, personal stories\n- reminder: Tasks, deadlines, things to remember\n- career_help: Job advice, career guidance, professional development\n- general: Everything else\n\nRespond with only the intent name.`,
          },
        ],
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    const intent = response.data.choices[0].message.content.trim().toLowerCase();
    const validIntents = ["hackathon_idea", "project_discussion", "personal_event", "reminder", "career_help", "general"];
    
    return validIntents.includes(intent) ? intent : "general";
  } catch (err) {
    console.warn("⚠️ Failed to classify intent:", err.message);
    return "general";
  }
};

const scoreContextRelevance = (context, message) => {
  if (!context || !message) return 0;
  
  const messageWords = message.toLowerCase().split(/\s+/)
    .filter(word => word.length > 2);
  const contextLower = context.toLowerCase();
  
  let exactMatches = 0;
  let partialMatches = 0;
  
  messageWords.forEach(word => {
    if (contextLower.includes(word)) {
      exactMatches++;
    } else {
      const partialMatch = contextLower.split(/\s+/).some(cWord => 
        cWord.includes(word) || word.includes(cWord)
      );
      if (partialMatch) partialMatches++;
    }
  });
  
  const score = (exactMatches * 1.0 + partialMatches * 0.5) / Math.max(messageWords.length, 1);
  return Math.min(score, 1.0);
};


const getMemoryLabel = (tags = []) => {
  if (tags.includes("voice")) return "🎙 Voice Memo";
  if (tags.includes("document")) return "📄 Document";
  return "📝 Note";
};

// Updated memory retrieval
const getRelevantMemories = async (userId, message, intent) => {
  const memories = [];
  const keywords = message.toLowerCase().split(/\s+/);

  try {
    console.log(`🔍 Searching vector store for: "${message}"`);
    const vectorStore = await prepareEmbeddingsForUser(userId);
    
    if (vectorStore) {
      const docs = await vectorStore.similaritySearch(message, 8);
      console.log(`📋 Found ${docs.length} vector matches`);
      
      docs.forEach((doc, index) => {
        console.log(`Vector Match ${index + 1}:`, doc.pageContent.substring(0, 100) + "...");
        const score = scoreContextRelevance(doc.pageContent, message);
        memories.push({
          content: doc.pageContent,
          score: score + 0.3,
          source: "🧠 Vector Memory",
        });
      });
    }

    // Encrypted IPFS memories
    const encryptedMemories = await Memory.find({ 
      userId, 
      encrypted: true, 
      ipfsUrl: { $exists: true } 
    });
    
    console.log(`🔐 Found ${encryptedMemories.length} encrypted memories`);
    
    for (const mem of encryptedMemories) {
      try {
        const res = await axios.get(mem.ipfsUrl);
        const decrypted = decryptMemory(res.data);
        const score = scoreContextRelevance(decrypted, message);
        const matchedKeyword = keywords.find((kw) => decrypted.toLowerCase().includes(kw));

        if (score > 0.05 || matchedKeyword) {
          memories.push({
            content: decrypted,
            score: score + (matchedKeyword ? 0.2 : 0),
            source: getMemoryLabel(mem.tags),
          });
        }
      } catch (err) {
        console.warn("⚠️ Decryption failed for IPFS memory:", err.message);
      }
    }

    const keywordRegex = keywords.filter((k) => k.length > 2).join("|");
    if (keywordRegex) {
      const keywordQuery = {
        userId,
        $or: [
          { content: { $regex: keywordRegex, $options: "i" } },
          { tags: { $in: keywords } },
        ],
      };
      
      const keywordMatches = await Memory.find(keywordQuery).limit(10);
      console.log(`🔑 Found ${keywordMatches.length} keyword matches`);
      
      keywordMatches.forEach((mem) => {
        const score = scoreContextRelevance(mem.content, message);
        memories.push({
          content: mem.content,
          score: score + 0.15,
          source: getMemoryLabel(mem.tags),
        });
      });
    }

    const uniqueMemories = memories.filter((mem, index, self) => 
      index === self.findIndex(m => m.content === mem.content)
    );

    const sortedMemories = uniqueMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    console.log(`✅ Returning ${sortedMemories.length} relevant memories`);
    sortedMemories.forEach((mem, i) => {
      console.log(`Memory ${i + 1} (score: ${mem.score.toFixed(2)}):`, 
        mem.content.substring(0, 80) + "...");
    });

    return sortedMemories;

  } catch (err) {
    console.error("❌ Failed to fetch relevant memories:", err.message);
    return [];
  }
};

const buildContext = async (userId, message, intent) => {
  const recentMessages = await ChatMessage.find({ userId }).sort({ createdAt: -1 }).limit(8).lean();
  const recentChatContext = recentMessages.reverse().map((msg) => `${msg.type === "user" ? "You" : "Twin"}: ${msg.text}`).join("\n");

  const relevantMemories = await getRelevantMemories(userId, message, intent);
  const memoryContext = relevantMemories.length > 0
    ? relevantMemories.map(mem => `- [${mem.source}] ${mem.content.trim()}`).join("\n")
    : "";

  const intentInstructions = {
    hackathon_idea: "Focus on creative, innovative solutions and technical feasibility.",
    project_discussion: "Provide technical insights and practical development advice.",
    personal_event: "Be empathetic and refer to personal experiences when relevant.",
    reminder: "Help organize and prioritize tasks based on importance and deadlines.",
    career_help: "Provide professional guidance based on past experiences and goals.",
    general: "Be helpful and conversational, drawing from available context when relevant."
  };

  return [
    recentChatContext ? `Recent conversation:\n${recentChatContext}` : "",
    memoryContext ? `Relevant memories:\n${memoryContext}` : "",
    `Context guidance: ${intentInstructions[intent] || intentInstructions.general}`
  ].filter(Boolean).join("\n\n");
};

queryRouter.post("/query", async (req, res) => {
  const { message, userId } = req.body;
  if (!userId || !message) return res.status(400).json({ reply: "Missing userId or message." });

  try {
    console.log(`🎯 Processing query: "${message}" for user: ${userId}`);
    
    await ChatMessage.create({ userId, type: "user", text: message });
    
    const intent = await classifyIntent(message);
    console.log("🧠 Classified intent:", intent);
    
    const relevantMemories = await getRelevantMemories(userId, message, intent);
    console.log(`📚 Retrieved ${relevantMemories.length} memories`);
    
    const context = await buildContext(userId, message, intent);
    console.log(`📝 Context length: ${context.length} characters`);
    console.log(`📝 Context preview:`, context.substring(0, 200) + "...");

    const reply = await getAIReply(message, context, intent);
    await ChatMessage.create({ userId, type: "ai", text: reply });

    res.json({ 
      reply, 
      intent, 
      contextLength: context.length,
      memoriesFound: relevantMemories.length,
      debug: {
        memorySources: relevantMemories.map(m => m.source),
        contextPreview: context.substring(0, 300)
      }
    });
  } catch (err) {
    console.error("❌ Query processing failed:", err.message);
    res.status(500).json({
      reply: "I'm having trouble processing your request right now. Could you try rephrasing your question?",
      error: "Processing error"
    });
  }
});

// GET: Load chat history with pagination
queryRouter.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  const { limit = 50, skip = 0 } = req.query;

  try {
    const history = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totalCount = await ChatMessage.countDocuments({ userId });

    res.json({ 
      messages: history.reverse(),
      totalCount,
      hasMore: totalCount > parseInt(skip) + parseInt(limit)
    });
  } catch (err) {
    console.error("❌ Failed to load history:", err);
    res.status(500).json({ error: "Failed to load chat history." });
  }
});

queryRouter.get("/debug/:userId", async (req, res) => {
  const { userId } = req.params;
  const testQuery = req.query.q || "hackathon";
  
  try {
    console.log(`🔍 Debug search for: "${testQuery}"`);
    
    const totalMemories = await Memory.countDocuments({ userId });
    console.log(`📊 Total memories in DB: ${totalMemories}`);
    
    const vectorStore = await prepareEmbeddingsForUser(userId, true);
    const vectorResults = vectorStore ? await vectorStore.similaritySearch(testQuery, 5) : [];
    
    const relevantMemories = await getRelevantMemories(userId, testQuery, "general");
    
    res.json({
      totalMemories,
      vectorStoreExists: !!vectorStore,
      vectorResults: vectorResults.length,
      relevantMemoriesFound: relevantMemories.length,
      sampleMemories: relevantMemories.slice(0, 3).map(m => ({
        source: m.source,
        score: m.score,
        preview: m.content.substring(0, 100)
      }))
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Search memories by query
queryRouter.get("/search/:userId", async (req, res) => {
  const { userId } = req.params;
  const { q, intent } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const relevantMemories = await getRelevantMemories(userId, q, intent || "general");
    res.json({ 
      results: relevantMemories.slice(0, 10),
      count: relevantMemories.length
    });
  } catch (err) {
    console.error("❌ Search failed:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

export default queryRouter;