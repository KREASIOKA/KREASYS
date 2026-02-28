async function llm(p, u, mod) {
    if (!st.mods.length) throw new Error("No models configured.");
    const m = mod || st.mods[0];
    const url = m.p === 'custom' ? m.e : PRV[m.p];
    if (!url || !m.k) throw new Error(`Invalid URL or Key for ${m.n}.`);
    const b = { model: m.m, messages: [{ role: 'system', content: p }, { role: 'user', content: u }], temperature: st.cfg.tmp };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${m.k.trim()}` }, body: JSON.stringify(b) });
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json();
    if (m.p === 'openrouter') st.tk += (d.usage?.total_tokens || 0);
    return d.choices?.[0]?.message?.content || d.message?.content || '';
}

async function route(q) {
    if (st.mods.length === 1) return st.mods[0];

    let reqType = 'text';
    const lq = q.toLowerCase();
    if (lq.includes('generate image') || lq.includes('draw') || lq.includes('create an image')) reqType = 'image';
    else if (lq.includes('generate audio') || lq.includes('speak') || lq.includes('text to speech')) reqType = 'audio';
    else if (lq.includes('generate video') || lq.includes('animate')) reqType = 'video';

    const avail = st.mods.filter(m => (m.t || 'text') === reqType);
    if (avail.length === 0) return st.mods[0];
    if (avail.length === 1) return avail[0];

    const p = `You are a Router. Available Models:\n${avail.map(m => `- ${m.id} (${m.m})`).join('\n')}\nAnalyze user query and return ONLY the ID of the best model. IF unknown, return ${avail[0].id}.`;
    try {
        const r = await llm(p, q, avail[0]);
        const f = avail.find(m => r.includes(m.id)); return f || avail[0];
    } catch { return avail[0] }
}

async function xc(q, isC, attachment) {
    if (!q.trim() && !attachment) return;
    st.run = 1; st.ts++;
    const xn = isC ? '#c-in' : '#t-in';
    $(xn).value = ''; $(xn).style.height = '50px';
    $('#btn-run-c').style.display = 'none'; $('#btn-stop-c').style.display = '';
    lg('USR', q);
    if (isC) chLg('USR', q, attachment);

    const m = await route(q);
    lg('SYS', `Router selected [${m.n}]`);

    const knownUsers = (st.cfg.tgUsers ? Object.entries(st.cfg.tgUsers).map(([name, id]) => `- ${name}: ${id}`).join('\n') : "None");
    const p = `${st.vfs['/system/personality.md']}\n\nSKILLS:\n${st.vfs['/system/skills.md']}
4. AUTONOMOUS MESSAGING: If you need to send a message to a specific Telegram user autonomously, use <tg_send chat_id="ID">Your message</tg_send>.
5. RICH MEDIA RESPONSES: To respond with an image URL, use <media type="image" url="URL"/>. For audio: <media type="audio" url="URL"/>. For video: <media type="video" url="URL"/>.
Known Telegram Users:
${knownUsers}

\nMEMORY:\n${st.vfs['/system/memory.log']}\n\nVFS STATE:\n${buildVfsContext()}`;

    // Attach file context if sent
    let userMsg = q;
    if (attachment) {
        userMsg = `[USER ATTACHED FILE: "${attachment.name}" (${attachment.type}, ${(attachment.size / 1024).toFixed(1)}KB)]\n${attachment.isText ? 'File contents:\n' + attachment.content : '[Binary/Image file — treat as visual context for this query]'}\n\nUser message: ${q}`;
    }

    try {
        const r = await llm(p, userMsg, m);
        if (typeof psPlan === 'function') psPlan(r);
        lg('AGT', r);

        if (st.cfg.tg) {
            const tgRg = /<tg_send\s+chat_id=["']?([^"'>]+)["']?>([\s\S]*?)<\/tg_send>/gi;
            let tm;
            while ((tm = tgRg.exec(r)) !== null) {
                const tgtId = tm[1];
                const payload = tm[2].trim();
                lg('SYS', `Autonomous Dispatch -> TG ID: ${tgtId}`);
                fetch(`https://api.telegram.org/bot${st.cfg.tg}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: tgtId, text: payload }) }).catch(e => lg('ERR', `TG Dispatch failed: ${e.message}`));
            }
        }

        if (isC) chLg('AGT', r.replace(/<file[^>]*>[\s\S]*?<\/file>/g, '*[VFS update occurred - Check IDE Workspace]*').replace(/<plan[^>]*>[\s\S]*?<\/plan>/gi, '').replace(/<tg_send[^>]*>[\s\S]*?<\/tg_send>/gi, '*[Autonomous Telegram Message Dispatched]*'));
        psVfs(r);
    } catch (e) { lg('ERR', e.message); if (isC) chLg('AGT', `**Error:** ${e.message}`) }

    st.run = 0;
    $('#btn-run-c').style.display = ''; $('#btn-stop-c').style.display = 'none';
}
