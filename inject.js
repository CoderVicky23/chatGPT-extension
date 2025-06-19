if (document.getElementById("my-chatgpt-panel")) {
    console.log("✅ Panel already exists");
} else {
    console.log("✅ Injecting panel...");

    // Inject stylesheet
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = chrome.runtime.getURL("styles.css");
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
        event.stopPropagation();
        panelVisible = !panelVisible;
        if (panelVisible) {
            showPanel();
        } else {
            hidePanel();
        }
    };

    // Close panel when clicking outside
    document.addEventListener("click", (event) => {
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
        windowWidth = Math.min(Math.max(newWidth, 300), 500);
        panel.style.width = `${windowWidth}px`;
        if (panelVisible) {
            panel.style.right = `${0}px`;
        }
    });
    document.addEventListener("mouseup", () => {
        isResizing = false;
        document.body.style.cursor = "";
    });

    // --- Modal Logic ---
    const showRenameModal = (listItem) => {
        // Close any existing modal first
        closeRenameModal();

        const promptTextSpan = listItem.querySelector(".prompt-text");
        const currentName = listItem.dataset.renamed === 'true'
            ? listItem.dataset.renamedValue
            : promptTextSpan.title; // original full text

        const modal = document.createElement("div");
        modal.id = "rename-modal";
        modal.innerHTML = `
        <div id="modal-content">
            <h3>Rename Prompt</h3>
            <input type="text" id="rename-input" value="${currentName.replace(/"/g, '&quot;')}">
            <div id="modal-buttons">
                <button id="rename-save-btn">Rename</button>
                <button id="rename-cancel-btn">Cancel</button>
            </div>
        </div>
        `;
        document.body.appendChild(modal);

        document.getElementById("rename-save-btn").onclick = () => {
            const newName = document.getElementById("rename-input").value.trim();
            if (newName) {
                promptTextSpan.innerText = newName.length > 50 ? newName.slice(0, 50) + "…" : newName;
                listItem.dataset.renamed = 'true';
                listItem.dataset.renamedValue = newName;
                closeRenameModal();
            }
        };

        document.getElementById("rename-cancel-btn").onclick = closeRenameModal;
        modal.onclick = (e) => { // Close on overlay click
            if (e.target.id === 'rename-modal') {
                closeRenameModal();
            }
        };
    };

    const closeRenameModal = () => {
        const modal = document.getElementById("rename-modal");
        if (modal) {
            modal.remove();
        }
    };


    // --- Prompt Index Logic ---
    let promptCounter = 0;
    const addedPrompts = new Set();
    const promptList = document.getElementById("prompt-list");

    const addPromptToPanel = (textContent, targetNode) => {
        if (!textContent || addedPrompts.has(textContent)) return;
        addedPrompts.add(textContent);
        const anchorId = "chatgpt-prompt-" + promptCounter++;
        targetNode.id = anchorId;

        const listItem = document.createElement("li");
        // Add custom attributes
        listItem.dataset.renamed = "false";
        listItem.dataset.renamedValue = "";
        listItem.dataset.starred = "false";

        // Main text span
        const textSpan = document.createElement("span");
        textSpan.className = "prompt-text";
        textSpan.innerText = textContent.length > 50 ? textContent.slice(0, 50) + "…" : textContent;
        textSpan.title = textContent; // Store full original text in title

        // Buttons container
        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "prompt-buttons";

        // Star button
        const starBtn = document.createElement("button");
        starBtn.className = "star-btn";
        starBtn.innerHTML = '☆'; // Initial empty star
        starBtn.title = "Star Prompt";
        starBtn.onclick = (e) => {
            e.stopPropagation();
            const isStarred = listItem.dataset.starred === 'true';
            listItem.dataset.starred = !isStarred;
            starBtn.innerHTML = !isStarred ? '★' : '☆';
            starBtn.classList.toggle('starred', !isStarred);
        };

        // Rename button
        const renameBtn = document.createElement("button");
        renameBtn.className = "edit-btn";
        renameBtn.innerHTML = '📝'; // Notebook-pen icon
        renameBtn.title = "Rename Prompt";
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            showRenameModal(listItem);
        };
        
        buttonsDiv.appendChild(renameBtn);
        buttonsDiv.appendChild(starBtn);
        
        listItem.appendChild(textSpan);
        listItem.appendChild(buttonsDiv);
        
        listItem.onclick = () => {
            const target = document.getElementById(anchorId);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                hidePanel();
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