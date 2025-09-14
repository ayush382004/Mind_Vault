let currentUserId = null;

// Handle "Store to MindVault" menu click
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save_to_mindvault",
    title: "🧠 Store to MindVault",
    contexts: ["selection"]
  });
});

// Save selected text and open popup
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "save_to_mindvault") {
    chrome.storage.local.set({ highlightedText: info.selectionText });
    chrome.action.openPopup();
  }
});

// Handle messages from frontend (set userId)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === "SET_USER_ID") {
    chrome.storage.local.set({ userId: message.userId }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

