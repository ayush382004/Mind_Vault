import axios from 'axios';

import dotenv from "dotenv";
dotenv.config();
const DEV_TO_API_KEY = process.env.DEV_TO_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function executeAgentTask(task) {
  if (task.agentType !== "blog") {
    return { success: false, error: "Unsupported agent type" };
  }

  try {
    // 🧠 Step 1: Generate blog content using Groq AI
    const aiRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "compound-beta",
        messages: [
          {
            role: "system",
            content: "You are a professional tech blogger. Write responses in markdown only.",
          },
          {
            role: "user",
            content: `Write a complete technical blog post on: "${task.description}". Include a strong intro, well-structured content, and a conclusion.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const markdown = aiRes.data.choices[0].message.content.trim();

    // ✍️ Step 2: Prepare Dev.to article payload
    const devToPayload = {
      article: {
        title: task.title,
        published: true, // Set to false if you want to create a draft
        body_markdown: markdown,
        tags: ["ai", "blog", "mindvault"], // Optional: customize tags
        series: "MindVault AI Agent", // Optional
        canonical_url: "", // Optional
      },
    };

    // 🚀 Step 3: Publish to Dev.to
    const response = await axios.post(
      "https://dev.to/api/articles",
      devToPayload,
      {
        headers: {
          "api-key": DEV_TO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const postUrl = response.data.url;

    return {
      success: true,
      link: postUrl,
      message: "✅ Blog published to Dev.to successfully",
    };
  } catch (err) {
    console.error("🚨 Blog Agent Error:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}
