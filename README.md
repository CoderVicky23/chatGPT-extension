# 🧠 ChatGPT Prompt Tracker

A Chrome Extension that enhances your ChatGPT experience by allowing you to **track, rename, star, and revisit prompts** inside any chat session — all from a draggable **side panel**!

---

## ✨ Features

✅ **Prompt Side Panel**  
Automatically displays a list of all user prompts in the current chat in a collapsible panel.

✅ **Scroll-to-Prompt**  
Click any prompt in the panel to scroll directly to its location in the chat.

✅ **Rename & Star Prompts**  
Customize your prompts with inline renaming, and star important ones for quick reference.

✅ **Auto Chat Sync**  
When you open or switch to a new chat, the panel refreshes and shows prompts for that chat.

✅ **Resizable Panel**  
Resize the prompt panel smoothly to suit your screen and workflow.

✅ **Persistent Metadata**  
Renames and starred statuses are stored per chat using Chrome’s local storage — completely offline.

---

## 🛠️ Installation

1. Clone or [download this repo](https://github.com/CoderVicky23/chatGPT-extension).
2. Go to `chrome://extensions/` in your Chrome browser.
3. Enable **Developer Mode** (top right).
4. Click **“Load Unpacked”**, and select the project folder.
5. Navigate to [ChatGPT](https://chat.openai.com/).
6. Click the extension icon in the toolbar to **activate** the prompt panel.

---

## 🧑‍💻 How It Works

When activated:
- A **panel slides in** from the right side of the ChatGPT UI.
- It detects all user prompts using DOM scanning (`data-message-author-role="user"`).
- For each prompt:
  - A list item is added to the panel.
  - Each item supports renaming and starring.
  - Clicking it scrolls to the original message.
- Data is **stored locally** using `chrome.storage.local` keyed by chat ID.

The extension listens for changes in the chat interface using a `MutationObserver`, and re-renders the panel when needed.

---

## 📷 Screenshots

> *(Add screenshots here showing the panel open, prompt list, and renamed/starred items.)*

---

## 🔐 Privacy

This extension **does not send or collect** any personal or usage data.  
All prompt metadata (like renames or stars) is stored **locally** in your browser using `chrome.storage.local`.

For full details, see [PRIVACY.md](./PRIVACY.md).

---

## 🧩 Permissions

- `activeTab` — to inject scripts only when you click the extension.
- `scripting` — to programmatically insert the panel and styles.
- `storage` — to save your prompt metadata per chat.
- `host_permissions`: `https://chat.openai.com/*` — restricts access only to ChatGPT.

---

## 📄 License

[MIT](./LICENSE)

---

## 🚀 Future Plans

- 🔍 Filter and search prompts
- ☁️ Sync across devices (optional)

---

## 🤝 Contributing

Pull requests welcome! If you find bugs or have feature suggestions, feel free to [open an issue](https://github.com/CoderVicky23/chatGPT-extension/issues).

---

## 🧠 Inspired By

This project is built to complement the ChatGPT experience for researchers, students, and productivity enthusiasts.

---

