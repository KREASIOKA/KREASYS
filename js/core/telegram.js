const _TG_TAB_ID = Math.random().toString(36).substring(2, 10);
let _tgLockActive = false;

function tgTog() {
    st.cfg.auto = $('#c-auto').checked; svGlb();
    if (st.cfg.auto) {
        lg('SYS', 'Telegram: 24/7 autonomous mode toggled ON.');
        tgTakeControl(); // Try to take the lock
    } else {
        lg('SYS', 'Telegram: Polling disabled.');
        if (st.poll) { clearInterval(st.poll); st.poll = 0; }
        _tgLockActive = false;
    }
}

/** Take ownership of Telegram polling for this browser tab */
function tgTakeControl() {
    localStorage.setItem('tg_lock', _TG_TAB_ID);
    localStorage.setItem('tg_lock_time', Date.now());
    _tgLockActive = true;
    if (!st.poll) st.poll = setInterval(tgPoll, 5000);
    $('#btn-tg-lock').style.display = 'none';
    lg('SYS', 'Telegram: This tab has taken control of the bot polling.');
}

async function tstTg() {
    const t = $('#c-tg').value, b = $('#btn-tst-tg');
    if (!t) return lg('ERR', 'No Telegram token configured.');
    b.innerHTML = '<i data-lucide="loader"></i> Pinging...'; if (typeof lucide !== 'undefined') lucide.createIcons();
    try {
        const r = await fetch(`https://api.telegram.org/bot${t}/getMe`);
        const d = await r.json();
        if (d.ok) {
            b.innerText = `OK: @${d.result.username}`; b.className = 'btn okc';
            lg('SYS', `Telegram connected: @${d.result.username}`);
        } else {
            b.innerText = 'FAIL'; b.className = 'btn err';
            lg('ERR', `Telegram error: ${d.description}`);
        }
    } catch (e) { b.innerText = 'FAIL'; b.className = 'btn err'; lg('ERR', `Telegram ping failed: ${e.message}`); }
    setTimeout(() => { b.innerHTML = '<i data-lucide="plug"></i> Test Connection'; b.className = 'btn okc'; if (typeof lucide !== 'undefined') lucide.createIcons(); }, 4000);
}

async function tgXc(msg, t, fileCtx) {
    st.ts++;

    // AUTO-REGISTER user in the known users directory
    if (!st.cfg.tgUsers) st.cfg.tgUsers = {};
    const uname = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    st.cfg.tgUsers[uname] = msg.chat.id;
    svGlb();
    if (typeof renderTgUsers === 'function') renderTgUsers(); // update the UI table

    // Build the known users list for the AI prompt
    const knownUsers = Object.keys(st.cfg.tgUsers).length > 0
        ? Object.entries(st.cfg.tgUsers).map(([name, id]) => `- ${name}: chat_id=${id}`).join('\n')
        : 'None yet.';

    const q = `[TELEGRAM from ${uname} (chat_id: ${msg.chat.id})]: ${msg.text || '[No text — see attached file]'}`;
    lg('USR', q);

    // Reset memory idle timer
    if (typeof memResetIdle === 'function') memResetIdle();

    const m = await route(q, fileCtx);

    // Two-layer memory context
    const memCtx = (typeof memContext === 'function') ? memContext() : (st.vfs['/system/memory.log'] || '');

    const p = `${st.vfs['/system/personality.md']}

SKILLS:
${st.vfs['/system/skills.md']}

KNOWN TELEGRAM USERS (you CAN send messages to any of these users using <tg_send chat_id="ID">message</tg_send>):
${knownUsers}

${memCtx}

VFS STATE:
${buildVfsContext()}

CRITICAL RULE: You are responding to a Telegram message from ${uname}. Plain text in your reply goes directly to their Telegram chat. Use <tg_send> to message OTHER users autonomously.`;

    let userMsg = q;
    if (fileCtx) {
        userMsg = `${q}\n\n[ATTACHED: "${fileCtx.name}" (${fileCtx.type})]${fileCtx.isText && fileCtx.content ? '\nContents:\n' + fileCtx.content : fileCtx.url ? '\nURL: ' + fileCtx.url : ''}`;
    }

    try {
        const r = await llm(p, userMsg, m);
        lg('AGT', r);

        // Append to memory log
        if (typeof memAppend === 'function') {
            memAppend('USR', `[TG/${uname}] ${msg.text || '[file]'}`);
            memAppend('AGT', r.substring(0, 300));
        }

        psVfs(r);

        // Process autonomous dispatches to OTHER users
        const tgRg = /<tg_send\s+chat_id=["']?([^"'>]+)["']?>([\s\S]*?)<\/tg_send>/gi;
        let tm;
        while ((tm = tgRg.exec(r)) !== null) {
            const tgtId = tm[1].trim(), payload = tm[2].trim();
            lg('SYS', `Autonomous TG dispatch -> chat_id:${tgtId}`);
            fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: tgtId, text: payload })
            }).catch(e => lg('ERR', `TG Dispatch failed: ${e.message}`));
        }

        // Process media replies (<media type="image|audio|video" url="..."/>)
        const mediaRg = /<media\s+type=["'](image|audio|video)["']\s+url=["']([^"']+)["']\s*\/?>/gi;
        let mm;
        while ((mm = mediaRg.exec(r)) !== null) {
            const type = mm[1], url = mm[2];
            let api = 'sendPhoto', key = 'photo';
            if (type === 'audio') { api = 'sendAudio'; key = 'audio'; }
            if (type === 'video') { api = 'sendVideo'; key = 'video'; }
            fetch(`https://api.telegram.org/bot${t}/${api}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: msg.chat.id, [key]: url })
            }).catch(e => lg('ERR', `TG ${type} send failed: ${e.message}`));
        }

        // Clean reply to send back to the original sender
        let cleanReply = r
            .replace(/<file[^>]*>[\s\S]*?<\/file>/g, '')
            .replace(/<tg_send[^>]*>[\s\S]*?<\/tg_send>/g, '')
            .replace(/<media[^>]*\/>/gi, '')
            .replace(/<plan[^>]*>[\s\S]*?<\/plan>/gi, '')
            .trim();

        if (!cleanReply) cleanReply = 'Done.';
        await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: msg.chat.id, text: cleanReply, parse_mode: 'Markdown' })
        });

    } catch (e) {
        lg('ERR', `TG [${uname}]: ${e.message}`);
        // Fallback without Markdown if it fails
        await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: msg.chat.id, text: `Error: ${e.message}` })
        });
    }

    // Restart idle memory timer after task
    if (typeof memResetIdle === 'function') memResetIdle();
}

async function tgPoll() {
    if (!st.cfg.tg || !st.cfg.auto) return;

    // EXCLUSIVE LOCK CHECK: Only 1 tab can poll to avoid 409 Conflict
    const curLock = localStorage.getItem('tg_lock');
    const lockTime = parseInt(localStorage.getItem('tg_lock_time') || '0');
    const isLockFresh = (Date.now() - lockTime) < 15000;

    if (curLock && curLock !== _TG_TAB_ID && isLockFresh) {
        if (_tgLockActive) {
            lg('WAR', 'Telegram: Polling paused. Another tab has taken control.');
            _tgLockActive = false;
        }
        $('#btn-tg-lock').style.display = 'inline-block';
        $('#st-tg').className = 'dot dim';
        return;
    }

    // Refresh lock
    localStorage.setItem('tg_lock', _TG_TAB_ID);
    localStorage.setItem('tg_lock_time', Date.now());
    _tgLockActive = true;
    $('#btn-tg-lock').style.display = 'none';

    const t = st.cfg.tg;
    try {
        const r = await fetch(`https://api.telegram.org/bot${t}/getUpdates?offset=${st.id}&timeout=5`);
        if (r.status === 409) {
            lg('ERR', 'Telegram API Conflict (409). Waiting for lock...');
            return;
        }
        const d = await r.json();
        if (d.ok) {
            $('#st-tg').className = 'dot ok';
            for (const update of d.result) {
                if (update.update_id >= st.id) st.id = update.update_id + 1;
                const m = update.message;
                if (!m) continue;

                // Handle photos
                if (m.photo) {
                    const photo = m.photo[m.photo.length - 1];
                    try {
                        const fr = await fetch(`https://api.telegram.org/bot${t}/getFile?file_id=${photo.file_id}`);
                        const fd = await fr.json();
                        const fileUrl = `https://api.telegram.org/file/bot${t}/${fd.result.file_path}`;
                        tgXc(m, t, { name: fd.result.file_path.split('/').pop(), type: 'image/jpeg', size: photo.file_size, isText: false, content: null, url: fileUrl });
                    } catch (e) { lg('ERR', `TG Photo fetch failed: ${e.message}`); }
                    continue;
                }

                // Handle documents
                if (m.document) {
                    try {
                        const fr = await fetch(`https://api.telegram.org/bot${t}/getFile?file_id=${m.document.file_id}`);
                        const fd = await fr.json();
                        const fileUrl = `https://api.telegram.org/file/bot${t}/${fd.result.file_path}`;
                        const isText = /\.(txt|md|js|py|json|html|css|csv|xml|yaml|yml)$/i.test(m.document.file_name);
                        let content = null;
                        if (isText) { try { const tr = await fetch(fileUrl); content = await tr.text(); } catch (_) { } }
                        tgXc(m, t, { name: m.document.file_name, type: m.document.mime_type, size: m.document.file_size, isText, content, url: fileUrl });
                    } catch (e) { lg('ERR', `TG Document fetch failed: ${e.message}`); }
                    continue;
                }

                // Handle text messages
                if (m.text) {
                    lg('SYS', `TG Inbox [${m.from.username || m.from.first_name}]: ${m.text}`);
                    tgXc(m, t, null);
                }
            }
        } else {
            $('#st-tg').className = 'dot err';
            lg('ERR', `Telegram: ${d.description}`);
        }
    } catch (e) {
        $('#st-tg').className = 'dot err';
        if (e.message.includes('409') || e.message.includes('terminated')) {
            lg('WAR', 'Telegram: Conflict detected. Refreshing instance...');
        }
    }
}
