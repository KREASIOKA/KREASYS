<!-- Banner -->
<p align="center">
  <img src="https://www.kreasioka.com/img/kreasioka-banner.jpg" alt="KREASYS Banner">
</p>

<!-- Logo & Title -->
<h1 align="center">
  <img src="https://www.kreasioka.com/img/logo.svg" alt="Logo" width="40" height="40">
  KREASYS | Autonomous Browser-Native IDE
</h1>

<p align="center">
  <strong>100% Client-Side, Multi-Model, Fully Autonomous Artificial Intelligence</strong>
</p>

<!-- Badges -->
<p align="center">
  <a href="https://github.com/kreasioka/kreasiokai/stargazers"><img src="https://img.shields.io/github/stars/kreasioka/kreasiokai?style=for-the-badge&color=00ffcc&logo=github&logoColor=white" alt="Stars"></a>
  <a href="https://github.com/kreasioka/kreasiokai/graphs/contributors"><img src="https://img.shields.io/github/contributors/kreasioka/kreasiokai?style=for-the-badge&color=00b3ff" alt="Contributors"></a>
  <a href="https://www.kreasioka.com"><img src="https://img.shields.io/badge/Made_by-KREASIOKA_Team-050510?style=for-the-badge&logo=codeforces&logoColor=00ffcc" alt="KREASIOKA"></a>
</p>

---

## ⚠️ Early Development Notice
> **Note to the Community:** 
> We sincerely apologize for the initial lack of documentation! **KREASYS is currently in its very early alpha stages of development.** Features are still minimal, the codebase is rapidly evolving, and you will likely encounter bugs. We are actively working on stabilization, but contributions and feedback are deeply appreciated as we build the future of browser-native AI!

---

## 📖 Table of Contents
- [What is KREASYS?](#-what-is-kreasys)
- [Core Features](#-core-features)
- [Architecture & Components](#-architecture--components)
- [How It Works](#-how-it-works)
- [Getting Started](#-getting-started)
- [Contributors](#-contributors)

---

## 🤖 What is KREASYS?
Developed by the [KREASIOKA Team](https://www.kreasioka.com), **KREASYS** is a hyper-advanced, 100% browser-native AI agent and IDE. Running entirely in your local browser sandbox without requiring a backend server, KREASYS combines real-time AI memory, virtual file systems (VFS), and multi-modal autonomous routing (Text, Vision, Audio) to act as your tireless 24/7 personal software engineer. KREASYS possesses true autonomy, capable of modifying its own files and proactively dispatching Telegram messages to other users.

---

## ✨ Core Features
*   **Zero-Backend Architecture:** Everything from state management to LLM API handshakes happens in pure HTML/JS/CSS client-side.
*   **Virtual File System (VFS):** Fully sandboxed, hierarchical file explorer mapped directly into your browser's IndexedDB. 
*   **Multi-Modal Auto-Router:** Select from `Text`, `Multimodal`, `Vision`, `ImageGen`, and `Audio`. KREASYS analyzes your goals and automatically funnels tasks to your dedicated APIs.
*   **Live Task Flowcharts:** Watch the AI plan its next move. KREASYS dynamically builds glowing neon flowcharts rendered directly in the SysLog terminal as it thinks.
*   **Autonomous Telegram Surrogate:** Bind a Telegram bot token to grant the AI the ability to receive commands outside the browser, and autonomously route background messages to specific users via XML directive routing (`<tg_send>`).

---

## 🧩 Architecture & Components
KREASYS V2 is structured into modular JavaScript injection layers for performance and scale:

*   `/css/styles.css` - Apple-inspired, minimalist liquid-glass UI/UX.
*   `/js/core/state.js` - `localForage` persistence layers, sandboxing policies, and AI persona matrices.
*   `/js/core/vfs.js` - Recursive file tree parsing algorithms and real-time Actionable Toast Notifications.
*   `/js/core/ai.js` - Dynamic LLM inference workflows, OpenRouter integrations, and intent routing mechanics.
*   `/js/core/telegram.js` - Webhook-free, long-polling Telegram logic that grants the AI parallel task handling.
*   `/js/ui/app.js` - DOM manipulation, tab navigation, rendering engines, and animated flowchart handlers.

---

## ⚙️ How It Works
Because KREASYS operates strictly within the DOM envelope, it leverages secure `fetch` protocols to bridge client data to LLM APIs (like OpenRouter, Groq, or Custom Enpoints). 

1. **Context Building:** Before sending your prompt, KREASYS dynamically iterates over your entire `/workspace/` and reads its own `memory.log` to construct highly personalized context.
2. **Action Dispatching:** The AI yields XML directives payload strings (like `<file path="/workspace/app.js">code</file>` or `<tg_send chat_id="123">msg</tg_send>`), allowing it to execute real-world tasks structurally.
3. **Execution:** The frontend's recursive parsers intersect these tags, silently writing them to the VFS or POSTing external HTTP webhooks securely, popping up UI notifications in real-time.

---

## 🚀 Getting Started
Since there is no complex backend daemon to install, spinning up KREASYS is practically instantaneous.

```bash
# 1. Clone the repository
git clone https://github.com/kreasioka/kreasiokai.git

# 2. Enter the directory
cd kreasiokai

# 3. Start a local HTTP server to bypass strict origin CORS
python3 -m http.server 8080
```
Then navigate to `http://localhost:8080` in your web browser. Supply an API key in the **Models** tab, and start building!

---

## 🤝 Contributors
We welcome pull requests! Check out our open issues to see where you can help.

<a href="https://github.com/kreasioka/kreasiokai/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kreasioka/kreasiokai" alt="Contributors Widget" />
</a>

<p align="center">
  <i>Developed with ❤️ by the <a href="https://www.kreasioka.com">KREASIOKA Team</a></i>
</p>
