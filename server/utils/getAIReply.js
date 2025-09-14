import axios from "axios";

const getAIReply = async (message, context, intent = "general") => {
  try {
    const systemPrompts = {
      hackathon_idea: `You are Twin, a helpful AI assistant specializing in innovative thinking and creative problem-solving. Use the provided context to give relevant, actionable advice for hackathons and innovative projects. If no relevant context is available, acknowledge this and provide general helpful guidance.`,

      project_discussion: `You are Twin, a technical AI assistant. Use the provided context to give specific, practical advice about projects and development. Reference past projects and experiences when relevant. If the context doesn't contain relevant technical information, say so and provide general technical guidance.`,

      personal_event: `You are Twin, a caring AI companion who remembers personal experiences and events. Use the provided context to reference past conversations and personal memories when relevant. Be empathetic and personal in your responses. If you don't have relevant personal context, acknowledge this warmly.`,

      reminder: `You are Twin, an organized AI assistant helping with tasks and reminders. Use the provided context to understand priorities and deadlines. Reference past tasks and commitments when relevant. If no relevant context about tasks is available, acknowledge this and help organize the current request.`,

      career_help: `You are Twin, a professional AI mentor. Use the provided context to give personalized career advice based on past experiences, goals, and professional history. If limited career context is available, acknowledge this and provide general professional guidance.`,

      general: `You are Twin, a helpful AI assistant. Use the provided context when relevant to give personalized responses. If the context doesn't seem relevant to the current question, acknowledge this and provide helpful general assistance. Always be honest about what you do and don't know from the context.`,
    };

    const systemPrompt = systemPrompts[intent] || systemPrompts.general;

    const messages = [
      {
        role: "system",
        content: `${systemPrompt}

Important guidelines:
- Only use context information that's clearly relevant to the user's question
- If context seems irrelevant or unclear, acknowledge this honestly
- Don't make assumptions based on limited context
- Be conversational and natural, not robotic
- Reference specific details from context when they're relevant
- If you're unsure about something from the context, say so`,
      },
    ];

    if (context && context.trim().length > 50) {
      messages.push({
        role: "user",
        content: `Context information:\n${context}\n\nCurrent question: ${message}`,
      });
    } else {
      messages.push({
        role: "user",
        content: message,
      });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "compound-beta",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let reply = response.data.choices[0].message.content.trim();

    reply = postProcessReply(reply, message, context, intent);

    return reply;
  } catch (err) {
    console.error("❌ AI reply generation failed:", err.message);

    const fallbackResponses = {
      hackathon_idea:
        "I'd love to help with your hackathon idea! Could you share more details about what you're working on?",
      project_discussion:
        "I'm here to help with your project. Could you provide more specific details about what you need assistance with?",
      personal_event:
        "I'm sorry, I'm having trouble accessing information right now. Could you remind me about what we were discussing?",
      reminder:
        "I want to help you stay organized! Could you tell me more about what you need to remember?",
      career_help:
        "I'd be happy to help with career guidance. What specific area would you like to discuss?",
      general:
        "I'm here to help! Could you provide a bit more context about what you're looking for?",
    };

    return (
      fallbackResponses[intent] ||
      "I'm having trouble processing your request right now. Could you try asking in a different way?"
    );
  }
};

const postProcessReply = (reply, originalMessage, context, intent) => {
  const genericPhrases = [
    "I don't have enough information",
    "Could you provide more context",
    "I'm not sure what you're asking",
    "I don't understand",
  ];

  const isGeneric = genericPhrases.some((phrase) =>
    reply.toLowerCase().includes(phrase.toLowerCase())
  );

  if (isGeneric && context && context.length > 100) {
    return `Based on what I remember from our previous conversations, I might need a bit more detail to give you the best answer. ${reply}`;
  }

  if (
    context &&
    context.length > 100 &&
    !reply.includes("remember") &&
    !reply.includes("mentioned")
  ) {
    if (Math.random() > 0.7) {
      reply =
        "Drawing from what we've discussed before, " +
        reply.charAt(0).toLowerCase() +
        reply.slice(1);
    }
  }

  return reply;
};

export default getAIReply;
