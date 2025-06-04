if (document.getElementById("my-chatgpt-panel")) {
  console.log("✅ Panel already exists");
} else {
  console.log("✅ Injecting side panel...");

  // Side panel
  const panel = document.createElement("div");
  panel.id = "my-chatgpt-panel";
  panel.innerHTML = `
    <h3>ChatGPT Prompt Index</h3>
    <ul id="prompt-list" style="list-style: none; padding: 0; margin: 0;"></ul>
  `;
  document.body.appendChild(panel);

  // Toggle button
  const toggleButton = document.createElement("button");
  toggleButton.id = "my-chatgpt-toggle-btn";
  toggleButton.innerText = "☰";
  document.body.appendChild(toggleButton);

  let panelVisible = false;
  toggleButton.onclick = () => {
    panelVisible = !panelVisible;
    panel.style.right = panelVisible ? "0" : "-300px";
  };

  // Mutation observer logic
  let promptCounter = 0;
  const addedPrompts = new Set();

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

          if (textContent && !addedPrompts.has(textContent)) {
            addedPrompts.add(textContent);

            const anchorId = "chatgpt-prompt-" + promptCounter++;
            node.id = anchorId;

            const listItem = document.createElement("li");
            listItem.innerText = textContent.length > 50 ? textContent.slice(0, 50) + "…" : textContent;
            listItem.title = textContent;
            listItem.onclick = () => {
              const target = document.getElementById(anchorId);
              if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            };

            document.getElementById("prompt-list").appendChild(listItem);
          }
        }
      });
    });
  });

  const startObserving = () => {
    const chatContainer = document.querySelector("main");
    if (chatContainer) {
      observer.observe(chatContainer, { childList: true, subtree: true });
      console.log("👀 Prompt observer started");
    } else {
      setTimeout(startObserving, 1000);
    }
  };

  startObserving();
}
