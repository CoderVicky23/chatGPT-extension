// Enhanced inject.js with persistent storage, error handling, and synced scan-fetch-render
(async () => {
  if (document.getElementById("my-chatgpt-panel")) {
    console.log("✅ Panel already exists");
    return;
  }

  console.log("✅ Injecting panel with storage logic...");

  const MIN_PANEL_WIDTH = 300;
  const MAX_PANEL_WIDTH = 500;
  const CHAT_SCAN_DELAY = 1500;

  const style = document.createElement("style");
  style.textContent = `.prompt-text:focus { outline: none !important; box-shadow: none !important; }`;
  document.head.appendChild(style);

  // const styleLink = document.createElement("link");
  // styleLink.rel = "stylesheet";
  // styleLink.href = chrome.runtime.getURL("styles.css");
  // styleLink.onload = () => console.log("Styles loaded.");
  // document.head.appendChild(styleLink);

  const panel = document.createElement("div");
  panel.id = "my-chatgpt-panel";
  panel.innerHTML = `<div id="resizer"></div><h3 style="margin-bottom: 10px; text-align: center">Prompt Index</h3><ul id="prompt-list"></ul>`;
  let windowWidth = MIN_PANEL_WIDTH;
  document.body.appendChild(panel);

  const toggleButton = document.createElement("button");
  toggleButton.id = "my-chatgpt-toggle-btn";
  toggleButton.innerText = "☰";
  toggleButton.setAttribute("aria-label", "Toggle Prompt Panel");
  toggleButton.setAttribute("tabindex", "0");
  document.body.appendChild(toggleButton);

  let panelVisible = false;
  const hidePanel = () => { panelVisible = false; panel.style.right = `-${windowWidth}px`; };
  const showPanel = () => { panelVisible = true; panel.style.right = `0px`; };

  toggleButton.onclick = (event) => { event.stopPropagation(); panelVisible ? hidePanel() : showPanel(); };
  document.addEventListener("click", (event) => {
    if (panelVisible && !panel.contains(event.target) && !toggleButton.contains(event.target)) hidePanel();
  });

  const resizer = panel.querySelector("#resizer");
  let isResizing = false;
  resizer.addEventListener("mousedown", () => { isResizing = true; document.body.style.cursor = "ew-resize"; });
  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    windowWidth = Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
    panel.style.width = `${windowWidth}px`;
    if (panelVisible) panel.style.right = `0px`;
  });
  document.addEventListener("mouseup", () => { isResizing = false; document.body.style.cursor = ""; });

  const promptList = document.getElementById("prompt-list");
  const getChatId = () => location.pathname.split("/").pop() || `chat-${Date.now()}`;

  let addedPrompts = new Set();

  const addPromptToPanel = (promptId, textContent, targetNode, storedMeta = {}) => {
    if (!textContent || addedPrompts.has(promptId)) return;
    addedPrompts.add(promptId);
    targetNode.id = promptId;

    const listItem = document.createElement("li");
    listItem.dataset.promptId = promptId;
    listItem.dataset.renamed = storedMeta.renamed || false;
    listItem.dataset.renamedValue = storedMeta.renamedValue || "";
    listItem.dataset.starred = storedMeta.starred || false;
    listItem.setAttribute("data-original-name", textContent);

    const textSpan = document.createElement("input");
    textSpan.className = "prompt-text";
    textSpan.type = "text";
    textSpan.value = storedMeta.renamed ? storedMeta.renamedValue : (textContent.length > 50 ? textContent.slice(0, 50) + "…" : textContent);
    textSpan.title = textContent;
    textSpan.readOnly = true;
    Object.assign(textSpan.style, { background: "transparent", border: "none", padding: 0, margin: 0, cursor: "pointer" });

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "prompt-buttons";

    const starBtn = document.createElement("button");
    starBtn.className = "star-btn";
    starBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 10 23 10 17 15 19 23 12 18 5 23 7 15 1 10 9 10 12 2"/></svg>`;
    if (storedMeta.starred) starBtn.classList.add("starred");
    starBtn.onclick = async (e) => {
      e.stopPropagation();
      const isStarred = listItem.dataset.starred === "true";
      listItem.dataset.starred = (!isStarred).toString();
      starBtn.classList.toggle("starred", !isStarred);
      await updatePromptMeta(promptId, { starred: !isStarred });
    };

    const renameBtn = document.createElement("button");
    renameBtn.className = "edit-btn";
    renameBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`;
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      textSpan.readOnly = false;
      textSpan.focus();
    };

    textSpan.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        const newName = textSpan.value.trim();
        if (newName) {
          listItem.dataset.renamed = "true";
          listItem.dataset.renamedValue = newName;
          await updatePromptMeta(promptId, { renamed: true, renamedValue: newName });
        }
        textSpan.readOnly = true;
      } else if (e.key === "Escape") {
        textSpan.value = listItem.dataset.renamed === "true" ? listItem.dataset.renamedValue : listItem.getAttribute("data-original-name");
        textSpan.readOnly = true;
      }
    });

    textSpan.addEventListener("blur", () => {
      textSpan.readOnly = true;
      textSpan.value = listItem.dataset.renamed === "true" ? listItem.dataset.renamedValue : listItem.getAttribute("data-original-name");
    });

    listItem.onclick = (e) => {
      if (e.target === textSpan) {
        const target = document.getElementById(promptId);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        hidePanel();
      }
    };

    buttonsDiv.appendChild(renameBtn);
    buttonsDiv.appendChild(starBtn);
    listItem.appendChild(textSpan);
    listItem.appendChild(buttonsDiv);
    promptList.appendChild(listItem);
  };

  async function updatePromptMeta(promptId, updates) {
    const chatId = getChatId();
    try {
      if (!chrome?.storage?.local) throw new Error("chrome.storage.local is not available");
      const data = await chrome.storage.local.get([chatId]);
      const chatData = data[chatId] || {};
      chatData[promptId] = { ...chatData[promptId], ...updates };
      await chrome.storage.local.set({ [chatId]: chatData });
    } catch (err) {
      console.warn("❌ Failed to update prompt metadata:", err);
    }
  }

  async function scanAndRenderPrompts() {
    const chatId = getChatId();
    promptList.innerHTML = "";
    addedPrompts = new Set();
    let chatData = {};

    try {
      if (!chrome?.storage?.local) throw new Error("chrome.storage.local is not available");
      const data = await chrome.storage.local.get([chatId]);
      chatData = data[chatId] || {};
    } catch (err) {
      console.warn("❌ Failed to fetch prompt metadata, rendering defaults:", err);
    }

    const userMessages = Array.from(document.querySelectorAll('div[data-message-author-role="user"]'));
    userMessages.forEach((msg, i) => {
      const parent = msg.closest("div");
      const textContent = msg.innerText?.trim();
      const promptId = `prompt-${i}`;
      if (textContent && parent) addPromptToPanel(promptId, textContent, parent, chatData[promptId]);
    });
  }

  const observer = new MutationObserver(() => setTimeout(scanAndRenderPrompts, 500));
  const startObserving = () => {
    const chatContainer = document.querySelector("main");
    if (chatContainer) {
      observer.observe(chatContainer, { childList: true, subtree: true });
      scanAndRenderPrompts();
    } else {
      setTimeout(startObserving, 1000);
    }
  };

  const chatListContainer = document.querySelector("nav");
  if (chatListContainer) {
    chatListContainer.addEventListener("click", () => {
      setTimeout(scanAndRenderPrompts, CHAT_SCAN_DELAY);
    });
  }

  startObserving();
})();
