'use strict';
const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => Array.from(e.querySelectorAll(s));

// Base endpoint URLs for each provider (OpenAI-compatible /chat/completions)
const PRV = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    huggingface: 'https://router.huggingface.co/v1/chat/completions',
    ollama: 'http://localhost:11434/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    custom: ''
};

const PRV_HINTS = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    huggingface: 'https://router.huggingface.co/v1/chat/completions',
    ollama: 'http://localhost:11434/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    custom: 'Enter your custom endpoint URL here'
};

let st = {
    run: 0, tg: 0, poll: 0, id: 0, vfs: {}, tk: 0, ts: 0, bt: Date.now(), cfn: { sys: '', wrk: '' },
    cfg: { tg: '', auto: 0, tmp: 0.7, tgUsers: {}, wllmLib: {} },
    mods: [{ id: genId(), n: 'Default OpenRouter', p: 'openrouter', m: 'anthropic/claude-3-haiku', k: '', e: '', t: 'text' }]
};

const D_PERS = "You are KREASYS, a hyper-advanced browser AI. You run entirely locally in a strictly sandboxed environment. Your brain/config files are in `/system/`. All user projects, generated apps, and edited files MUST be strictly contained within `/workspace/` and its subdirectories.";
const D_SKIL = "1. ALWAYS use <file path='/workspace/path/to/file.ext'>content</file> to create/edit user files. You may create nested folders (e.g., `/workspace/js/app.js`).\n2. Do NOT output markdown code blocks. ONLY use XML <file> tags.\n3. You are restricted to modifying files inside `/workspace/` unless explicitly instructed otherwise.\n4. AUTONOMOUS MESSAGING: To send a message to a specific Telegram user, use <tg_send chat_id=\"CHAT_ID\">message</tg_send>.\n5. RICH MEDIA: To reply with media, use <media type=\"image|audio|video\" url=\"URL\"/>.\n6. MEMORY NOTE: Your persistent memory is always provided. Important facts are auto-summarized there.";

function genId() { return Math.random().toString(36).substr(2, 9) }

async function ld() {
    const d = await localforage.getItem('ksa');
    if (d) {
        if (d.cfg) st.cfg = { tgUsers: {}, wllmLib: {}, ...st.cfg, ...d.cfg };
        if (d.vfs) st.vfs = d.vfs;
        if (d.mods) st.mods = d.mods.map(x => {
            if (x.k && x.k.includes('||')) {
                const [u, k] = x.k.split('||'); let p = 'custom';
                if (u.includes('openrouter')) p = 'openrouter';
                else if (u.includes('groq')) p = 'groq';
                else if (u.includes('nvidia')) p = 'nvidia';
                else if (u.includes('openai')) p = 'openai';
                else if (u.includes('huggingface')) p = 'huggingface';
                else if (u.includes('anthropic')) p = 'anthropic';
                else if (u.includes('localhost')) p = 'ollama';
                return { id: x.id, n: x.n, p, m: x.m, k, e: p === 'custom' ? u : '', t: x.t || 'text' };
            }
            return x.p ? { ...x, t: x.t || 'text' } : { id: x.id, n: x.n, p: 'openrouter', m: x.m, k: x.k, e: '', t: x.t || 'text' };
        });
    }
    // Initialize VFS core files
    if (!st.vfs['/system/personality.md']) st.vfs['/system/personality.md'] = D_PERS;
    if (!st.vfs['/system/skills.md']) st.vfs['/system/skills.md'] = D_SKIL;
    if (!st.vfs['/system/memory.log']) st.vfs['/system/memory.log'] = '';
    if (!st.vfs['/system/memory.md']) st.vfs['/system/memory.md'] = '';

    $('#c-tg').value = st.cfg.tg;
    $('#c-auto').checked = st.cfg.auto;
    $('#c-tmp').value = st.cfg.tmp;
    $('#c-tmp').nextElementSibling.innerText = st.cfg.tmp;
    rVfs();
    renderTgUsers(); // render known users in Integrations tab
}

async function svGlb() {
    st.cfg.tg = $('#c-tg').value;
    st.cfg.tmp = parseFloat($('#c-tmp').value);
    await localforage.setItem('ksa', { cfg: st.cfg, mods: st.mods, vfs: st.vfs });
    ckDb();
}

function ckDb() { localforage.length().then(c => $('#st-db').className = c > 0 ? 'dot ok' : 'dot err').catch(() => $('#st-db').className = 'dot err') }

/** Render the known Telegram users directory in the Integrations tab */
function renderTgUsers() {
    const container = document.getElementById('tg-users-list');
    if (!container) return;
    const users = st.cfg.tgUsers || {};
    const entries = Object.entries(users);
    if (entries.length === 0) {
        container.innerHTML = '<div style="font-size:12px;color:var(--dim);padding:10px 0">No users yet. Users are auto-registered when they message the bot.</div>';
        return;
    }
    container.innerHTML = entries.map(([name, chatId]) => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);margin-bottom:6px">
            <i data-lucide="user" style="width:14px;height:14px;color:var(--ac2);flex-shrink:0"></i>
            <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:var(--txt)">${name}</div>
                <div style="font-size:11px;color:var(--dim)">Chat ID: <code style="color:var(--ac)">${chatId}</code></div>
            </div>
            <button class="btn okc" style="padding:5px 10px;font-size:11px" onclick="tgQuickMsg('${chatId}','${name}')">
                <i data-lucide="send" style="width:11px;height:11px"></i> Message
            </button>
            <button class="btn err" style="padding:5px 8px;font-size:11px" onclick="tgRemoveUser('${name}')" title="Remove from directory">
                <i data-lucide="trash-2" style="width:11px;height:11px"></i>
            </button>
        </div>`).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function tgQuickMsg(chatId, name) {
    const msg = prompt(`Send a message to ${name} (${chatId}):`);
    if (!msg) return;
    const t = st.cfg.tg;
    if (!t) return lg('ERR', 'No Telegram token configured.');
    try {
        await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg })
        });
        lg('SYS', `Manual dispatch to ${name} (${chatId}): "${msg}"`);
    } catch (e) { lg('ERR', `TG Quick Msg failed: ${e.message}`); }
}

function tgRemoveUser(name) {
    if (!confirm(`Remove "${name}" from the known users directory?`)) return;
    delete st.cfg.tgUsers[name];
    svGlb();
    renderTgUsers();
}
