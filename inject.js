if (document.getElementById("my-chatgpt-panel")) {
    console.log("✅ Panel already exists");
} else {
    console.log("✅ Injecting panel...");

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
    <h3 style="margin-bottom: 10px; text-align: center">Prompt Index</h3>
    <ul id="prompt-list"></ul>
    `;
    let windowWidth = 300;
    document.body.appendChild(panel);

    // Create Toggle Button
    const toggleButton = document.createElement("button");
    toggleButton.id = "my-chatgpt-toggle-btn";
    toggleButton.innerText = "☰";
    document.body.appendChild(toggleButton);

    // Function to hide the panel
    const hidePanel = () => {
        panelVisible = false;
        panel.style.right = `-${windowWidth}px`;
    };

    // Function to show the panel
    const showPanel = () => {
        panelVisible = true;
        panel.style.right = `${0}px`;
    };

    // toggle button implementation logic
    let panelVisible = false;
    toggleButton.onclick = (event) => {
        event.stopPropagation(); // Prevent this click from propagating to the document
        panelVisible = !panelVisible;
        if (panelVisible) {
            showPanel();
        } else {
            hidePanel();
        }
    };

    // Close panel when clicking outside
    document.addEventListener("click", (event) => {
        // Check if the click occurred outside the panel and outside the toggle button
        if (panelVisible && !panel.contains(event.target) && !toggleButton.contains(event.target)) {
            hidePanel();
        }
    });

    // Resizing panel
    const resizer = document.getElementById("resizer");
    let isResizing = false;
    resizer.addEventListener("mousedown", () => {
        isResizing = true;
        document.body.style.cursor = "ew-resize";
    });
    document.addEventListener("mousemove", (e) => {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX;
        windowWidth = Math.min(Math.max(newWidth, 300), 500)
        panel.style.width = `${windowWidth}px`;
        // If panel is visible, keep its right position updated during resize
        if (panelVisible) {
            panel.style.right = `${0}px`;
        }
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
        listItem.innerText = textContent.length > 50 ? textContent.slice(0, 50) + "…" : textContent;
        listItem.title = textContent;
        listItem.onclick = () => {
            const target = document.getElementById(anchorId);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                hidePanel(); // Optionally hide panel after clicking a prompt
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
                    // Ensure the added node is a direct parent or contains the user message
                    const targetNodeForPrompt = node.querySelector('div[data-message-author-role="user"]').closest("div");
                    if (targetNodeForPrompt) {
                        addPromptToPanel(textContent, targetNodeForPrompt);
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

    // Refresh index on sidebar chat click
    const chatListContainer = document.querySelector("nav");
    if (chatListContainer) {
        chatListContainer.addEventListener("click", () => {
            setTimeout(scanAllExistingPrompts, 1500);
        });
    }

    startObserving();
}