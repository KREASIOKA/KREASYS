<div align="center">
  <img src="https://www.kreasioka.com/img/kreasioka-banner.jpg" alt="KREASYS Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px;">
  <br>
  <img src="https://www.kreasioka.com/img/logo.svg" alt="KREASYS Logo" width="120">
  <h1>KREASYS</h1>
  <p><strong>Autonomous Browser-Native IDE & Multi-Modal AI Ecosystem</strong></p>

  <p>
    <a href="https://github.com/KREASIOKA/KREASYS/stargazers">
      <img src="https://img.shields.io/github/stars/KREASIOKA/KREASYS?style=for-the-badge&color=00ffcc&logo=github&logoColor=white" alt="Stars">
    </a>
    <a href="https://github.com/KREASIOKA/KREASYS/graphs/contributors">
      <img src="https://img.shields.io/github/contributors/KREASIOKA/KREASYS?style=for-the-badge&color=00b3ff&logo=github" alt="Contributors">
    </a>
    <a href="https://www.linkedin.com/company/kreasioka/">
      <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="js">
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="html">
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="css">
    <img src="https://img.shields.io/badge/WebGPU-Enabled-00ffcc?style=flat-square&logo=webgpu&logoColor=white" alt="webgpu">
    <img src="https://img.shields.io/badge/PWA-Certified-673AB7?style=flat-square&logo=pwa&logoColor=white" alt="pwa">
  </p>
</div>

---

### <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/triangle-exclamation.svg" width="20" height="20"> Notice: Early Development Alpha
> **Disclaimer:** KREASYS is currently in its early alpha stages of development. Features are evolving rapidly, and the codebase is subjected to significant changes. We appreciate your technical contributions and feedback during this phase.

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/compass.svg" width="20" height="20"> Navigation
- [What is KREASYS?](#what-is-kreasys)
- [System Architecture](#system-architecture)
- [Local AI Ecosystem](#local-ai-ecosystem)
- [Self-Modifying Memory](#self-modifying-memory)
- [Telegram Autonomous Hub](#telegram-autonomous-hub)
- [Core Components](#core-components)
- [Quick Start](#quick-start)

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/circle-info.svg" width="20" height="20"> What is KREASYS?
Developed by the **KREASIOKA team**, **KREASYS** is a hyper-modular, browser-native IDE designed for autonomous AI interaction. It allows AI agents to operate within a sandboxed Virtual File System (VFS), creating and editing files while maintaining a persistent memory loop—all without a server backend.

### <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/bolt.svg" width="18" height="18"> Key Capabilities
- **Browser-Native VFS:** Persistent hierarchical storage using IndexedDB (localforage) for secure, local-first development.
- **WebLLM Dedicated Engine:** Run powerful LLMs (Llama 3.1, Phi 3, etc.) entirely on your local GPU via WebGPU.
- **Smart Memory System:** Automatic summarization of logs into persistent memory to prevent context bloat.
- **Autonomous Delegation:** Full Telegram integration with cross-user messaging and automated task execution.
- **Multi-Modal Routing:** Intent-based model selection (Text, Image, Audio, Video, Vision).

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/sitemap.svg" width="20" height="20"> System Architecture
KREASYS follows a reactive, event-driven architecture that separates state persistence from UI rendering.

```mermaid
graph TD
    User([User Input]) --> Router{Intent Router}
    Router -->|Local| WLLM[WebLLM Engine - GPU]
    Router -->|Remote| API[API Providers]
    
    WLLM --> Memory[Memory Summarizer]
    API --> Memory
    
    Memory --> VFS[(Virtual File System)]
    Memory --> TG[Telegram / User Hub]
    Memory --> UI[Unified Interface]
```

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/microchip.svg" width="20" height="20"> Local AI Ecosystem
KREASYS features a dedicated **Local AI** tab that leverages the **WebLLM** library for true privacy and speed.

- **Private & Metadata-Secure:** Once downloaded, models run entirely on your local GPU with no external data leakage.
- **Hardware Acceleration:** Full WebGPU utilization for near-native inference speeds in the browser.
- **Model Library:** Manage Llama, Phi, Gemma, and Mistral families directly from the UI.
- **Seamless Loading:** Models are cached in the browser's Cache Storage API for instant subsequent use.

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/brain.svg" width="20" height="20"> Self-Modifying Memory
The V2 memory system introduces a dual-layer architecture to handle long-running autonomous tasks:

1. **Memory Log (`/system/memory.log`):** Raw session activity used for immediate context.
2. **Persistent Memory (`/system/memory.md`):** AI-summarized facts, user preferences, and key progress.
- **Autonomous Summarization:** When idle, the system automatically compresses the raw log into the persistent memory file, clearing the log to maintain high-quality context and prevent hallucinations.

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/paper-plane.svg" width="20" height="20"> Telegram Autonomous Hub
The Telegram integration allows KREASYS to act as a 24/7 autonomous employee.

- **User Directory:** Automatically registers everyone who interacts with the bot.
- **Cross-User Messaging:** One user can instruct the AI to contact another user via the directory.
- **Multi-Media Support:** Process and send images, documents, and audio autonomously.
- **Remote VFS Access:** Edit and view your workspace files via Telegram commands.

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/cubes.svg" width="20" height="20"> Core Components

### 1. State Management (`js/core/state.js`)
The application's central nervous system. It handles the `st` global object and coordinates atomic synchronization.

### 2. Autonomous Memory (`js/core/memory.js`)
Manages the idle-time summarization loop and the dual-layer context injection logic.

### 3. Native IDE Engine (`js/core/vfs.js`)
Manages the memory-mapped file tree and provides the AI with a structured view of the workspace.

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/terminal.svg" width="20" height="20"> Quick Start
KREASYS is strictly client-side. You only need a local static server to bypass CORS during development.

```bash
# Clone the repository
git clone https://github.com/KREASIOKA/KREASYS/

# Serve locally (WebGPU requires localhost/HTTPS)
python3 -m http.server 8080
```
Open `http://localhost:8080` to begin. Configure your models in the **Models** and **Local AI** tabs.

---

## <img src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/solid/users.svg" width="20" height="20"> Contributors
We welcome contributions to advance the frontier of browser-native AI!

<div align="center">
  <a href="https://github.com/KREASIOKA/KREASYS/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=KREASIOKA/KREASYS" alt="Contributors Widget" />
  </a>
</div>

<p align="center">
  <i>Maintained by the <b>KREASIOKA Team</b></i><br>
  <a href="https://www.kreasioka.com">www.kreasioka.com</a><br>
  <a href="https://www.linkedin.com/company/kreasioka/">LinkedIn</a>
</p>
