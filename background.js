chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["styles.css"],
  }).catch((err) => {
    console.error("❌ Failed to insert CSS:", err);
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["inject.js"],
  }).catch((err) => {
    console.error("❌ Failed to inject script:", err);
  });
});
