if (document.getElementById("my-chatgpt-panel")) {
  console.log("✅ Panel already exists");
} else {
  console.log("✅ Injecting panel...");

  // Panel
  const panel = document.createElement("div");
  panel.id = "my-chatgpt-panel";
  panel.innerHTML = `
    <div id="resizer"></div>
    <h3>Prompt Index</h3>
    <ul id="prompt-list" style="list-style: none; padding: 0; margin: 0;"></ul>
  `;
  document.body.appendChild(panel);

  // Toggle Button
  const toggleButton = document.createElement("button");
  toggleButton.id = "my-chatgpt-toggle-btn";
  toggleButton.innerText = "☰";
  document.body.appendChild(toggleButton);

  let panelVisible = true;
  toggleButton.onclick = () => {
    panelVisible = !panelVisible;
    panel.style.display = panelVisible ? "flex" : "none";
  };

  // Resizing Logic
  const resizer = document.getElementById("resizer");
  let isResizing = false;

  resizer.addEventListener("mousedown", function (e) {
    isResizing = true;
    document.body.style.cursor = "ew-resize";
  });

  document.addEventListener("mousemove", function (e) {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    panel.style.width = `${Math.min(Math.max(newWidth, 200), 600)}px`; // between 200–600px
  });

  document.addEventListener("mouseup", function () {
    isResizing = false;
    document.body.style.cursor = "";
  });

  // Prompt logic
  let promptCounter = 0;
  const addedPrompts = new Set();
  const promptList = document.getElementById("prompt-list");

  const addPromptToPanel = (textContent, targetNode) => {
    if (!textContent || addedPrompts.has(textContent)) return;

    addedPrompts.add(textContent);
    const anchorId = "chatgpt-prompt-" + promptCounter++;
    targetNode.id = anchorId;

    const listItem = document.createElement("li");
    listItem.innerText = textContent.length > 50 ? textContent.slice(0, 50) + "…" : textContent;
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
    const nodes = document.querySelectorAll('div[data-message-author-role="user"]');
    nodes.forEach((userMessage) => {
      const textContent = userMessage?.innerText?.trim();
      const parent = userMessage.closest("div");
      if (parent && textContent) {
        addPromptToPanel(textContent, parent);
      }
    });
    console.log("✅ Indexed existing prompts");
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

  startObserving();
}
