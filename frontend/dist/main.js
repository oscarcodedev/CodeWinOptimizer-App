const L={en:{},es:{}};
let lang='en',busy=false,catData=[],pickedT=new Set(),pickedA=new Set(),curTab='restore',pkgMgr='winget';

function T(k){return L[lang]?.[k]||L.en?.[k]||k}
function LO(v){return(typeof v==='object'&&v)?(v[lang]||v['en']||''):(v||'')}

const APPS=[
  {cat:'Navegadores',icon:'🌐',id:'firefox',n:{en:'Firefox',es:'Firefox'},d:{en:'Privacy-focused browser',es:'Navegador centrado en privacidad'},w:'Mozilla.Firefox',c:'firefox'},
  {cat:'Navegadores',icon:'🦁',id:'brave',n:{en:'Brave',es:'Brave'},d:{en:'Chromium + ad blocker',es:'Chromium + bloqueador de anuncios'},w:'Brave.Brave',c:'brave'},
  {cat:'Navegadores',icon:'🐺',id:'librewolf',n:{en:'LibreWolf',es:'LibreWolf'},d:{en:'Hardened Firefox fork',es:'Fork de Firefox reforzado'},w:'LibreWolf.LibreWolf',c:'librewolf'},
  {cat:'Multimedia',icon:'🎬',id:'vlc',n:{en:'VLC Media Player',es:'VLC Media Player'},d:{en:'Universal media player',es:'Reproductor multimedia universal'},w:'VideoLAN.VLC',c:'vlc'},
  {cat:'Multimedia',icon:'🎥',id:'obs',n:{en:'OBS Studio',es:'OBS Studio'},d:{en:'Streaming & recording',es:'Streaming y grabacion'},w:'OBSProject.OBSStudio',c:'obs-studio'},
  {cat:'Multimedia',icon:'🎨',id:'gimp',n:{en:'GIMP',es:'GIMP'},d:{en:'Image editor (alt to Photoshop)',es:'Editor de imagenes (alternativa a Photoshop)'},w:'GIMP.GIMP',c:'gimp'},
  {cat:'Multimedia',icon:'🖌',id:'krita',n:{en:'Krita',es:'Krita'},d:{en:'Digital painting',es:'Pintura digital'},w:'KDE.Krita',c:'krita'},
  {cat:'Multimedia',icon:'🔊',id:'audacity',n:{en:'Audacity',es:'Audacity'},d:{en:'Audio editor',es:'Editor de audio'},w:'Audacity.Audacity',c:'audacity'},
  {cat:'Multimedia',icon:'✏',id:'inkscape',n:{en:'Inkscape',es:'Inkscape'},d:{en:'Vector graphics editor',es:'Editor de graficos vectoriales'},w:'Inkscape.Inkscape',c:'inkscape'},
  {cat:'Multimedia',icon:'🧊',id:'blender',n:{en:'Blender',es:'Blender'},d:{en:'3D modeling & animation',es:'Modelado y animacion 3D'},w:'BlenderFoundation.Blender',c:'blender'},
  {cat:'Desarrollo',icon:'💻',id:'vscode',n:{en:'VS Code',es:'VS Code'},d:{en:'Code editor',es:'Editor de codigo'},w:'Microsoft.VisualStudioCode',c:'vscode'},
  {cat:'Desarrollo',icon:'🔀',id:'git',n:{en:'Git',es:'Git'},d:{en:'Version control',es:'Control de versiones'},w:'Git.Git',c:'git'},
  {cat:'Desarrollo',icon:'🖥',id:'winterm',n:{en:'Windows Terminal',es:'Windows Terminal'},d:{en:'Modern terminal',es:'Terminal moderna'},w:'Microsoft.WindowsTerminal',c:'microsoft-windows-terminal'},
  {cat:'Desarrollo',icon:'📝',id:'notepadpp',n:{en:'Notepad++',es:'Notepad++'},d:{en:'Advanced text editor',es:'Editor de texto avanzado'},w:'Notepad++.Notepad++',c:'notepadplusplus'},
  {cat:'Desarrollo',icon:'🗜',id:'7zip',n:{en:'7-Zip',es:'7-Zip'},d:{en:'File archiver',es:'Compresor de archivos'},w:'7zip.7zip',c:'7zip'},
  {cat:'Desarrollo',icon:'🔍',id:'everything',n:{en:'Everything',es:'Everything'},d:{en:'Instant file search',es:'Busqueda instantanea de archivos'},w:'voidtools.Everything',c:'everything'},
  {cat:'Juegos',icon:'🎮',id:'steam',n:{en:'Steam',es:'Steam'},d:{en:'Game platform',es:'Plataforma de juegos'},w:'Valve.Steam',c:'steam-client'},
  {cat:'Juegos',icon:'💬',id:'discord',n:{en:'Discord',es:'Discord'},d:{en:'Voice & text chat',es:'Chat de voz y texto'},w:'Discord.Discord',c:'discord'},
  {cat:'Utilidades',icon:'📥',id:'qbittorrent',n:{en:'qBittorrent',es:'qBittorrent'},d:{en:'Torrent client',es:'Cliente de torrents'},w:'qBittorrent.qBittorrent',c:'qbittorrent'},
  {cat:'Utilidades',icon:'📸',id:'sharex',n:{en:'ShareX',es:'ShareX'},d:{en:'Screenshot & screen recorder',es:'Captura y grabacion de pantalla'},w:'ShareX.ShareX',c:'sharex'},
  {cat:'Utilidades',icon:'📊',id:'hwinfo',n:{en:'HWiNFO',es:'HWiNFO'},d:{en:'System monitoring',es:'Monitorizacion del sistema'},w:'REALiX.HWiNFO',c:'hwinfo'},
  {cat:'Utilidades',icon:'💾',id:'crystaldiskinfo',n:{en:'CrystalDiskInfo',es:'CrystalDiskInfo'},d:{en:'Disk health monitor',es:'Monitor de salud del disco'},w:'CrystalDewWorld.CrystalDiskInfo',c:'crystaldiskinfo'},
  {cat:'Utilidades',icon:'💿',id:'rufus',n:{en:'Rufus',es:'Rufus'},d:{en:'Bootable USB creator',es:'Creador de USB bootable'},w:'Rufus.Rufus',c:'rufus'},
  {cat:'Comunicacion',icon:'✈',id:'telegram',n:{en:'Telegram',es:'Telegram'},d:{en:'Secure messaging',es:'Mensajeria segura'},w:'Telegram.TelegramDesktop',c:'telegram'},
  {cat:'Comunicacion',icon:'🔒',id:'signal',n:{en:'Signal',es:'Signal'},d:{en:'Encrypted messaging',es:'Mensajeria encriptada'},w:'OpenWhisperSystems.Signal',c:'signal'},
  {cat:'Seguridad',icon:'🔑',id:'bitwarden',n:{en:'Bitwarden',es:'Bitwarden'},d:{en:'Password manager',es:'Gestor de contrasenas'},w:'Bitwarden.Bitwarden',c:'bitwarden'},
  {cat:'Seguridad',icon:'🔐',id:'veracrypt',n:{en:'VeraCrypt',es:'VeraCrypt'},d:{en:'Disk encryption',es:'Encriptacion de discos'},w:'IDRIX.VeraCrypt',c:'veracrypt'},
];

L.en={
  tabRestore:'Restore',tabApps:'Apps',tabTweaks:'Tweaks',
  restoreTitle:'System Restore Point',restoreDesc:'Create a restore point before making changes to your system. This allows you to revert if something goes wrong.',restoreBtn:'Create Restore Point',
  installBtn:'Install Selected',installCount:'{n} apps selected',
  applyBtn:'Apply Selected',applyCount:'{n} tweaks selected',selectFirst:'Select tweaks',
  terminal:'Terminal — Logs',clear:'Clear',idle:'Idle',
  restoreRunning:'Creating restore point...',restoreOk:'Restore point created.',restoreFail:'Restore point failed',
  installRunning:'Installing apps...',installOk:'Installation complete.',installFail:'Installation failed',
  tweaksRunning:'Applying tweaks...',tweaksDone:'Done.',
  selectAll:'Select All',deselectAll:'Deselect All',
  cmds:'cmds',warn:'warnings',
  adminWarn:'Run as Administrator — registry, DISM, bcdedit, and WinGet commands require admin privileges',
  viaWinget:'winget:',viaChoco:'choco:',
};
L.es={
  tabRestore:'Restaurar',tabApps:'Apps',tabTweaks:'Tweaks',
  restoreTitle:'Punto de Restauracion',restoreDesc:'Crea un punto de restauracion antes de hacer cambios en el sistema. Esto permite revertir si algo sale mal.',restoreBtn:'Crear Punto de Restauracion',
  installBtn:'Instalar Seleccionados',installCount:'{n} apps seleccionadas',
  applyBtn:'Aplicar Seleccionados',applyCount:'{n} tweaks seleccionados',selectFirst:'Selecciona tweaks',
  terminal:'Terminal — Registros',clear:'Limpiar',idle:'Inactivo',
  restoreRunning:'Creando punto de restauracion...',restoreOk:'Punto de restauracion creado.',restoreFail:'Fallo al crear punto de restauracion',
  installRunning:'Instalando apps...',installOk:'Instalacion completa.',installFail:'Fallo en la instalacion',
  tweaksRunning:'Aplicando tweaks...',tweaksDone:'Completado.',
  selectAll:'Seleccionar Todo',deselectAll:'Deseleccionar Todo',
  cmds:'cmds',warn:'advertencias',
  adminWarn:'Ejecutar como Administrador — comandos de registro, DISM, bcdedit y WinGet requieren privilegios de admin',
  viaWinget:'winget:',viaChoco:'choco:',
};

/* ========= INIT ========= */
async function boot(){
  window.addEventListener('wails:ready',()=>{});

  try{catData=await window.go.main.App.GetCategories()}catch(e){
    document.getElementById('tweaks-grid').innerHTML='<div style="padding:20px;color:var(--rd)">Connection failed</div>';return
  }

  document.getElementById('lang-select').addEventListener('change',function(){switchLang(this.value)});
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',function(){switchTab(this.dataset.tab)}));
  document.getElementById('btn-restore').addEventListener('click',doRestore);
  document.getElementById('btn-install-apps').addEventListener('click',doInstall);
  document.getElementById('btn-apply-tweaks').addEventListener('click',doApply);
  document.getElementById('btn-clear').addEventListener('click',clearTerm);
  document.getElementById('pkg-mgr').addEventListener('change',function(){pkgMgr=this.value;drawApps()});

  if(window.go?.main?.App){window.go.main.App.EventsOn('log',function(d){appendLog(d)})}
  checkAdmin();
  switchLang(lang);
  setTerm(T('idle'),'');
}

function switchLang(l){lang=l;document.getElementById('lang-select').value=l;drawAll();switchTab(curTab)}

/* ========= TABS ========= */
function switchTab(tab){
  curTab=tab;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.toggle('active',c.id==='tab-'+tab));
  if(tab==='tweaks')drawTweaks();
  if(tab==='apps')drawApps();
  if(tab==='restore')drawRestore();
  refreshUI();
}

function drawAll(){drawRestore();drawApps();drawTweaks();refreshUI()}

/* ========= TAB: RESTORE ========= */
function drawRestore(){
  document.getElementById('tab-restore-label').textContent=T('tabRestore');
  document.getElementById('restore-title').textContent=T('restoreTitle');
  document.getElementById('restore-desc').textContent=T('restoreDesc');
  document.getElementById('btn-restore-text').textContent=T('restoreBtn');
}

async function doRestore(){
  if(busy)return;busy=true;refreshUI();
  setTerm(T('restoreRunning'),'running');appendLog('=== '+T('restoreRunning')+' ===');
  try{
    const r=await window.go.main.App.CreateRestorePoint(lang);
    appendLog('[OK] '+T('restoreOk'));if(r)appendLog(r);
    setTerm(T('restoreOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('restoreFail')+': '+e);setTerm(T('restoreFail'),'err')}
  busy=false;refreshUI();
}

/* ========= TAB: APPS ========= */
function drawApps(){
  document.getElementById('tab-apps-label').textContent=T('tabApps');
  const cats=[...new Set(APPS.map(a=>a.cat))];
  const grid=document.getElementById('apps-grid');
  grid.innerHTML=cats.map(c=>{
    const apps=APPS.filter(a=>a.cat===c);
    return `<div class="app-cat-section">
      <div class="app-cat-title"><span class="app-cat-title-emoji">${apps[0].icon}</span>${c} <span style="font-weight:400;color:var(--tx3);margin-left:auto">${apps.length} apps</span></div>
      <div class="app-cat-grid">${apps.map(a=>{
        const sel=pickedA.has(a.id)?' selected':'';
        const chk=pickedA.has(a.id)?'checked':'';
        const pkg=pkgMgr==='winget'?a.w:a.c;
        const label=pkgMgr==='winget'?T('viaWinget')+' '+pkg:T('viaChoco')+' '+pkg;
        return `<div class="app-card${sel}" data-aid="${a.id}">
          <input type="checkbox" data-aid="${a.id}" ${chk}>
          <span class="app-icon">${a.icon}</span>
          <div class="app-info">
            <div class="app-name">${LO(a.n)}</div>
            <div class="app-desc">${LO(a.d)}</div>
            <div class="app-source">${label}</div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.app-card').forEach(card=>{
    card.addEventListener('click',function(e){if(e.target.tagName==='INPUT')return;const cb=this.querySelector('input');cb.checked=!cb.checked;cb.dispatchEvent(new Event('change'))});
  });
  grid.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change',function(e){e.stopPropagation();const id=this.dataset.aid;if(this.checked)pickedA.add(id);else pickedA.delete(id);this.closest('.app-card').classList.toggle('selected',this.checked);refreshUI()});
  });
}

async function doInstall(){
  if(busy||pickedA.size===0)return;busy=true;refreshUI();
  setTerm(T('installRunning'),'running');
  const ids=Array.from(pickedA).map(id=>{const a=APPS.find(x=>x.id===id);return a?(pkgMgr==='winget'?a.w:a.c):id});
  appendLog('--- '+T('installRunning')+' ('+ids.length+' apps via '+(pkgMgr==='winget'?'WinGet':'Chocolatey')+') ---');
  try{
    const r=await window.go.main.App.InstallApps(ids,lang,pkgMgr);
    if(r)appendLog(r);
    appendLog('[OK] '+T('installOk'));setTerm(T('installOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('installFail')+': '+e);setTerm(T('installFail'),'err')}
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
    <div class="cat-head"><div class="cat-head-left"><span class="cat-icon">${c.icon}</span><span class="cat-name">${n}</span></div><div style="display:flex;align-items:center;gap:10px"><span class="cat-badge">${w.length}</span><span class="cat-arrow">▼</span></div></div>
    <div class="cat-body"><div class="cat-sel-all" data-ci="${ci}"><span>☐</span><span class="sel-lbl">${T('selectAll')}</span></div>${c.tweaks.map(t=>tweakRow(t)).join('')}</div>
  </div>`;
}

function tweakRow(t){
  const n=LO(t.name);const d=LO(t.description);const cmds=(t.commands||[]).length;
  const hasW=(t.warnings?.[lang]||t.warnings?.['en']||[]).length>0;
  const chk=pickedT.has(t.id)?'checked':'';
  return `<div class="tweak-row" data-tid="${t.id}">
    <input type="checkbox" data-tid="${t.id}" ${chk} ${cmds===0?'disabled':''}>
    <div class="tweak-inf"><div class="tweak-inf-name"><span>${n}</span>${hasW?'<span class="warn-dot">●</span>':''}</div><div class="tweak-inf-desc">${d}</div><div class="tweak-inf-meta"><span class="badge badge-${t.impact}">${t.impact}</span>${cmds>0?`<span>${cmds} ${T('cmds')}</span>`:'<span>info</span>'}</div></div>
  </div>`;
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

/* ========= UI ========= */
function refreshUI(){
  document.getElementById('term-title').textContent=T('terminal');
  const ab=document.getElementById('btn-apply-tweaks'),at=document.getElementById('btn-apply-text');
  const ib=document.getElementById('btn-install-apps'),it=document.getElementById('btn-install-text');
  const rb=document.getElementById('btn-restore'),rt=document.getElementById('btn-restore-text');

  rb.disabled=busy;rt.textContent=busy?'...':T('restoreBtn');

  const tc=pickedT.size;ab.disabled=busy||tc===0;
  at.textContent=busy?'...':tc>0?T('applyCount').replace('{n}',tc):T('selectFirst');
  document.getElementById('tweaks-count-label').textContent=tc>0?T('applyCount').replace('{n}',tc):'';

  const ac=pickedA.size;ib.disabled=busy||ac===0;
  it.textContent=busy?'...':ac>0?T('installCount').replace('{n}',ac):T('installBtn');
  document.getElementById('apps-count-label').textContent=ac>0?T('installCount').replace('{n}',ac):'';

  document.querySelectorAll('.cat-card').forEach(c=>{const ci=parseInt(c.dataset.ci);if(!isNaN(ci))syncTweakCb(ci)});
}

/* ========= TERMINAL ========= */
function appendLog(m){
  const l=document.getElementById('term-log');if(!l)return;
  let c='';if(m.startsWith('[OK]'))c='log-ok';else if(m.startsWith('[ERR]'))c='log-err';else if(m.startsWith('[WARN]'))c='log-warn';else if(m.startsWith('[CMD]'))c='log-cmd';else if(m.startsWith('---'))c='log-hdr';else if(m.startsWith('==='))c='log-dim';
  const e=document.createElement('span');e.className=c;e.textContent=m+'\n';l.appendChild(e);l.scrollTop=l.scrollHeight;
}
function setTerm(t,c){const el=document.getElementById('term-status');if(el){el.textContent=t;el.className=c}}
function clearTerm(){const l=document.getElementById('term-log');if(l)l.innerHTML='';setTerm(T('idle'),'')}

async function checkAdmin(){
  try{const ok=await window.go.main.App.CheckAdmin();if(!ok){document.getElementById('warning-text').textContent=T('adminWarn');document.getElementById('admin-warning').classList.remove('hidden')}}catch(e){}
}

document.addEventListener('DOMContentLoaded',boot);
