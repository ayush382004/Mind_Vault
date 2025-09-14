// utils/agentCapabilities.js
export function detectAgentSupport(text) {
  const capabilities = {
    blog: ["blog", "blog", "write article", "post", "publish"],
  };

  for (const [agent, keywords] of Object.entries(capabilities)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return agent;
    }
  }

  return null; // unsupported
}
