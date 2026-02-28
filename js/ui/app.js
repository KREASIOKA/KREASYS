async function boot() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist() } catch (e) { }
    if (window.innerWidth > 768) $('#st-ram-w').style.display = 'inline-flex';
    await ld();
    uiMod();
    bind();
    setInterval(hlth, 1000);
    if (st.cfg.auto) tgTog();
    lg('SYS', 'KREASYS Core Initialized. VFS Data securely segregated.');
    ckDb();
}

let pendingAttachment = null;
let deferredInstallPrompt = null;

function bind() {
    $$('.nav-tab').forEach(t => t.onclick = () => { $$('.nav-tab').forEach(x => x.classList.remove('active')); $$('.panel').forEach(x => x.classList.remove('active')); t.classList.add('active'); $(`#${t.dataset.target}`).classList.add('active') });
    const h = function () { this.style.height = '50px'; this.style.height = Math.min(this.scrollHeight, 150) + 'px' };
    $('#c-in').oninput = h; $('#t-in').oninput = h;
    const x = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!st.run) { if (e.target.id === 'c-in') sendChat(); else xc($('#t-in').value, 0) } } };
    $('#c-in').onkeydown = x; $('#t-in').onkeydown = x;
    $('#btn-run-c').onclick = () => sendChat();
    $('#btn-run-t').onclick = () => xc($('#t-in').value, 0);
    $('#btn-stop-c').onclick = () => st.run = 0;
    const attachBtn = $('#btn-attach');
    if (attachBtn) attachBtn.onclick = () => $('#chat-file-in').click();
    const fileIn = $('#chat-file-in');
    if (fileIn) fileIn.onchange = e => handleAttach(e);
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; const btn = $('#btn-install'); if (btn) btn.style.display = 'flex'; });
    window.addEventListener('appinstalled', () => { const btn = $('#btn-install'); if (btn) btn.style.display = 'none'; deferredInstallPrompt = null; lg('SYS', 'KREASYS installed as PWA.'); });
}

function sendChat() {
    const q = $('#c-in').value;
    if (!q.trim() && !pendingAttachment) return;
    xc(q, 1, pendingAttachment);
    pendingAttachment = null;
    const prev = $('#attach-preview');
    if (prev) prev.remove();
}

function handleAttach(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isText = file.type.startsWith('text/') || /\.(md|js|py|json|html|css|ts|jsx|txt|csv|xml|yaml|yml)$/i.test(file.name);
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = ev => {
        pendingAttachment = { name: file.name, type: file.type, size: file.size, isText, content: isText ? ev.target.result : null, dataUrl: isImage ? ev.target.result : null };
        const existing = $('#attach-preview'); if (existing) existing.remove();
        const chip = document.createElement('div');
        chip.id = 'attach-preview';
        chip.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,179,255,0.1);border:1px solid rgba(0,179,255,0.3);border-radius:8px;font-size:12px;color:var(--ac2);flex-shrink:0;';
        if (isImage) { const thumb = document.createElement('img'); thumb.src = ev.target.result; thumb.style.cssText = 'width:42px;height:42px;border-radius:5px;object-fit:cover;flex-shrink:0;'; chip.appendChild(thumb); }
        chip.innerHTML += `<i data-lucide="paperclip" style="width:13px;height:13px;flex-shrink:0"></i><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${file.name}</span><i data-lucide="x" style="width:13px;height:13px;cursor:pointer;color:var(--err);flex-shrink:0" onclick="pendingAttachment=null;document.getElementById('attach-preview').remove();document.getElementById('chat-file-in').value=''"></i>`;
        const bar = $('#c-in').closest ? $('#c-in').parentElement.parentElement : null;
        if (bar) bar.insertBefore(chip, bar.firstChild);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };
    if (isText) reader.readAsText(file); else reader.readAsDataURL(file);
    e.target.value = '';
}

function uiMod() {
    const p = $('#mod-list'); p.innerHTML = '';
    st.mods.forEach(m => {
        const d = document.createElement('div'); d.className = 'mod-row'; d.dataset.id = m.id;
        const isC = m.p === 'custom' ? 'block' : 'none';
        d.innerHTML = `<div class="mod-hdr"><input class="mn" value="${m.n}" placeholder="Alias (e.g. My Fast Groq)" style="flex:1;min-width:150px"><button class="btn okc" onclick="tstMod('${m.id}')" style="padding:6px 10px"><i data-lucide="radio"></i> Test</button><button class="btn primary" onclick="svMod('${m.id}')" style="padding:6px 10px"><i data-lucide="save"></i> Save</button><button class="btn err dtb" onclick="rmMod('${m.id}')" style="padding:6px 10px"><i data-lucide="trash-2"></i></button></div><div class="mod-cfg"><select class="mp" onchange="chgPrv(this,'${m.id}')"><option value="openrouter" ${m.p === 'openrouter' ? 'selected' : ''}>OpenRouter</option><option value="groq" ${m.p === 'groq' ? 'selected' : ''}>Groq</option><option value="nvidia" ${m.p === 'nvidia' ? 'selected' : ''}>NVIDIA</option><option value="custom" ${m.p === 'custom' ? 'selected' : ''}>Custom</option></select><select class="mt"><option value="text" ${(m.t || 'text') === 'text' ? 'selected' : ''}>Text</option><option value="multimodal" ${m.t === 'multimodal' ? 'selected' : ''}>Multimodal</option><option value="vision" ${m.t === 'vision' ? 'selected' : ''}>Vision</option><option value="image" ${m.t === 'image' ? 'selected' : ''}>ImageGen</option><option value="audio" ${m.t === 'audio' ? 'selected' : ''}>Audio</option><option value="video" ${m.t === 'video' ? 'selected' : ''}>Video</option></select><input class="mm" value="${m.m}" placeholder="Model ID (e.g. llama3-8b)"><input type="password" class="mk" value="${m.k}" placeholder="Bearer Token (API Key)"></div><input class="me" value="${m.e || ''}" placeholder="Custom Endpoint URL" style="display:${isC}">`;
        p.appendChild(d);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function chgPrv(s, id) { const r = $(`.mod-row[data-id="${id}"]`); if (s.value === 'custom') $('.me', r).style.display = 'block'; else $('.me', r).style.display = 'none'; }
function addModUI() { st.mods.push({ id: genId(), n: '', p: 'openrouter', m: '', k: '', e: '', t: 'text' }); uiMod() }
async function svMod(id) {
    const r = $(`.mod-row[data-id="${id}"]`); const m = st.mods.find(x => x.id === id);
    if (m) {
        m.n = $('.mn', r).value; m.p = $('.mp', r).value; m.t = $('.mt', r).value; m.m = $('.mm', r).value; m.k = $('.mk', r).value; m.e = $('.me', r).value;
        const b = $('.primary', r); b.innerHTML = '<i data-lucide="check"></i> Saved'; if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => { b.innerHTML = '<i data-lucide="save"></i> Save' }, 1500);
        await svGlb();
    }
}
function rmMod(id) { if (st.mods.length > 1) { st.mods = st.mods.filter(m => m.id !== id); uiMod(); svGlb() } }
async function tstMod(id) {
    const r = $(`.mod-row[data-id="${id}"]`);
    const tm = { id, n: $('.mn', r).value, p: $('.mp', r).value, m: $('.mm', r).value, k: $('.mk', r).value, e: $('.me', r).value };
    const b = $('.okc', r); b.innerHTML = '<i data-lucide="loader"></i> Ping'; if (typeof lucide !== 'undefined') lucide.createIcons();
    try {
        const res = await llm('Say EXACTLY "OK"', 'Respond OK', tm);
        if (res.trim().includes('OK')) { b.innerHTML = '<i data-lucide="check"></i> PASS'; lg('SYS', `[${tm.n}] API Connection PASS.`) }
        else { b.innerHTML = '<i data-lucide="alert-triangle"></i> WARN'; lg('SYS', `[${tm.n}] WARN: ${res}`) }
    } catch (e) { b.innerHTML = '<i data-lucide="x"></i> FAIL'; lg('ERR', `[${tm.n}] FAIL: ${e.message}`) }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { b.innerHTML = '<i data-lucide="radio"></i> Test'; if (typeof lucide !== 'undefined') lucide.createIcons(); }, 2500);
}

function ckDb() { localforage.length().then(c => $('#st-db').className = c > 0 ? 'dot ok' : 'dot err').catch(() => $('#st-db').className = 'dot err') }

function showToast(msg, filePath) {
    const c = $('#toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<i data-lucide="bell"></i> <div><b>${msg}</b><br><span style="font-size:11px;color:var(--dim)">${filePath}</span></div>`;

    t.onclick = () => {
        const wTab = $$('.nav-tab').find(x => x.dataset.target === 'p-ide');
        if (wTab) wTab.click();

        setTimeout(() => {
            const items = $$('.ide-tree-item');
            const target = items.find(x => x.querySelector('span').title === filePath);
            if (target) {
                target.click();
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

        t.classList.remove('show');
        setTimeout(() => t.remove(), 400);
    };

    c.appendChild(t);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    requestAnimationFrame(() => t.classList.add('show'));

    setTimeout(() => {
        if (t.parentNode) {
            t.classList.remove('show');
            setTimeout(() => { if (t.parentNode) t.remove(); }, 400);
        }
    }, 5000);
}

function renderPlan(steps) {
    const c = $('#flowchart-container');
    if (!c) return;
    c.style.display = 'flex';
    c.innerHTML = '';

    steps.forEach((s, idx) => {
        const d = document.createElement('div');
        d.className = `flow-step ${s.status}`;

        let icon = 'circle';
        if (s.status === 'done') icon = 'check-circle';
        if (s.status === 'active') icon = 'loader';

        d.innerHTML = `<i data-lucide="${icon}" style="width:14px;height:14px"></i><span>${s.name}</span>`;
        c.appendChild(d);

        if (idx < steps.length - 1) {
            const a = document.createElement('i');
            a.className = 'flow-arrow';
            a.setAttribute('data-lucide', 'arrow-right');
            a.style.width = '14px';
            a.style.height = '14px';
            c.appendChild(a);
        }
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function psPlan(ctx) {
    const m = ctx.match(/<plan>([\s\S]*?)<\/plan>/i);
    if (!m) {
        if ($('#flowchart-container')) $('#flowchart-container').style.display = 'none';
        return;
    }

    const steps = [];
    const stepRg = /<step\s+status=["']([^"']+)["']>([\s\S]*?)<\/step>/gi;
    let sm;
    while ((sm = stepRg.exec(m[1])) !== null) {
        steps.push({ status: sm[1].toLowerCase(), name: sm[2].trim() });
    }

    if (steps.length > 0) renderPlan(steps);
    else if ($('#flowchart-container')) $('#flowchart-container').style.display = 'none';
}

function lg(r, c) {
    const w = $('#t-log'), e = document.createElement('div'); e.className = 'msg';
    if (r === 'SYS' || r === 'ERR') c = `[${new Date().toLocaleTimeString()}] ${c}`;
    const h = (typeof marked !== 'undefined') ? marked.parse(c) : c;
    e.innerHTML = `<div class="msg-role ${r}">${r}</div><div class="msg-ctx">${h}</div>`;
    w.appendChild(e); w.scrollTop = w.scrollHeight;
    if (r === 'SYS' || r === 'AGT' || r === 'ERR') {
        let m = st.vfs['/system/memory.log'] || '';
        m += `[${new Date().toISOString()}] ${r}: ${c.substring(0, 500)}\n`;
        if (m.length > 50000) m = m.substring(m.length - 50000);
        st.vfs['/system/memory.log'] = m; svGlb();
        if (st.cfn.sys === '/system/memory.log') $('#vfs-ed-sys').value = m;
    }
}
function renderMedia(raw) {
    // Render <media type="image|audio|video" url="..."/> tags from AI responses
    return raw.replace(/<media\s+type=["'](image|audio|video)["']\s+url=["']([^"']+)["']\s*\/?>/gi, (_, type, url) => {
        if (type === 'image') return `<img src="${url}" style="max-width:100%;border-radius:10px;margin-top:10px;box-shadow:0 4px 20px rgba(0,0,0,0.4)" loading="lazy" alt="AI Generated Image">`;
        if (type === 'audio') return `<audio controls style="width:100%;margin-top:10px;border-radius:8px"><source src="${url}">Your browser does not support audio.</audio>`;
        if (type === 'video') return `<video controls style="max-width:100%;border-radius:10px;margin-top:10px"><source src="${url}">Your browser does not support video.</video>`;
        return '';
    });
}

function chLg(r, c, attachment) {
    const w = $('#c-log'), e = document.createElement('div'); e.className = `chat-msg ${r}`;
    const hd = document.createElement('div'); hd.className = `chat-hdr ${r}`;
    hd.innerHTML = r === 'USR' ? '<i data-lucide="user"></i> You' : '<i data-lucide="bot"></i> KREASYS';
    const bx = document.createElement('div'); bx.className = 'msg-ctx';

    // If user has an attachment, show a preview
    if (r === 'USR' && attachment) {
        if (attachment.dataUrl && attachment.type.startsWith('image/')) {
            bx.innerHTML += `<img src="${attachment.dataUrl}" style="max-width:260px;border-radius:10px;margin-bottom:8px;display:block;box-shadow:0 4px 20px rgba(0,0,0,0.4)" alt="${attachment.name}">`;
        } else {
            bx.innerHTML += `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(0,179,255,0.1);border:1px solid rgba(0,179,255,0.3);border-radius:6px;font-size:12px;color:var(--ac2);margin-bottom:8px"><i data-lucide="paperclip" style="width:12px;height:12px"></i>${attachment.name}</div>`;
        }
    }

    // Render text with markdown and media tags
    const cleaned = r === 'AGT' ? renderMedia(c) : c;
    bx.innerHTML += (typeof marked !== 'undefined') ? marked.parse(cleaned) : cleaned;

    e.appendChild(hd); e.appendChild(bx); w.appendChild(e); w.scrollTop = w.scrollHeight;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function clearTerm() { $('#t-log').innerHTML = '' }

function hlth() {
    if (performance.memory && window.innerWidth > 768) $('#st-ram').innerText = `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB`;
    $('#m-tk').innerText = st.tk; $('#m-ts').innerText = st.ts;
    const s = Math.floor((Date.now() - st.bt) / 1000);
    $('#m-up').innerText = `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
}

// Start sequence
boot();
