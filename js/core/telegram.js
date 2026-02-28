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

async function tgXc(msg, t) {
    st.ts++;

    // Track known users in state Memory
    if (!st.cfg.tgUsers) st.cfg.tgUsers = {};
    st.cfg.tgUsers[msg.from.first_name] = msg.chat.id;
    svGlb();

    const knownUsers = Object.entries(st.cfg.tgUsers).map(([name, id]) => `- ${name}: ${id}`).join('\n');

    const q = `[TELEGRAM message from ${msg.from.first_name} (Chat ID: ${msg.chat.id})]: ${msg.text}`;
    lg('USR', q);
    const m = await route(q);
    const p = `${st.vfs['/system/personality.md']}\n\nSKILLS:\n${st.vfs['/system/skills.md']}
4. AUTONOMOUS MESSAGING: If you need to send a message to a specific Telegram user autonomously, use <tg_send chat_id="ID">Your message</tg_send>.
Known Telegram Users:
${knownUsers}

\nMEMORY:\n${st.vfs['/system/memory.log']}\n\nVFS STATE:\n${buildVfsContext()}\n\nCRITICAL RULE: The user is messaging you on Telegram. Respond normally. You can use <tg_send> to message OTHERS, but any text outside of tags will go to the current user (${msg.from.first_name}).`;

    try {
        const r = await llm(p, q, m);
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

        let cleanReply = r.replace(/<file[^>]*>[\s\S]*?<\/file>/g, '').replace(/<tg_send[^>]*>[\s\S]*?<\/tg_send>/g, '').trim();
        if (!cleanReply && !r.includes('<tg_send')) cleanReply = "✅ Request processed.";

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
                    if (m && m.text) {
                        lg('SYS', `TG Webhook [${m.from.first_name}]: ${m.text}`);
                        tgXc(m, t); // Process concurrently without blocking other users or local execution
                    }
                }
            }
        } else { $('#st-tg').className = 'dot err' }
    } catch (e) { $('#st-tg').className = 'dot err' }
}
