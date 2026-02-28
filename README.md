<div align="center">
  <img src="https://www.kreasioka.com/img/kreasioka-banner.jpg" alt="KREASYS Banner" width="100%">
  
  <br/>
  <h1>
    <img src="https://www.kreasioka.com/img/logo.svg" alt="KREASYS Logo" width="36" align="top"> 
    KREASYS
  </h1>
  <p><strong>Autonomous Browser-Native IDE & Multi-Modal Artificial Intelligence</strong></p>
  
  <p>
    <a href="https://github.com/KREASIOKA/KREASYS/stargazers">
      <img src="https://img.shields.io/github/stars/KREASIOKA/KREASYS?style=for-the-badge&color=00ffcc" alt="GitHub Stars">
    </a>
    <a href="https://github.com/KREASIOKA/KREASYS/graphs/contributors">
      <img src="https://img.shields.io/github/contributors/KREASIOKA/KREASYS?style=for-the-badge&color=00b3ff" alt="GitHub Contributors">
    </a>
    <a href="https://www.kreasioka.com">
      <img src="https://img.shields.io/badge/Developed_by-KREASIOKA-050510?style=for-the-badge&color=050510" alt="Developed by KREASIOKA">
    </a>
  </p>
</div>

---

> **Notice: Early Stage Development**
> 
> We sincerely apologize for the current lack of extensive documentation. KREASYS is strictly in its **early alpha stage of development**. Core features are currently minimal, the codebase is subject to rapid architectural variations, and there are known bugs that have yet to be resolved. We deeply appreciate your patience and community contributions as we work to stabilize the platform.

---

## Table of Contents
- [About KREASYS](#about-kreasys)
- [Core Features](#core-features)
- [Architecture & Components](#architecture--components)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Community & Contributors](#community--contributors)

---

## About KREASYS

Developed by the [KREASIOKA Team](https://www.kreasioka.com), **KREASYS** is a 100% browser-native AI agent and Integrated Development Environment (IDE). 

By eliminating the need for a dedicated backend server node, KREASYS successfully leverages your local browser sandbox, an IndexedDB-backed Virtual File System (VFS), and API-driven Multi-Modal LLM routing to function as a fully autonomous personal software assistant. It is capable of iteratively writing and modifying code, tracking its own execution paths visually, and autonomously dispatching external communications to platforms such as Telegram.

## Core Features

* **Zero-Backend Execution:** The entire engine runs strictly client-side via JavaScript modules, fetching LLM inference directly from external endpoints.
* **Advanced Virtual File System (VFS):** A deeply integrated, hierarchical file explorer mapped directly to your browser's persistent storage.
* **Multi-Modal Auto-Router:** Native capability differentiation. The system parses user intent to route distinct workloads to specialized models (Text, Multimodal, Vision, ImageGen, Audio, Video).
* **Live Task Visualization:** Real-time generation of execution plans displayed as animated flowcharts within the system terminal UI.
* **Autonomous Agent Delegation:** Webhook-free, background polling for Telegram bots. KREASYS can autonomously dispatch asynchronous messages dynamically using internal XML routing directives.

## Architecture & Components

KREASYS operates on a modular frontend architecture to ensure rapid scale and parallel performance:

*   `css/styles.css` — The UI presentation layer featuring minimalist "liquid glass" UI/UX styling and dark-mode heuristics.
*   `js/core/state.js` — Global state management, persistent VFS serialization layers, and AI prompt matrix bounds.
*   `js/core/vfs.js` — Recursive file tree parsing, sandboxing adherence protocols, and Action Router notification event dispatchers.
*   `js/core/ai.js` — The multi-model inference pipeline, custom routing mechanisms, and directive response parsing.
*   `js/core/telegram.js` — Long-polling communication loops and autonomous UI dispatch protocols for human-agent interaction.
*   `js/ui/app.js` — DOM rendering engines, state-to-view adapters, dynamic tab navigation, and interactive component rendering.

## How It Works

1. **Context Assembly:** Upon receiving a user prompt, KREASYS audits environmental states, memory logs, and VFS file trees to construct a cohesive system context payload.
2. **Execution & Directives:** KREASYS infers intent using the selected LLM endpoint. It responds systematically using structured XML tags (e.g., `<file path="...">` or `<tg_send chat_id="...">`).
3. **DOM & Action Mapping:** The frontend intercepts these operational tags. It sequentially modifies the virtual environment, triggers notification UI toasts, or transmits external network requests based on the AI's autonomous determination.

## Getting Started

Because KREASYS requires no complex backend environments, deployment on your local machine is nearly instantaneous.

```bash
# 1. Clone the repository
git clone https://github.com/KREASIOKA/KREASYS.git

# 2. Navigate to the project directory
cd KREASYS

# 3. Serve the directory to bypass browser CORS restrictions
python3 -m http.server 8080
```
Access the application by pointing your browser to `http://localhost:8080`. Bind your API access keys within the **Models** graphical tab to initialize the autonomous engine.

---

## Community & Contributors

We warmly welcome pull requests and issue submissions to accelerate the rapid development of KREASYS! 

<div align="center">
  <a href="https://github.com/KREASIOKA/KREASYS/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=KREASIOKA/KREASYS" alt="Contributors Widget" />
  </a>
  
  <br/><br/>
  <i>Built, designed, and maintained by the <a href="https://www.kreasioka.com">KREASIOKA Team</a>.</i>
</div>
