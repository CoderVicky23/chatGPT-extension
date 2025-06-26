
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
  style.textContent = `
    .prompt-text:focus { outline: none !important; box-shadow: none !important; }
    .theme-toggle {
      background: none;
      border: none;
      cursor: pointer;
      margin-left: auto;
      padding: 4px;
    }
    .theme-toggle svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      fill: none;
    }
    #chat-title {
      font-style: italic;
      font-size: 12px;
      margin-top: 0;
      margin-bottom: 12px;
      text-align: center;
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);

  const getChatTitle = () => {
    try {
      // Attempt 1: From selected nav item
      const navLinks = document.querySelectorAll('nav a');
      for (const link of navLinks) {
        if (link.getAttribute('aria-current') === 'page') {
          const label = link.querySelector('span');
          if (label && label.textContent.trim()) {
            return label.textContent.trim();
          }
        }
      }

      // Attempt 2: Chat header inside main chat area
      const mainHeading = document.querySelector('main h1');
      if (mainHeading && mainHeading.textContent.trim()) {
        return mainHeading.textContent.trim();
      }

      // Attempt 3: Document title parsing (fallback)
      const titleParts = document.title.split('–');
      if (titleParts.length > 0 && titleParts[0].trim().length > 0) {
        return titleParts[0].trim();
      }
    } catch (e) {
      console.warn("Error getting chat title:", e);
    }
    return "Unnamed Chat";
  };

  const panel = document.createElement("div");
  panel.id = "my-chatgpt-panel";
  const titleBar = document.createElement("div");
  titleBar.style.display = "flex";
  titleBar.style.justifyContent = "center";
  titleBar.style.alignItems = "center";
  titleBar.style.marginBottom = "6px";

  const titleText = document.createElement("h3");
  titleText.textContent = "Prompt Index";
  titleText.style.margin = "0 auto 0 0";

  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.innerHTML = `<svg id="theme-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  titleBar.appendChild(titleText);
  titleBar.appendChild(themeToggle);

  const chatTitle = document.createElement("div");
  chatTitle.id = "chat-title";
  chatTitle.textContent = `'${getChatTitle()}'`;

  const promptList = document.createElement("ul");
  promptList.id = "prompt-list";
  promptList.style.marginTop = "14px";

  panel.appendChild(document.createElement("div")).id = "resizer";
  panel.appendChild(titleBar);
  panel.appendChild(chatTitle);
  panel.appendChild(promptList);

  let windowWidth = MIN_PANEL_WIDTH;
  document.body.appendChild(panel);

  const toggleButton = document.createElement("button");
  toggleButton.id = "my-chatgpt-toggle-btn";
  toggleButton.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
  toggleButton.setAttribute("aria-label", "Toggle Prompt Panel");
  toggleButton.setAttribute("tabindex", "0");
  document.body.appendChild(toggleButton);

  let panelVisible = false;
  const hamburgerIcon = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
  const closeIcon = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  const hidePanel = () => {
    panelVisible = false;
    panel.style.right = `-${windowWidth}px`;
    toggleButton.innerHTML = hamburgerIcon;
  };
  const showPanel = () => {
    panelVisible = true;
    panel.style.right = `0px`;
    toggleButton.innerHTML = closeIcon;
  };

  toggleButton.onclick = (event) => { event.stopPropagation(); panelVisible ? hidePanel() : showPanel(); };
  document.addEventListener("click", (event) => {
    if (panelVisible && !panel.contains(event.target) && !toggleButton.contains(event.target)) hidePanel();
  });

  // Dark/Light Mode Sync and Toggle
  const setTheme = (mode) => {
    const root = document.querySelector('#my-chatgpt-panel');
    const listItems = document.querySelectorAll('#prompt-list li');
    if (!root) return;
    if (mode === 'dark') {
      root.style.backgroundColor = '#202123';
      root.style.color = '#ececf1';
      listItems.forEach(li => {
        li.style.backgroundColor = '#343541';
        li.onmouseenter = () => li.style.backgroundColor = '#3e4047';
        li.onmouseleave = () => li.style.backgroundColor = '#343541';
      });
    } else {
      root.style.backgroundColor = '#f7f7f8';
      root.style.color = '#111';
      listItems.forEach(li => {
        li.style.backgroundColor = '#ffffff';
        li.onmouseenter = () => li.style.backgroundColor = '#f0f0f0';
        li.onmouseleave = () => li.style.backgroundColor = '#ffffff';
      });
    }
  };

  const detectTheme = () => document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  let currentTheme = detectTheme();
  setTheme(currentTheme);
  themeToggle.onclick = () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(currentTheme);
  };

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


  // const promptList = document.getElementById("prompt-list");
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
      setTimeout(() => {
        const chatTitleDiv = document.getElementById("chat-title");
        if (chatTitleDiv) {
          chatTitleDiv.textContent = `“${getChatTitle()}”`;
        }
        scanAndRenderPrompts();
      }, CHAT_SCAN_DELAY);
    });
  }

  startObserving();
})();
