function psVfs(ctx) {
    const rg = /<file path=["']([^"']+)["']>([\s\S]*?)<\/file>/g;
    let m, hit = 0;
    while ((m = rg.exec(ctx)) !== null) {
        let f = m[1];
        if (!f.startsWith('/system/') && !f.startsWith('/workspace/')) f = '/workspace/' + f.replace(/^\//, '');
        st.vfs[f] = m[2];
        lg('SYS', `VFS written: \`${f}\``); hit++;
        if (typeof showToast === 'function') showToast('File Updated', f);
    }
    if (hit) { svGlb(); rVfs(); if (st.cfn.sys) $('#vfs-ed-sys').value = st.vfs[st.cfn.sys] || ''; if (st.cfn.wrk) $('#vfs-ed-wrk').value = st.vfs[st.cfn.wrk] || '' }
}

function upFile(e, pfx) {
    const f = e.target.files[0]; if (!f) return;
    const p = pfx === 'sys' ? '/system/' : '/workspace/';
    const r = new FileReader();
    r.onload = ev => { st.vfs[p + f.name] = ev.target.result; svGlb(); rVfs(); lg('SYS', `Uploaded \`${p + f.name}\``) };
    r.readAsText(f);
}
function nwFile(pfx) {
    const p = pfx === 'sys' ? '/system/' : '/workspace/';
    const n = prompt(`Enter new filename in ${p}`);
    if (n) { st.vfs[p + n.replace(/^\//, '')] = ''; svGlb(); rVfs() }
}
function delF(k) {
    if (confirm(`Delete ${k}?`)) {
        delete st.vfs[k];
        if (st.cfn.sys === k) { st.cfn.sys = ''; $('#vfs-fn-sys').innerText = 'No File Selected'; $('#vfs-ed-sys').value = '' }
        if (st.cfn.wrk === k) { st.cfn.wrk = ''; $('#vfs-fn-wrk').innerText = 'No File Selected'; $('#vfs-ed-wrk').value = '' }
        svGlb(); rVfs(); lg('SYS', `Deleted \`${k}\``);
    }
}

function rVfs() {
    const ts = $('#vfs-tree-sys'); ts.innerHTML = '';
    const tw = $('#vfs-tree-wrk'); tw.innerHTML = '';

    Object.keys(st.vfs).forEach(k => {
        if (!k.startsWith('/system/') && !k.startsWith('/workspace/')) {
            st.vfs['/workspace/' + k.replace(/^\//, '')] = st.vfs[k];
            delete st.vfs[k];
        }
    });

    const buildTreeHTML = (rootPrefix, container, pfx) => {
        const paths = Object.keys(st.vfs).filter(k => k.startsWith(rootPrefix)).sort();
        const tree = {};
        paths.forEach(p => {
            const parts = p.replace(rootPrefix, '').split('/');
            let curr = tree;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!curr[parts[i]]) curr[parts[i]] = {};
                curr = curr[parts[i]];
            }
            curr[parts[parts.length - 1]] = p;
        });

        const renderNode = (node, depth, pathSoFar) => {
            const frag = document.createDocumentFragment();
            Object.keys(node).sort((a, b) => {
                const isDirA = typeof node[a] === 'object';
                const isDirB = typeof node[b] === 'object';
                if (isDirA && !isDirB) return -1;
                if (!isDirA && isDirB) return 1;
                return a.localeCompare(b);
            }).forEach(k => {
                const val = node[k];
                const isDir = typeof val === 'object';
                const d = document.createElement('div');
                const pad = 8 + (depth * 16);

                if (isDir) {
                    d.className = 'ide-tree-folder';
                    d.style.paddingLeft = pad + 'px';
                    d.innerHTML = `<i data-lucide="folder-open" style="width:14px;height:14px;margin-right:6px;color:rgba(0,179,255,0.8)"></i><span style="flex:1;font-weight:600;font-size:12px;color:var(--txt)">${k}</span>`;
                    const chill = document.createElement('div');
                    chill.className = 'folder-children';
                    chill.appendChild(renderNode(val, depth + 1, pathSoFar + k + '/'));

                    let open = true;
                    d.onclick = () => {
                        open = !open;
                        chill.style.display = open ? 'block' : 'none';
                        d.querySelector('i').setAttribute('data-lucide', open ? 'folder-open' : 'folder');
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    };
                    frag.appendChild(d);
                    frag.appendChild(chill);
                } else {
                    d.className = `ide-tree-item ${val === st.cfn[pfx] ? 'active' : ''}`;
                    d.style.paddingLeft = pad + 'px';
                    d.innerHTML = `<i data-lucide="file" style="width:14px;height:14px;margin-right:6px;color:var(--dim)"></i><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${val}">${k}</span><i class="dtb" data-lucide="x" style="width:12px;height:12px;color:var(--err)" onclick="event.stopPropagation();delF('${val}')"></i>`;
                    d.onclick = () => {
                        st.cfn[pfx] = val;
                        $$(`#vfs-tree-${pfx} .ide-tree-item`).forEach(x => x.classList.remove('active'));
                        d.classList.add('active');
                        $(`#vfs-fn-${pfx}`).innerText = val;
                        $(`#vfs-ed-${pfx}`).value = st.vfs[val];
                    };
                    frag.appendChild(d);
                }
            });
            return frag;
        };
        const res = renderNode(tree, 0, rootPrefix);
        if (res.childNodes.length === 0) container.innerHTML = '<div style="color:var(--dim);text-align:center;padding:20px;font-size:12px;font-style:italic">Directory Empty</div>';
        else container.appendChild(res);
    };

    buildTreeHTML('/system/', ts, 'sys');
    buildTreeHTML('/workspace/', tw, 'wrk');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function wipeWrk() {
    if (confirm('Wipe Workspace? Core System files will be retained safely.')) {
        Object.keys(st.vfs).forEach(k => { if (k.startsWith('/workspace/')) delete st.vfs[k] });
        st.cfn.wrk = ''; svGlb(); rVfs();
        $('#vfs-ed-wrk').value = ''; $('#vfs-fn-wrk').innerText = 'No File Selected';
    }
}
function ideSave(pfx) {
    const f = st.cfn[pfx]; if (!f) return;
    st.vfs[f] = $(`#vfs-ed-${pfx}`).value;
    svGlb(); lg('SYS', `IDE File saved: \`${f}\``);
}
async function dlZip(pfx) {
    const p = pfx === 'sys' ? '/system/' : '/workspace/';
    const z = new JSZip(); let cnt = 0;
    Object.entries(st.vfs).forEach(([k, v]) => { if (k.startsWith(p)) { z.file(k.replace(p, ''), v); cnt++ } });
    if (!cnt) return lg('ERR', `No files to backup in ${p}`);
    const b = await z.generateAsync({ type: 'blob' });
    const u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = `kreasys${p.replace(/\//g, '-')}${Date.now()}.zip`; a.click();
}

function buildVfsContext() {
    let ctx = '';
    for (const [k, v] of Object.entries(st.vfs)) {
        if (k === '/system/memory.log' || k === '/system/personality.md' || k === '/system/skills.md') continue;
        ctx += `<file path="${k}">\n${v}\n</file>\n\n`;
    }
    return ctx;
}
