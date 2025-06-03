chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      console.log("✅ Injected into ChatGPT working!");

      // Avoid duplicate panels
      if (document.getElementById("my-chatgpt-panel")) {
        console.log("Panel already exists");
        return;
      }

      // Create the side panel
      const panel = document.createElement("div");
      panel.id = "my-chatgpt-panel";
      panel.style.position = "fixed";
      panel.style.top = "0";
      panel.style.right = "-300px"; // Hidden by default
      panel.style.width = "300px";
      panel.style.height = "100vh";
      panel.style.backgroundColor = "#f1f1f1";
      panel.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
      panel.style.transition = "right 0.3s ease";
      panel.style.zIndex = "10000";
      panel.innerHTML = "<h3 style='padding: 1em;'>ChatGPT Side Panel</h3>";

      // Create the toggle button
      const toggleButton = document.createElement("button");
      toggleButton.id = "my-chatgpt-toggle-btn";
      toggleButton.innerText = "☰";
      toggleButton.style.position = "fixed";
      toggleButton.style.bottom = "20px";
      toggleButton.style.right = "20px";
      toggleButton.style.zIndex = "10001";
      toggleButton.style.width = "50px";
      toggleButton.style.height = "50px";
      toggleButton.style.borderRadius = "50%";
      toggleButton.style.border = "none";
      toggleButton.style.backgroundColor = "#4CAF50";
      toggleButton.style.color = "#fff";
      toggleButton.style.fontSize = "24px";
      toggleButton.style.cursor = "pointer";
      toggleButton.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";

      // Toggle panel logic
      let panelVisible = false;
      toggleButton.onclick = () => {
        panelVisible = !panelVisible;
        panel.style.right = panelVisible ? "0" : "-300px";
      };

      // Append elements
      document.body.appendChild(panel);
      document.body.appendChild(toggleButton);
      console.log("panel appended!");
    },
  });
});





// using chrome.scripting.executeScript

// chrome.action.onClicked.addListener((tab) => {
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     func: () => {
//       console.log("✅ Injected into ChatGPT!");

//       const observer = new MutationObserver(() => {
//         const input = document.querySelector("textarea");
//         if (input) {
//             input.style.border = "2px solid red";
//             console.log("✅ Input box found and styled");
//             console.log(input);
//             observer.disconnect();
//         }
//       });

//       observer.observe(document.body, { childList: true, subtree: true });
//     },
//   });
// });
