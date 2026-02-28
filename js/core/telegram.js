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
    const q = `[TELEGRAM user ${msg.from.first_name}]: ${msg.text}`;
    lg('USR', q);
    const m = await route(q);
    const p = `${st.vfs['/system/personality.md']}\n\nSKILLS:\n${st.vfs['/system/skills.md']}\n\nMEMORY:\n${st.vfs['/system/memory.log']}\n\nVFS STATE:\n${buildVfsContext()}\n\nCRITICAL RULE: The user is messaging you on Telegram. Respond normally, directly answering the user, while wrapping any code/file changes in <file path="..."></file>. Do not include internal system logs in the response output. The final text outside of the <file> tags is what will be sent to the user's Telegram app. Keep chat text clean and human-like.`;

    try {
        const r = await llm(p, q, m);
        lg('AGT', r);
        psVfs(r);

        let cleanReply = r.replace(/<file[^>]*>[\s\S]*?<\/file>/g, '').trim();
        if (!cleanReply) cleanReply = "✅ Request processed.";

        await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: msg.chat.id, text: cleanReply }) });
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
