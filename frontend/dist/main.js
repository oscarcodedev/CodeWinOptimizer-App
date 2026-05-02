const APPS = window.APPS;
const FEATURES = window.FEATURES;
const FIXES = window.FIXES;
const L = window.L;
let lang='en',busy=false,catData=[],pickedT=new Set(),pickedA=new Set(),curTab='restore',pkgMgr='winget';

function T(k){return L[lang]?.[k]||L.en?.[k]||k}
function LO(v){return(typeof v==='object'&&v)?(v[lang]||v['en']||''):(v||'')}

/* ========= THEME ========= */
let themeAccent='#39ff14',themeFont="'Segoe UI',system-ui,sans-serif";

function loadTheme(){
  try{const t=JSON.parse(localStorage.getItem('cwo-theme'));if(t){themeAccent=t.accent||'#39ff14';themeFont=t.font||themeFont}}catch(e){}
  applyTheme();
}

function applyTheme(){
  document.documentElement.style.setProperty('--gn',themeAccent);
  document.documentElement.style.setProperty('--gn2',themeAccent+'1A');
  document.body.style.fontFamily=themeFont;
  document.querySelectorAll('.color-btn').forEach(b=>b.classList.toggle('active',b.dataset.color===themeAccent));
  const fs=document.getElementById('theme-font-select');if(fs)fs.value=themeFont;
}

function saveTheme(){localStorage.setItem('cwo-theme',JSON.stringify({accent:themeAccent,font:themeFont}));}

function drawTheme(){
  document.getElementById('tab-theme-label').textContent=T('tabTheme');
  document.getElementById('theme-title').textContent='Appearance';
  document.getElementById('theme-desc').textContent='Customize the look and feel of CodeWinOptimizer.';
  document.getElementById('theme-colors-label').textContent='Accent Color';
  document.getElementById('theme-fonts-label').textContent='Font';
  document.getElementById('btn-theme-apply-text').textContent='Apply';
  document.getElementById('btn-theme-reset-text').textContent='Reset Defaults';
  document.querySelectorAll('.color-btn').forEach(b=>b.classList.toggle('active',b.dataset.color===themeAccent));
  const fs=document.getElementById('theme-font-select');if(fs)fs.value=themeFont;
}

function initTheme(){
  loadTheme();
  document.querySelectorAll('.color-btn').forEach(b=>b.addEventListener('click',function(){themeAccent=this.dataset.color;applyTheme();saveTheme()}));
  document.getElementById('theme-font-select').addEventListener('change',function(){themeFont=this.value;applyTheme();saveTheme()});
  document.getElementById('btn-theme-apply').addEventListener('click',()=>{applyTheme();saveTheme();setTerm('Theme applied','ok')});
  document.getElementById('btn-theme-reset').addEventListener('click',()=>{themeAccent='#39ff14';themeFont="'Segoe UI',system-ui,sans-serif";applyTheme();saveTheme();drawTheme();setTerm('Theme reset','ok')});
}

/* ========= INIT ========= */
async function boot(){
  window.addEventListener('wails:ready',()=>{});

  try{catData=await window.go.main.App.GetCategories()}catch(e){
    document.getElementById('tweaks-grid').innerHTML='<div style="padding:20px;color:var(--rd)">Connection failed</div>';return
  }

  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',function(){switchTab(this.dataset.tab)}));
  document.getElementById('btn-restore').addEventListener('click',doRestore);
  document.getElementById('btn-regbackup').addEventListener('click',doRegBackup);
  document.getElementById('open-backups-link').addEventListener('click',function(e){e.preventDefault();window.go.main.App.OpenFolder()});
  document.getElementById('btn-install-apps').addEventListener('click',doInstall);
  document.getElementById('btn-apply-tweaks').addEventListener('click',doApply);
  document.getElementById('btn-run-features').addEventListener('click',doRunFeatures);

  initTheme();
  document.getElementById('btn-clear').addEventListener('click',clearTerm);
  document.getElementById('btn-copy').addEventListener('click',copyTerm);
  document.querySelectorAll('.pkg-btn').forEach(b=>b.addEventListener('click',function(){pkgMgr=this.dataset.pkg;document.querySelectorAll('.pkg-btn').forEach(x=>x.classList.toggle('active',x===this));drawApps()}));
  document.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click',function(){switchLang(this.dataset.lang);document.querySelectorAll('.lang-btn').forEach(x=>x.classList.toggle('active',x===this))}));
  document.querySelector('.win-min')?.addEventListener('click',()=>window.runtime.WindowMinimise());
  document.querySelector('.win-max')?.addEventListener('click',async()=>{const m=await window.runtime.WindowIsMaximised();m?window.runtime.WindowUnmaximise():window.runtime.WindowMaximise()});
  document.querySelector('.win-close')?.addEventListener('click',()=>{try{window.runtime.Quit()}catch{try{window.runtime.WindowClose()}catch{window.go.main.App.Quit()}}});

  if(window.go?.main?.App){window.go.main.App.EventsOn('log',function(d){appendLog(d)})}
  checkAdmin();
  switchLang(lang);
  setTerm(T('idle'),'');
}

function switchLang(l){lang=l;document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));drawAll();switchTab(curTab)}

/* ========= TABS ========= */
function switchTab(tab){
  curTab=tab;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.toggle('active',c.id==='tab-'+tab));
  if(tab==='tweaks')drawTweaks();
  if(tab==='apps')drawApps();
  if(tab==='restore')drawRestore();
  if(tab==='features')drawFeatures();
  if(tab==='theme')drawTheme();
  refreshUI();
}

function drawAll(){drawRestore();drawApps();drawTweaks();drawFeatures();drawTheme();refreshUI()}

/* ========= TAB: RESTORE ========= */
function drawRestore(){
  document.getElementById('tab-restore-label').textContent=T('tabRestore');
  document.getElementById('restore-title').textContent=T('restoreTitle');
  document.getElementById('restore-desc').textContent=T('restoreDesc');
  document.getElementById('btn-restore-text').textContent=T('restoreBtn');
  document.getElementById('btn-regbackup-text').textContent=T('regBackup');
  document.getElementById('rp-name').placeholder=T('rpPlaceholder');
}

async function doRestore(){
  if(busy)return;busy=true;refreshUI();
  const name=document.getElementById('rp-name').value.trim()||'CodeWinOptimizer Restore';
  setTerm(T('restoreRunning'),'running');appendLog('=== '+T('restoreRunning')+' ===');
  try{
    const r=await window.go.main.App.CreateRestorePoint(name);
    appendLog('[OK] '+T('restoreOk'));if(r)appendLog(r);
    setTerm(T('restoreOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('restoreFail')+': '+e);setTerm(T('restoreFail'),'err')}
  busy=false;refreshUI();
}

async function doRegBackup(){
  if(busy)return;busy=true;refreshUI();
  setTerm(T('regBackupRunning'),'running');appendLog('=== '+T('regBackupRunning')+' ===');
  try{
    const r=await window.go.main.App.BackupRegistry();
    if(r)appendLog(r);
    appendLog('[OK] '+T('regBackupOk'));setTerm(T('regBackupOk'),'ok');
  }catch(e){appendLog('[ERR] '+e);setTerm('Backup failed','err')}
  busy=false;refreshUI();
}

/* ========= TAB: APPS ========= */
function drawApps(){
  document.getElementById('tab-apps-label').textContent=T('tabApps');
  const cats=[...new Set(APPS.map(a=>a.cat))];
  const grid=document.getElementById('apps-grid');
  grid.innerHTML=cats.map((c,ci)=>{
    const apps=APPS.filter(a=>a.cat===c);
    return `<div class="app-cat-section">
      <div class="app-cat-title">${c}<span class="app-cat-sel-all" data-ci="${ci}">${T('selectAll')}</span><span style="font-weight:400;color:var(--tx3);margin-left:auto">${apps.length} apps</span></div>
       <div class="app-cat-grid">${apps.map(a=>{
         const sel=pickedA.has(a.id)?' selected':'';
         const chk=pickedA.has(a.id)?'checked':'';
         const pkg=pkgMgr==='winget'?a.w:a.c;
         const noPkg=!pkg;
         const label=pkg?(pkgMgr==='winget'?T('viaWinget')+' '+pkg:T('viaChoco')+' '+pkg):pkgMgr==='winget'?'No WinGet':'No Choco';
         return `<div class="app-card${sel}" data-aid="${a.id}">
          <label class="toggle"><input type="checkbox" data-aid="${a.id}" ${chk} ${noPkg?'disabled':''}><span class="toggle-slider"></span></label>
          ${a.img?`<img class="app-icon" src="${a.img}" alt="">`:`<span class="app-icon">${a.icon}</span>`}
          <div class="app-info">
            <div class="app-name">${LO(a.n)}</div>
            <div class="app-desc">${LO(a.d)}</div>
            <div class="app-source">${label}</div>
            <div class="app-actions">
              <button class="app-btn app-btn-uninstall" data-aid="${a.id}" data-action="uninstall" ${noPkg?'disabled':''}>${T('uninstall')}</button>
              <button class="app-btn app-btn-web" data-aid="${a.id}" data-action="web">${T('website')}</button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.app-card').forEach(card=>{
    card.addEventListener('click',function(e){if(e.target.tagName==='INPUT'||e.target.closest('button')||e.target.closest('label'))return;const cb=this.querySelector('input[type="checkbox"]');cb.checked=!cb.checked;cb.dispatchEvent(new Event('change'))});
  });
  grid.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change',function(e){e.stopPropagation();const id=this.dataset.aid;if(this.checked)pickedA.add(id);else pickedA.delete(id);this.closest('.app-card').classList.toggle('selected',this.checked);refreshUI()});
  });
  grid.querySelectorAll('.app-cat-sel-all').forEach(el=>{
    el.addEventListener('click',function(e){e.stopPropagation();const ci=parseInt(this.dataset.ci);const c=cats[ci];if(!c)return;const apps=APPS.filter(a=>a.cat===c);const all=apps.every(a=>pickedA.has(a.id));apps.forEach(a=>all?pickedA.delete(a.id):pickedA.add(a.id));drawApps();refreshUI()});
  });
  grid.querySelectorAll('.app-btn-uninstall').forEach(btn=>{
    btn.addEventListener('click',function(e){e.stopPropagation();doUninstall(this.dataset.aid)});
  });
  grid.querySelectorAll('.app-btn-web').forEach(btn=>{
    btn.addEventListener('click',function(e){e.stopPropagation();const app=APPS.find(a=>a.id===this.dataset.aid);if(app&&app.u)window.go.main.App.OpenURL(app.u)});
  });
}

async function doInstall(){
  if(busy||pickedA.size===0)return;busy=true;refreshUI();
  setTerm(T('installRunning'),'running');
  const ids=Array.from(pickedA).map(id=>{const a=APPS.find(x=>x.id===id);return a?(pkgMgr==='winget'?a.w:a.c):id}).filter(id=>id);
  if(ids.length===0){appendLog('[WARN] No installable apps selected for '+pkgMgr);busy=false;refreshUI();return;}
  appendLog('--- '+T('installRunning')+' ('+ids.length+' apps via '+(pkgMgr==='winget'?'WinGet':'Chocolatey')+') ---');
  try{
    const r=await window.go.main.App.InstallApps(ids,lang,pkgMgr);
    if(r)appendLog(r);
    appendLog('[OK] '+T('installOk'));setTerm(T('installOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('installFail')+': '+e);setTerm(T('installFail'),'err')}
  busy=false;refreshUI();
}

async function doUninstall(appId){
  const app=APPS.find(a=>a.id===appId);if(!app)return;
  const name=LO(app.n);
  const pkg=pkgMgr==='winget'?app.w:app.c;
  if(!confirm(`Uninstall ${name} via ${pkgMgr==='winget'?'WinGet':'Chocolatey'}?`))return;
  if(busy)return;busy=true;refreshUI();
  appendLog('--- Uninstalling: '+name+' ('+pkg+') ---');
  setTerm('Uninstalling...','running');
  try{
    await window.go.main.App.UninstallApp(pkg,pkgMgr);
    appendLog('[OK] '+name+' uninstalled');setTerm('Uninstall complete','ok');
  }catch(e){appendLog('[ERR] Uninstall failed: '+e);setTerm('Uninstall failed','err')}
  busy=false;refreshUI();
}

/* ========= TAB: TWEAKS ========= */
function drawTweaks(){
  document.getElementById('tab-tweaks-label').textContent=T('tabTweaks');
  const grid=document.getElementById('tweaks-grid');
  grid.innerHTML=catData.map((c,ci)=>catCard(c,ci)).join('');
  bindTweakEv();
}

function catCard(c,ci){
  const n=LO(c.name);const w=c.tweaks.filter(t=>t.commands&&t.commands.length>0);
  return `<div class="cat-card" data-ci="${ci}">
    <div class="cat-head"><div class="cat-head-left"><span class="cat-name">${n}</span></div><div style="display:flex;align-items:center;gap:10px"><span class="cat-badge">${w.length}</span><span class="cat-arrow">▼</span></div></div>
    <div class="cat-body"><div class="cat-sel-all" data-ci="${ci}"><span>☐</span><span class="sel-lbl">${T('selectAll')}</span></div>${c.tweaks.map(t=>tweakRow(t)).join('')}</div>
  </div>`;
}

function tweakRow(t){
  const n=LO(t.name);const d=LO(t.description);const cmds=(t.commands||[]).length;
  const hasW=(t.warnings?.[lang]||t.warnings?.['en']||[]).length>0;
  const chk=pickedT.has(t.id)?'checked':'';
  const disabled=cmds===0?'disabled':'';
  return `<label class="tweak-row" data-tid="${t.id}">
    <label class="toggle"><input type="checkbox" data-tid="${t.id}" ${chk} ${disabled}><span class="toggle-slider"></span></label>
    <div class="tweak-inf"><div class="tweak-inf-name"><span>${n}</span>${hasW?'<span class="warn-dot">●</span>':''}</div><div class="tweak-inf-desc">${d}</div><div class="tweak-inf-meta"><span class="badge badge-${t.impact}">${t.impact}</span>${cmds>0?`<span>${cmds} ${T('cmds')}</span>`:'<span>info</span>'}</div></div>
  </label>`;
}

function bindTweakEv(){
  document.querySelectorAll('.cat-card').forEach(card=>{card.querySelector('.cat-head').addEventListener('click',function(e){if(e.target.tagName==='INPUT')return;const w=card.classList.contains('expanded');document.querySelectorAll('.cat-card').forEach(c=>c.classList.remove('expanded'));if(!w)card.classList.add('expanded')})});
  document.querySelectorAll('.cat-sel-all').forEach(el=>{el.addEventListener('click',function(e){e.stopPropagation();const ci=parseInt(this.dataset.ci);const cat=catData[ci];if(!cat)return;const tw=cat.tweaks.filter(t=>t.commands&&t.commands.length>0);const all=tw.length>0&&tw.every(t=>pickedT.has(t.id));tw.forEach(t=>all?pickedT.delete(t.id):pickedT.add(t.id));syncTweakCb(ci);refreshUI()})});
  document.querySelectorAll('.tweak-row input[type="checkbox"]').forEach(cb=>{cb.addEventListener('change',function(e){e.stopPropagation();const id=this.dataset.tid;if(this.checked)pickedT.add(id);else pickedT.delete(id);refreshUI()})});
}

function syncTweakCb(ci){
  const card=document.querySelector(`.cat-card[data-ci="${ci}"]`);if(!card)return;
  const cat=catData[ci];if(!cat)return;
  const tw=cat.tweaks.filter(t=>t.commands&&t.commands.length>0);
  const all=tw.length>0&&tw.every(t=>pickedT.has(t.id));
  const lbl=card.querySelector('.sel-lbl');const ico=card.querySelector('.cat-sel-all span:first-child');
  if(lbl)lbl.textContent=all?T('deselectAll'):T('selectAll');
  if(ico)ico.textContent=all?'☑':'☐';
  card.querySelectorAll('.tweak-row input[type="checkbox"]').forEach(cb=>{if(cb.disabled)return;cb.checked=pickedT.has(cb.dataset.tid)});
}

async function doApply(){
  if(busy||pickedT.size===0)return;busy=true;refreshUI();
  setTerm(T('tweaksRunning'),'running');
  const ids=Array.from(pickedT);
  appendLog('--- '+T('tweaksRunning')+' ('+ids.length+' tweaks) ---');
  try{const r=await window.go.main.App.RunCommands(ids,lang);if(r)appendLog(r);appendLog('[OK] '+T('tweaksDone'));setTerm(T('tweaksDone'),'ok')}catch(e){appendLog('[ERR] '+e);setTerm('Error','err')}
  busy=false;refreshUI();
}

/* ========= TAB: FEATURES ========= */
const pickedF=new Set();
function drawFeatures(){
  document.getElementById('tab-features-label').textContent=T('tabFeatures');
  document.getElementById('ft-features-title').textContent=T('ftFeaturesTitle');
  document.getElementById('ft-fixes-title').textContent=T('ftFixesTitle');
  document.getElementById('btn-features-text').textContent=pickedF.size>0?T('runFeatures')+' ('+pickedF.size+')':T('runFeatures');

  document.getElementById('ft-features-grid').innerHTML=FEATURES.map(f=>{
    const chk=pickedF.has(f.id)?'checked':'';
    return `<label class="ft-row"><label class="toggle"><input type="checkbox" data-fid="${f.id}" ${chk}><span class="toggle-slider"></span></label><span>${LO(f.n)}</span></label>`;
  }).join('');

  document.getElementById('ft-fixes-grid').innerHTML=FIXES.map(f=>
    `<button class="ft-fix-btn" data-fix="${f.id}">${LO(f.n)}</button>`
  ).join('');

  document.querySelectorAll('#ft-features-grid input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change',function(){const id=this.dataset.fid;if(this.checked)pickedF.add(id);else pickedF.delete(id);drawFeatures()});
  });
  document.querySelectorAll('.ft-fix-btn').forEach(btn=>{
    btn.addEventListener('click',function(){doRunFix(this.dataset.fix)});
  });
}

async function doRunFeatures(){
  if(busy||pickedF.size===0)return;busy=true;refreshUI();
  setTerm(T('ftRunning'),'running');
  const fts=FEATURES.filter(f=>pickedF.has(f.id));
  appendLog('--- '+T('ftRunning')+' ('+fts.length+' features) ---');
  for(const f of fts){
    appendLog('[CMD] '+LO(f.n));
    await window.go.main.App.ExecPowerShell(f.enable);
  }
  appendLog('[OK] '+T('ftDone'));setTerm(T('ftDone'),'ok');
  busy=false;refreshUI();
}

async function doRunFix(fixId){
  if(busy)return;busy=true;refreshUI();
  const f=FIXES.find(x=>x.id===fixId);if(!f)return;
  setTerm(T('ftRunning'),'running');
  appendLog('--- '+LO(f.n)+' ---');
  try{
    await window.go.main.App.ExecPowerShell(f.cmd);
    appendLog('[OK] '+T('ftDone'));setTerm(T('ftDone'),'ok');
  }catch(e){appendLog('[ERR] '+e);setTerm('Error','err')}
  busy=false;refreshUI();
}

/* ========= UI ========= */
function refreshUI(){
  document.getElementById('term-title').textContent=T('terminal');
  const ab=document.getElementById('btn-apply-tweaks'),at=document.getElementById('btn-apply-text');
  const ib=document.getElementById('btn-install-apps'),it=document.getElementById('btn-install-text');
  const rb=document.getElementById('btn-restore'),rt=document.getElementById('btn-restore-text');
  const rbb=document.getElementById('btn-regbackup'),rbt=document.getElementById('btn-regbackup-text');

  rb.disabled=busy;rt.textContent=busy?'...':T('restoreBtn');
  rbb.disabled=busy;rbt.textContent=busy?'...':T('regBackup');

  const tc=pickedT.size;ab.disabled=busy||tc===0;
  at.textContent=busy?'...':tc>0?T('applyCount').replace('{n}',tc):T('selectFirst');
  document.getElementById('tweaks-count-label').textContent=tc>0?T('applyCount').replace('{n}',tc):'';

  const ac=pickedA.size;ib.disabled=busy||ac===0;
  it.textContent=busy?'...':ac>0?T('installCount').replace('{n}',ac):T('installBtn');
  document.getElementById('apps-count-label').textContent=ac>0?T('installCount').replace('{n}',ac):'';

  document.querySelectorAll('.cat-card').forEach(c=>{const ci=parseInt(c.dataset.ci);if(!isNaN(ci))syncTweakCb(ci)});
}

/* ========= TERMINAL ========= */

async function checkAdmin(){
  try{const ok=await window.go.main.App.CheckAdmin();if(!ok){document.getElementById('warning-text').textContent=T('adminWarn');document.getElementById('admin-warning').classList.remove('hidden')}}catch(e){}
}

document.addEventListener('DOMContentLoaded',boot);
