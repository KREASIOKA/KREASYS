'use strict';
const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => Array.from(e.querySelectorAll(s));
const PRV = { openrouter: 'https://openrouter.ai/api/v1/chat/completions', groq: 'https://api.groq.com/openai/v1/chat/completions', nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions', custom: '' };
let st = {
    run: 0, tg: 0, poll: 0, id: 0, vfs: {}, tk: 0, ts: 0, bt: Date.now(), cfn: { sys: '', wrk: '' },
    cfg: { tg: '', auto: 0, tmp: 0.7 },
    mods: [{ id: genId(), n: 'Default OpenRouter', p: 'openrouter', m: 'anthropic/claude-3-haiku', k: '', e: '', t: 'text' }]
};

const D_PERS = "You are KREASYS, a hyper-advanced browser AI. You run entirely locally in a strictly sandboxed environment. Your brain/config files are in `/system/`. All user projects, generated apps, and edited files MUST be strictly contained within `/workspace/` and its subdirectories.";
const D_SKIL = "1. ALWAYS use <file path='/workspace/path/to/file.ext'>content</file> to create/edit user files. You may create nested folders (e.g., `/workspace/js/app.js`).\n2. Do NOT output markdown code blocks. ONLY use XML <file> tags.\n3. You are restricted to modifying files inside `/workspace/` unless explicitly instructed otherwise.";

function genId() { return Math.random().toString(36).substr(2, 9) }

async function ld() {
    const d = await localforage.getItem('ksa');
    if (d) {
        if (d.cfg) st.cfg = { ...st.cfg, ...d.cfg };
        if (d.vfs) st.vfs = d.vfs;
        if (d.mods) st.mods = d.mods.map(x => {
            if (x.k && x.k.includes('||')) {
                const [u, k] = x.k.split('||'); let p = 'custom';
                if (u.includes('openrouter')) p = 'openrouter';
                else if (u.includes('groq')) p = 'groq';
                else if (u.includes('nvidia')) p = 'nvidia';
                return { id: x.id, n: x.n, p, m: x.m, k, e: p === 'custom' ? u : '', t: x.t || 'text' };
            }
            return x.p ? { ...x, t: x.t || 'text' } : { id: x.id, n: x.n, p: 'openrouter', m: x.m, k: x.k, e: '', t: x.t || 'text' };
        });
    }
    if (!st.vfs['/system/personality.md']) st.vfs['/system/personality.md'] = D_PERS;
    if (!st.vfs['/system/skills.md']) st.vfs['/system/skills.md'] = D_SKIL;
    if (!st.vfs['/system/memory.log']) st.vfs['/system/memory.log'] = '';

    $('#c-tg').value = st.cfg.tg;
    $('#c-auto').checked = st.cfg.auto;
    $('#c-tmp').value = st.cfg.tmp;
    $('#c-tmp').nextElementSibling.innerText = st.cfg.tmp;
    rVfs();
}

async function svGlb() {
    st.cfg.tg = $('#c-tg').value;
    st.cfg.tmp = parseFloat($('#c-tmp').value);
    await localforage.setItem('ksa', { cfg: st.cfg, mods: st.mods, vfs: st.vfs });
    ckDb();
}

function ckDb() { localforage.length().then(c => $('#st-db').className = c > 0 ? 'dot ok' : 'dot err').catch(() => $('#st-db').className = 'dot err') }
