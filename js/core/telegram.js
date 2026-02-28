function tgTog() {
    st.cfg.auto = $('#c-auto').checked; svGlb();
    if (st.cfg.auto) {
        lg('SYS', 'Telegram Polling background mode enabled.');
        if (!st.poll) st.poll = setInterval(tgPoll, 5000);
    } else {
        lg('SYS', 'Telegram Polling disabled.');
        if (st.poll) { clearInterval(st.poll); st.poll = 0 }
    }
}

async function tstTg() {
    const t = $('#c-tg').value, b = $('#btn-tst-tg');
    if (!t) return lg('ERR', 'No Telegram Token');
    b.innerHTML = '<i data-lucide="loader"></i> Ping...'; lucide.createIcons();
    try {
        const r = await fetch(`https://api.telegram.org/bot${t}/getMe`);
        const d = await r.json();
        if (d.ok) { b.innerText = `OK: @${d.result.username}`; b.className = 'btn okc'; lg('SYS', `Telegram bind OK: @${d.result.username}`) }
        else { b.innerText = 'FAIL'; b.className = 'btn err'; lg('ERR', `Telegram bind fail: ${d.description}`) }
    } catch (e) { b.innerText = 'FAIL'; b.className = 'btn err' }
    setTimeout(() => { b.innerHTML = '<i data-lucide="plug"></i> Test Connection'; b.className = 'btn okc'; lucide.createIcons() }, 4000);
}

async function tgXc(msg, t, fileCtx) {
    st.ts++;

    // Track known users in state Memory
    if (!st.cfg.tgUsers) st.cfg.tgUsers = {};
    st.cfg.tgUsers[msg.from.first_name] = msg.chat.id;
    svGlb();

    const knownUsers = Object.entries(st.cfg.tgUsers).map(([name, id]) => `- ${name}: ${id}`).join('\n');

    const q = `[TELEGRAM message from ${msg.from.first_name} (Chat ID: ${msg.chat.id})]: ${msg.text || '[No text - see attached file]'}`;
    lg('USR', q);
    const m = await route(q);
    const p = `${st.vfs['/system/personality.md']}\n\nSKILLS:\n${st.vfs['/system/skills.md']}
4. AUTONOMOUS MESSAGING: If you need to send a message to a specific Telegram user autonomously, use <tg_send chat_id="ID">Your message</tg_send>.
5. RICH MEDIA: To reply with an image URL, use <media type="image" url="URL"/>.
Known Telegram Users:
${knownUsers}

\nMEMORY:\n${st.vfs['/system/memory.log']}\n\nVFS STATE:\n${buildVfsContext()}\n\nCRITICAL RULE: Respond naturally. Text outside tags goes to ${msg.from.first_name}'s Telegram app.`;

    let userMsg = q;
    if (fileCtx) {
        userMsg = `${q}\n\n[ATTACHED: "${fileCtx.name}" (${fileCtx.type})]${fileCtx.isText && fileCtx.content ? '\nContents:\n' + fileCtx.content : fileCtx.url ? '\nURL: ' + fileCtx.url : ''}`;
    }
    try {
        const r = await llm(p, userMsg, m);
        lg('AGT', r);
        psVfs(r);

        // Process autonomous telegram dispatches
        const tgRg = /<tg_send\s+chat_id=["']?([^"'>]+)["']?>([\s\S]*?)<\/tg_send>/gi;
        let tm;
        while ((tm = tgRg.exec(r)) !== null) {
            const tgtId = tm[1];
            const payload = tm[2].trim();
            lg('SYS', `Autonomous Dispatch -> TG ID: ${tgtId}`);
            fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: tgtId, text: payload }) }).catch(e => lg('ERR', `TG Dispatch failed: ${e.message}`));
        }

        // Handle <media> image replies via sendPhoto
        const mediaM = r.match(/<media\s+type="image"\s+url="([^"]+)"\s*\/>/i);
        if (mediaM) {
            fetch(`https://api.telegram.org/bot${t}/sendPhoto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: msg.chat.id, photo: mediaM[1] }) }).catch(e => lg('ERR', `TG Photo send failed: ${e.message}`));
        }

        let cleanReply = r.replace(/<file[^>]*>[\s\S]*?<\/file>/g, '').replace(/<tg_send[^>]*>[\s\S]*?<\/tg_send>/g, '').replace(/<media[^>]*\/>/g, '').trim();
        if (!cleanReply) cleanReply = "✅ Request processed.";

        if (cleanReply) {
            await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: msg.chat.id, text: cleanReply }) });
        }
    } catch (e) {
        lg('ERR', `TG [${msg.from.first_name}]: ${e.message}`);
        await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: msg.chat.id, text: `Error: ${e.message}` }) });
    }
}

async function tgPoll() {
    if (!st.cfg.tg || !st.cfg.auto) return;
    const t = st.cfg.tg;
    try {
        const r = await fetch(`https://api.telegram.org/bot${t}/getUpdates?offset=${st.id}&timeout=5`);
        const d = await r.json();
        if (d.ok) {
            $('#st-tg').className = 'dot ok';
            if (d.result.length > 0) {
                for (const update of d.result) {
                    if (update.update_id >= st.id) st.id = update.update_id + 1;
                    const m = update.message;
                    if (!m) continue;

                    // Handle photos
                    if (m.photo) {
                        const photo = m.photo[m.photo.length - 1]; // largest size
                        try {
                            const fr = await fetch(`https://api.telegram.org/bot${t}/getFile?file_id=${photo.file_id}`);
                            const fd = await fr.json();
                            const fileUrl = `https://api.telegram.org/file/bot${t}/${fd.result.file_path}`;
                            const fileCtx = { name: fd.result.file_path.split('/').pop(), type: 'image/jpeg', size: photo.file_size, isText: false, content: null, url: fileUrl };
                            lg('SYS', `TG Photo from [${m.from.first_name}]: ${fileUrl}`);
                            tgXc(m, t, fileCtx);
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
                            if (isText) { try { const tr = await fetch(fileUrl); content = await tr.text(); } catch (e) { } }
                            const fileCtx = { name: m.document.file_name, type: m.document.mime_type, size: m.document.file_size, isText, content, url: fileUrl };
                            lg('SYS', `TG Document from [${m.from.first_name}]: ${m.document.file_name}`);
                            tgXc(m, t, fileCtx);
                        } catch (e) { lg('ERR', `TG Document fetch failed: ${e.message}`); }
                        continue;
                    }

                    if (m.text) {
                        lg('SYS', `TG Webhook [${m.from.first_name}]: ${m.text}`);
                        tgXc(m, t, null); // Process concurrently without blocking
                    }
                }
            }
        } else { $('#st-tg').className = 'dot err' }
    } catch (e) { $('#st-tg').className = 'dot err' }
}
