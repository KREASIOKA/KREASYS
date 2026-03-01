/**
 * KREASYS WebLLM Integration — v2 with Model Library Manager
 *
 * Model weights are stored in the browser's Cache Storage API (managed by WebLLM).
 * Metadata (which models are "installed") is tracked in localforage (IndexedDB),
 * under st.cfg.wllmLib. This gives users full visibility and control.
 *
 * CDN: https://esm.run/@mlc-ai/web-llm
 */

// ── Engine State ───────────────────────────────────────────────────────────────
let wEngine = null;
let wStatus = 'idle';   // 'idle' | 'loading' | 'ready' | 'error'
let wModel = null;     // currently ACTIVE model ID
let webllm = null;     // lazy-loaded ES module

// ── Model Catalog ──────────────────────────────────────────────────────────────
const WLLM_MODELS = [
    // Tiny
    { id: 'SmolLM2-135M-Instruct-q0f16-MLC', label: 'SmolLM2 135M', family: 'SmolLM2', vram: '~0.3 GB', sizeGB: 0.27 },
    { id: 'SmolLM2-360M-Instruct-q0f16-MLC', label: 'SmolLM2 360M', family: 'SmolLM2', vram: '~0.7 GB', sizeGB: 0.64 },
    { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 0.5B', family: 'Qwen2.5', vram: '~0.5 GB', sizeGB: 0.46 },
    // Small
    { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 1.5B', family: 'Qwen2.5', vram: '~1.1 GB', sizeGB: 1.0 },
    { id: 'gemma-2-2b-it-q4f16_1-MLC', label: 'Gemma 2 2B', family: 'Gemma', vram: '~1.5 GB', sizeGB: 1.4 },
    { id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', label: 'TinyLlama 1.1B', family: 'Llama', vram: '~0.7 GB', sizeGB: 0.66 },
    { id: 'Phi-1_5-q4f16_1-MLC-1k', label: 'Phi 1.5 (1K ctx)', family: 'Phi', vram: '~1.0 GB', sizeGB: 0.84 },
    // Medium
    { id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC', label: 'Llama 3.2 3B', family: 'Llama', vram: '~2.1 GB', sizeGB: 1.9 },
    { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', label: 'Phi 3.5 Mini', family: 'Phi', vram: '~2.4 GB', sizeGB: 2.1 },
    { id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC', label: 'Phi 3 Mini (4K)', family: 'Phi', vram: '~2.2 GB', sizeGB: 1.9 },
    // Large
    { id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', label: 'Llama 3.1 8B', family: 'Llama', vram: '~5.1 GB', sizeGB: 4.9 },
    { id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC', label: 'Mistral 7B v0.3', family: 'Mistral', vram: '~4.4 GB', sizeGB: 4.1 },
    { id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 7B', family: 'Qwen2.5', vram: '~4.7 GB', sizeGB: 4.4 },
    { id: 'gemma-2-9b-it-q4f16_1-MLC', label: 'Gemma 2 9B', family: 'Gemma', vram: '~5.5 GB', sizeGB: 5.2 },
    { id: 'Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC', label: 'Hermes-2 Llama 3 8B', family: 'Llama', vram: '~5.2 GB', sizeGB: 5.0 },
    { id: 'Hermes-2-Pro-Mistral-7B-q4f16_1-MLC', label: 'Hermes-2 Mistral 7B', family: 'Mistral', vram: '~4.4 GB', sizeGB: 4.1 },
    { id: 'NeuralHermes-2.5-Mistral-7B-q4f16_1-MLC', label: 'NeuralHermes Mistral 7B', family: 'Mistral', vram: '~4.4 GB', sizeGB: 4.1 },
];

function wGetModels() { return WLLM_MODELS; }
function wCheckGPU() { return typeof navigator !== 'undefined' && 'gpu' in navigator; }
function wIsReady() { return wStatus === 'ready' && wEngine !== null; }
function wActiveModel() { return wModel; }

// ── Library Metadata (persisted in localforage via st.cfg) ──────────────────

/** Returns the in-memory library map: { [modelId]: { id, label, family, vram, downloadedAt } } */
function wLib() {
    if (!st.cfg.wllmLib) st.cfg.wllmLib = {};
    return st.cfg.wllmLib;
}

function wIsDownloaded(modelId) { return !!wLib()[modelId]; }

function wMarkDownloaded(modelId) {
    const meta = WLLM_MODELS.find(m => m.id === modelId);
    wLib()[modelId] = { id: modelId, label: meta?.label || modelId, family: meta?.family || '', vram: meta?.vram || '', sizeGB: meta?.sizeGB || 0, downloadedAt: new Date().toISOString() };
    svGlb();
}

function wMarkRemoved(modelId) {
    delete wLib()[modelId];
    svGlb();
}

// ── Cache Deletion ──────────────────────────────────────────────────────────

/**
 * Delete a model from the browser's Cache Storage.
 * WebLLM stores model shards in caches named with the model id.
 * We enumerate all cache names and delete those that contain the model id.
 */
async function wDeleteModel(modelId) {
    try {
        const keys = await caches.keys();
        let deleted = 0;
        for (const key of keys) {
            if (key.includes(modelId) || key.toLowerCase().includes('webllm')) {
                const cache = await caches.open(key);
                const reqs = await cache.keys();
                for (const req of reqs) {
                    if (req.url.includes(modelId)) { await cache.delete(req); deleted++; }
                }
                // If cache is now empty, delete the whole cache
                const remaining = await cache.keys();
                if (remaining.length === 0) await caches.delete(key);
            }
        }
        lg('SYS', `WebLLM: Deleted ${deleted} cached chunks for "${modelId}".`);
    } catch (e) {
        lg('ERR', `WebLLM: Cache deletion failed: ${e.message}`);
    }
    wMarkRemoved(modelId);
    // Unload engine if this was the active model
    if (wModel === modelId) {
        if (wEngine) { try { await wEngine.unload(); } catch (_) { } wEngine = null; }
        wModel = null; wStatus = 'idle';
    }
    if (typeof renderWllmLibrary === 'function') renderWllmLibrary();
    wUpdateStatusPill();
}

// ── UI Helpers ──────────────────────────────────────────────────────────────

function wUpdateStatusPill() {
    const pill = document.getElementById('wllm-status');
    const label = document.getElementById('wllm-status-label');
    if (!pill) return;
    const colors = { idle: 'var(--dim)', loading: 'var(--ac2)', ready: 'var(--ok)', error: 'var(--err)' };
    const labels = { idle: 'Idle', loading: 'Downloading…', ready: `Active: ${wModel || '?'}`, error: 'Error' };
    pill.style.background = colors[wStatus] || 'var(--dim)';
    if (label) label.textContent = labels[wStatus] || wStatus;
}

function wUpdateProgress(status, progress, text) {
    wStatus = status;
    const bar = document.getElementById('wllm-progress-bar');
    const barWrap = document.getElementById('wllm-progress-wrap');
    const barLbl = document.getElementById('wllm-progress-label');
    if (barWrap) barWrap.style.display = (status === 'loading') ? 'block' : 'none';
    if (bar && progress !== undefined) bar.style.width = Math.round(progress * 100) + '%';
    if (barLbl && text) barLbl.textContent = text;
    wUpdateStatusPill();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── CDN Import ──────────────────────────────────────────────────────────────

async function wImport() {
    if (webllm) return webllm;
    lg('SYS', 'WebLLM: Importing module from CDN…');
    webllm = await import('https://esm.run/@mlc-ai/web-llm');
    lg('SYS', 'WebLLM: Module loaded.');
    return webllm;
}

// ── Load / Unload ───────────────────────────────────────────────────────────

async function wLoad(modelId) {
    if (!wCheckGPU()) { wUpdateProgress('error', 0, 'WebGPU not supported'); return; }
    if (wStatus === 'loading') return;
    if (wEngine) { try { await wEngine.unload(); } catch (_) { } wEngine = null; }

    wModel = modelId;
    wUpdateProgress('loading', 0, 'Starting…');
    lg('SYS', `WebLLM: Loading "${modelId}"…`);

    try {
        const lib = await wImport();
        wEngine = await lib.CreateMLCEngine(modelId, {
            initProgressCallback: p => {
                const pct = Math.round((p.progress || 0) * 100);
                wUpdateProgress('loading', p.progress || 0, `${p.text || 'Downloading…'} (${pct}%)`);
            }
        });
        wMarkDownloaded(modelId);
        wUpdateProgress('ready', 1, '');
        wUpdateStatusPill();
        lg('SYS', `WebLLM: "${modelId}" ready. Local inference active.`);
        if (typeof showToast === 'function') showToast('Local AI Ready', modelId);
        if (typeof renderWllmLibrary === 'function') renderWllmLibrary();
    } catch (e) {
        wUpdateProgress('error', 0, e.message);
        wEngine = null; wModel = null;
        lg('ERR', 'WebLLM: ' + e.message);
        if (typeof renderWllmLibrary === 'function') renderWllmLibrary();
    }
}

async function wUnload() {
    if (wEngine) { try { await wEngine.unload(); } catch (_) { } wEngine = null; }
    wModel = null; wStatus = 'idle';
    wUpdateStatusPill();
    lg('SYS', 'WebLLM: Engine unloaded. GPU memory freed.');
    if (typeof renderWllmLibrary === 'function') renderWllmLibrary();
}

// ── Test Engine ─────────────────────────────────────────────────────────────

async function wTest(modelId) {
    const btn = document.getElementById(`wllm-test-${modelId.replace(/[^a-z0-9]/gi, '_')}`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader-2"></i> Testing…'; if (typeof lucide !== 'undefined') lucide.createIcons(); }

    // Must be the active model
    if (!wIsReady() || wModel !== modelId) {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="radio"></i> Test'; }
        if (typeof showToast === 'function') showToast('Load model first', modelId);
        return;
    }
    try {
        const reply = await wEngine.chat.completions.create({ messages: [{ role: 'user', content: 'Say the single word PASS and nothing else.' }], temperature: 0 });
        const txt = reply.choices?.[0]?.message?.content?.trim() || '';
        const pass = txt.toLowerCase().includes('pass');
        lg('SYS', `WebLLM Test [${modelId}]: ${pass ? 'PASS' : 'WARN — got: ' + txt}`);
        if (btn) { btn.disabled = false; btn.innerHTML = pass ? '<i data-lucide="check-circle-2"></i> Pass' : '<i data-lucide="alert-triangle"></i> Warn'; }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => { if (btn) { btn.innerHTML = '<i data-lucide="radio"></i> Test'; if (typeof lucide !== 'undefined') lucide.createIcons(); } }, 3000);
    } catch (e) {
        lg('ERR', `WebLLM Test failed: ${e.message}`);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="x-circle"></i> Fail'; if (typeof lucide !== 'undefined') lucide.createIcons(); }
        setTimeout(() => { if (btn) { btn.innerHTML = '<i data-lucide="radio"></i> Test'; if (typeof lucide !== 'undefined') lucide.createIcons(); } }, 3000);
    }
}

// ── Inference ───────────────────────────────────────────────────────────────

async function wLlm(systemPrompt, userMsg, temperature = 0.7, isChat = false) {
    if (!wEngine || wStatus !== 'ready') throw new Error('No local model loaded. Load a model first from the Models tab.');
    const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }];

    if (isChat) {
        const w = document.getElementById('c-log');
        const bbl = document.createElement('div'); bbl.className = 'chat-msg AGT';
        const hd = document.createElement('div'); hd.className = 'chat-hdr AGT';
        hd.innerHTML = '<i data-lucide="cpu"></i> KREASYS <span style="font-size:10px;background:rgba(0,255,204,0.15);padding:2px 6px;border-radius:4px;margin-left:6px">Local AI</span>';
        const bx = document.createElement('div'); bx.className = 'msg-ctx';
        bbl.appendChild(hd); bbl.appendChild(bx);
        if (w) { w.appendChild(bbl); w.scrollTop = w.scrollHeight; }
        if (typeof lucide !== 'undefined') lucide.createIcons();

        let full = '';
        const chunks = await wEngine.chat.completions.create({ messages, temperature, stream: true });
        for await (const chunk of chunks) {
            full += chunk.choices[0]?.delta?.content || '';
            bx.innerHTML = (typeof marked !== 'undefined') ? marked.parse(full) : full;
            if (w) w.scrollTop = w.scrollHeight;
        }
        return full;
    } else {
        const r = await wEngine.chat.completions.create({ messages, temperature });
        return r.choices?.[0]?.message?.content || '';
    }
}
