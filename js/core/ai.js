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

async function xc(q, isC) {
    if (!q.trim()) return;
    st.run = 1; st.ts++;
    const xn = isC ? '#c-in' : '#t-in';
    $(xn).value = ''; $(xn).style.height = '50px';
    $('#btn-run-c').style.display = 'none'; $('#btn-stop-c').style.display = '';
    lg('USR', q);
    if (isC) chLg('USR', q);

    const m = await route(q);
    lg('SYS', `Router selected [${m.n}]`);

    const p = `${st.vfs['/system/personality.md']}\n\nSKILLS:\n${st.vfs['/system/skills.md']}\n\nMEMORY:\n${st.vfs['/system/memory.log']}\n\nVFS STATE:\n${buildVfsContext()}`;

    try {
        const r = await llm(p, q, m);
        if (typeof psPlan === 'function') psPlan(r);
        lg('AGT', r);
        if (isC) chLg('AGT', r.replace(/<file[^>]*>[\s\S]*?<\/file>/g, '*[VFS update occurred - Check IDE Workspace]*').replace(/<plan[^>]*>[\s\S]*?<\/plan>/gi, ''));
        psVfs(r);
    } catch (e) { lg('ERR', e.message); if (isC) chLg('AGT', `**Error:** ${e.message}`) }

    st.run = 0;
    $('#btn-run-c').style.display = ''; $('#btn-stop-c').style.display = 'none';
}
