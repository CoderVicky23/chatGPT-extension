if (document.getElementById("my-chatgpt-panel")) {
  console.log("✅ Panel already exists");
} else {
  console.log("✅ Injecting panel...");

  const extractKeywords = (text) => {
  const stopWords = new Set([
    "i", "me", "my", "myself", "we", "our", "you", "your", "yours",
    "he", "she", "it", "they", "them", "this", "that", "am", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "a", "an", "the", "and", "but", "or", "if", "then", "because", "so", "to", "of", "in", "on", "for", "with", "as", "by", "at"
  ]);

  return text
    .toLowerCase()
    .split(/\W+/)                      // Split on words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5)                       // Limit to top 5
    .join(", ");
};


  // Inject stylesheet
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("styles.css"); // Correct path for Chrome extensions
  document.head.appendChild(styleLink);

  // Create Panel
  const panel = document.createElement("div");
  panel.id = "my-chatgpt-panel";
  panel.innerHTML = `
    <div id="resizer"></div>
    <h3 style="margin-bottom: 10px;">Prompt Index</h3>
    <ul id="prompt-list"></ul>
  `;
  document.body.appendChild(panel);

  // Create Toggle Button
  const toggleButton = document.createElement("button");
  toggleButton.id = "my-chatgpt-toggle-btn";
  toggleButton.innerText = "☰";
  document.body.appendChild(toggleButton);

  let panelVisible = true;
  toggleButton.onclick = () => {
    panelVisible = !panelVisible;
    panel.style.display = panelVisible ? "flex" : "none";
  };

  // Resizing
  const resizer = document.getElementById("resizer");
  let isResizing = false;
  resizer.addEventListener("mousedown", () => {
    isResizing = true;
    document.body.style.cursor = "ew-resize";
  });
  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    panel.style.width = `${Math.min(Math.max(newWidth, 200), 600)}px`;
  });
  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.cursor = "";
  });

  // Prompt Index Logic
  let promptCounter = 0;
  const addedPrompts = new Set();
  const promptList = document.getElementById("prompt-list");

  const addPromptToPanel = (textContent, targetNode) => {
    if (!textContent || addedPrompts.has(textContent)) return;
    addedPrompts.add(textContent);
    const anchorId = "chatgpt-prompt-" + promptCounter++;
    targetNode.id = anchorId;

    const listItem = document.createElement("li");
	// keyword extraction
	const keywords = extractKeywords(textContent);
	listItem.innerText = keywords || (textContent.length > 50 ? textContent.slice(0, 50) + "…" : textContent);

    listItem.title = textContent;
    listItem.onclick = () => {
      const target = document.getElementById(anchorId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    promptList.appendChild(listItem);
  };

  const scanAllExistingPrompts = () => {
    promptList.innerHTML = "";
    addedPrompts.clear();
    promptCounter = 0;

    const nodes = document.querySelectorAll('div[data-message-author-role="user"]');
    nodes.forEach((userMessage) => {
      const textContent = userMessage?.innerText?.trim();
      const parent = userMessage.closest("div");
      if (parent && textContent) {
        addPromptToPanel(textContent, parent);
      }
    });
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === 1 &&
          node.querySelector &&
          node.querySelector('div[data-message-author-role="user"]')
        ) {
          const userMessage = node.querySelector('div[data-message-author-role="user"]');
          const textContent = userMessage?.innerText?.trim();
          addPromptToPanel(textContent, node);
        }
      });
    });
  });

  const startObserving = () => {
    const chatContainer = document.querySelector("main");
    if (chatContainer) {
      observer.observe(chatContainer, { childList: true, subtree: true });
      scanAllExistingPrompts();
    } else {
      setTimeout(startObserving, 1000);
    }
  };

  // Refresh index on sidebar chat click
  const chatListContainer = document.querySelector("nav");
  if (chatListContainer) {
    chatListContainer.addEventListener("click", () => {
      setTimeout(scanAllExistingPrompts, 1500);
    });
  }

  startObserving();
}
