document.addEventListener("DOMContentLoaded", async () => {
  // Load highlighted text
  chrome.storage.local.get(["highlightedText", "userId"], (data) => {
    document.getElementById("text").value = data.highlightedText || '';
    document.getElementById("userId").textContent = data.userId || '❌ Not Connected';
  });

  // Save memory
  document.getElementById("save").addEventListener("click", async () => {
    const rawText = document.getElementById("text").value.trim();
    const emotion = document.getElementById("emotion").value;

    chrome.storage.local.get("userId", async (data) => {
      const userId = data.userId;
      if (!userId) {
        document.getElementById("status").textContent = "❌ User not connected";
        return;
      }

      document.getElementById("status").textContent = "Saving...";

      const res = await fetch("http://localhost:5000/api/extension/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, rawText, emotion })
      });

      if (res.ok) {
        document.getElementById("status").textContent = "✅ Saved!";
      } else {
        document.getElementById("status").textContent = "❌ Error saving.";
      }
    });
  });
});
