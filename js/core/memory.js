/**
 * KREASYS Memory System — v2
 *
 * Two-layer memory architecture:
 *   /system/memory.log  — raw, append-only session log (capped at 8000 chars)
 *   /system/memory.md   — AI-summarized persistent memory (important facts only)
 *
 * When idle for 60 seconds, memCompress() fires to summarize the log into memory.md,
 * then clears the raw log to prevent unbounded growth.
 */

let _memIdleTimer = null;
let _memCompressing = false;

/** Append a line to the raw session log (capped). Called by lg() in app.js. */
function memAppend(role, content) {
    let log = st.vfs['/system/memory.log'] || '';
    log += `[${new Date().toISOString()}] ${role}: ${content.substring(0, 400)}\n`;
    // Cap at 8000 chars — drop the oldest entries
    if (log.length > 8000) log = log.substring(log.length - 8000);
    st.vfs['/system/memory.log'] = log;
    // Update live editor if file is open
    const ed = document.getElementById('vfs-ed-sys');
    if (ed && (st.cfn?.sys === '/system/memory.log' || st.cfn?.sys === '/system/memory.md')) ed.value = st.vfs[st.cfn.sys] || '';
}

/** Returns the persistent AI memory context to inject into every prompt. */
function memContext() {
    const mem = st.vfs['/system/memory.md'] || '(No persistent memory yet.)';
    const log = st.vfs['/system/memory.log'] || '';
    return `=== PERSISTENT MEMORY (AI-summarized) ===\n${mem}\n\n=== RECENT SESSION LOG (last ~8000 chars) ===\n${log}`;
}

/**
 * Called when the system has been idle for 60 seconds.
 * Summarizes /system/memory.log → /system/memory.md using the AI.
 * Clears the raw log after a successful compression.
 */
async function memCompress() {
    if (_memCompressing) return;
    const log = st.vfs['/system/memory.log'] || '';
    if (!log.trim() || log.split('\n').length < 5) return; // Not enough to summarize
    if (!st.mods.length) return;

    // Find the best text model (prefer a lightweight one)
    const textMods = st.mods.filter(m => (m.t === 'text' || !m.t) && m.p !== 'webllm' && m.k);
    const mod = textMods[0] || st.mods.find(m => m.k);
    if (!mod) return; // No configured API model

    _memCompressing = true;
    lg('SYS', 'Memory: Compressing session log into persistent memory...');

    const existingMem = st.vfs['/system/memory.md'] || '';
    const systemPrompt = `You are a memory manager for an AI assistant named KREASYS.
Your job: given a raw session log and the current persistent memory, produce an UPDATED persistent memory document.

Rules:
1. Keep the memory concise (max 2000 chars).
2. Preserve critical facts: user preferences, names, ongoing tasks, key decisions, API configs.
3. Remove duplicate or trivial information.
4. Write in bullet-point format grouped by category (Users, Tasks, Preferences, System State, etc.).
5. Do not include raw timestamps or log noise.
6. ONLY output the updated memory document. No commentary.`;

    const userMsg = `EXISTING MEMORY:\n${existingMem || '(empty)'}\n\nRAW SESSION LOG TO COMPRESS:\n${log}`;

    try {
        const compressed = await llm(systemPrompt, userMsg, mod);
        if (compressed && compressed.trim().length > 20) {
            st.vfs['/system/memory.md'] = compressed.trim();
            st.vfs['/system/memory.log'] = ''; // Clear the raw log
            await svGlb();
            lg('SYS', `Memory: Compressed. Saved ${compressed.length} chars to memory.md.`);
            if (typeof showToast === 'function') showToast('Memory updated', '/system/memory.md');
        }
    } catch (e) {
        lg('ERR', `Memory compression failed: ${e.message}`);
    } finally {
        _memCompressing = false;
    }
}

/** Reset the idle countdown every time the AI runs a task. */
function memResetIdle() {
    if (_memIdleTimer) clearTimeout(_memIdleTimer);
    _memIdleTimer = setTimeout(async () => {
        if (st.run === 0 && !_memCompressing) {
            await memCompress();
        }
    }, 60000); // 60 seconds of idle
}

/** Boot: start the idle watcher. Called from boot() in app.js. */
function memInit() {
    memResetIdle();
    lg('SYS', 'Memory system initialized. Auto-compress on 60s idle.');
}
