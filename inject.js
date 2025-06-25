(() => {
  if (document.getElementById("my-chatgpt-panel")) {
    console.log("✅ Panel already exists");
    return;
  }

  console.log("✅ Injecting panel...");

  const MIN_PANEL_WIDTH = 300;
  const MAX_PANEL_WIDTH = 500;
  const CHAT_SCAN_DELAY = 1500;

  const style = document.createElement("style");
  style.textContent = `
    .prompt-text:focus {
      outline: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);

  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("styles.css");
  styleLink.onload = () => console.log("Styles loaded.");
  document.head.appendChild(styleLink);

  const panel = document.createElement("div");
  panel.id = "my-chatgpt-panel";
  panel.innerHTML = `
    <div id="resizer"></div>
    <h3 style="margin-bottom: 10px; text-align: center">Prompt Index</h3>
    <ul id="prompt-list"></ul>
  `;
  let windowWidth = MIN_PANEL_WIDTH;
  document.body.appendChild(panel);

  const toggleButton = document.createElement("button");
  toggleButton.id = "my-chatgpt-toggle-btn";
  toggleButton.innerText = "☰";
  toggleButton.setAttribute("aria-label", "Toggle Prompt Panel");
  toggleButton.setAttribute("tabindex", "0");
  document.body.appendChild(toggleButton);

  let panelVisible = false;
  const hidePanel = () => {
    panelVisible = false;
    panel.style.right = `-${windowWidth}px`;
  };

  const showPanel = () => {
    panelVisible = true;
    panel.style.right = `0px`;
  };

  toggleButton.onclick = (event) => {
    event.stopPropagation();
    panelVisible ? hidePanel() : showPanel();
  };

  document.addEventListener("click", (event) => {
    if (
      panelVisible &&
      !document.getElementById("my-chatgpt-panel").contains(event.target) &&
      !toggleButton.contains(event.target)
    ) {
      hidePanel();
    }
  });

  const resizer = panel.querySelector("#resizer");
  let isResizing = false;

  resizer.addEventListener("mousedown", () => {
    isResizing = true;
    document.body.style.cursor = "ew-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    windowWidth = Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
    panel.style.width = `${windowWidth}px`;
    if (panelVisible) {
      panel.style.right = `0px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.cursor = "";
  });

  const addedPrompts = new Set();
  const promptList = document.getElementById("prompt-list");
  let promptCounter = 0;

  const addPromptToPanel = (textContent, targetNode) => {
    if (!textContent || addedPrompts.has(textContent)) return;
    addedPrompts.add(textContent);
    const anchorId = "chatgpt-prompt-" + promptCounter++;
    targetNode.id = anchorId;

    const listItem = document.createElement("li");
    listItem.dataset.renamed = "false";
    listItem.dataset.renamedValue = "";
    listItem.dataset.starred = "false";
    listItem.setAttribute("data-original-name", textContent);

    const textSpan = document.createElement("input");
    textSpan.className = "prompt-text";
    textSpan.type = "text";
    textSpan.value = textContent.length > 50 ? textContent.slice(0, 50) + "…" : textContent;
    textSpan.title = textContent;
    textSpan.readOnly = true;
    textSpan.style.background = "transparent";
    textSpan.style.border = "none";
    textSpan.style.padding = "0";
    textSpan.style.margin = "0";
    textSpan.style.cursor = "pointer";
    textSpan.style.outline = "none";
    textSpan.style.boxShadow = "none";

    let isEditing = false;

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "prompt-buttons";

    const starBtn = document.createElement("button");
    starBtn.className = "star-btn";
    starBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15 10 23 10 17 15 19 23 12 18 5 23 7 15 1 10 9 10 12 2"/>
      </svg>`;
    starBtn.title = "Star Prompt";
    starBtn.onclick = (e) => {
      e.stopPropagation();
      const isStarred = listItem.dataset.starred === "true";
      listItem.dataset.starred = (!isStarred).toString();
      starBtn.classList.toggle("starred", !isStarred);
    };

    const renameBtn = document.createElement("button");
    renameBtn.className = "edit-btn";
    renameBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>`;
    renameBtn.title = "Rename Prompt";
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      isEditing = true;
      textSpan.readOnly = false;
      textSpan.focus();
      textSpan.selectionStart = textSpan.selectionEnd = textSpan.value.length;
    };

    textSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const newName = textSpan.value.trim();
        if (newName) {
          listItem.dataset.renamed = "true";
          listItem.dataset.renamedValue = newName;
        }
        textSpan.readOnly = true;
        isEditing = false;
      } else if (e.key === "Escape") {
        textSpan.value = listItem.dataset.renamed === "true" ? listItem.dataset.renamedValue : listItem.getAttribute("data-original-name");
        textSpan.readOnly = true;
        isEditing = false;
      }
    });

    textSpan.addEventListener("blur", () => {
      if (isEditing) {
        textSpan.readOnly = true;
        textSpan.value = listItem.dataset.renamed === "true" ? listItem.dataset.renamedValue : listItem.getAttribute("data-original-name");
        isEditing = false;
      }
    });

    buttonsDiv.appendChild(renameBtn);
    buttonsDiv.appendChild(starBtn);
    listItem.appendChild(textSpan);
    listItem.appendChild(buttonsDiv);

    listItem.onclick = (e) => {
      if (e.target === textSpan && !isEditing) {
        const target = document.getElementById(anchorId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          hidePanel();
        }
      }
    };

    promptList.appendChild(listItem);
  };

  const scanAllExistingPrompts = () => {
    promptList.innerHTML = "";
    addedPrompts.clear();
    promptCounter = 0;

    const userMessages = document.querySelectorAll('div[data-message-author-role="user"]');
    userMessages.forEach((msg) => {
      const parent = msg.closest("div");
      if (parent) {
        const content = msg.innerText?.trim();
        if (content) addPromptToPanel(content, parent);
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
          const targetNode = userMessage.closest("div");
          if (targetNode && textContent) {
            addPromptToPanel(textContent, targetNode);
          }
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

  const chatListContainer = document.querySelector("nav");
  if (chatListContainer) {
    chatListContainer.addEventListener("click", () => {
      setTimeout(scanAllExistingPrompts, CHAT_SCAN_DELAY);
    });
  }

  startObserving();
})();
