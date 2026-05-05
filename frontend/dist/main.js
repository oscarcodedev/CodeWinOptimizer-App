const APPS = window.APPS;
const FEATURES = window.FEATURES;
const FIXES = window.FIXES;
const L = window.L;
let lang='en',busy=false,catData=[],pickedT=new Set(),pickedA=new Set(),curTab='restore',pkgMgr='winget',installedSet=new Set();

function T(k){return L[lang]?.[k]||L.en?.[k]||k}
function LO(v){return(typeof v==='object'&&v)?(v[lang]||v['en']||''):(v||'')}

function showConfirm(title,msg){
  return new Promise(resolve=>{
    const el=document.getElementById('custom-confirm');
    const t=document.getElementById('confirm-title');
    const m=document.getElementById('confirm-msg');
    const ok=document.getElementById('confirm-ok');
    const cancel=document.getElementById('confirm-cancel');
    t.textContent=title||T('confirm');
    m.textContent=msg;
    ok.textContent=T('ok');
    cancel.textContent=T('cancel');
    el.classList.remove('hidden');
    const close=(val)=>{el.classList.add('hidden');ok.removeEventListener('click',onOk);cancel.removeEventListener('click',onCancel);resolve(val);};
    const onOk=()=>close(true);
    const onCancel=()=>close(false);
    ok.addEventListener('click',onOk);
    cancel.addEventListener('click',onCancel);
  });
}

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

function drawMonitor(){
  document.getElementById('tab-monitor-label').textContent=T('tabMonitor');
  document.getElementById('mon-cpu-title').textContent=T('monCPU');
  document.getElementById('mon-ram-title').textContent=T('monRAM');
  document.getElementById('mon-gpu-title').textContent=T('monGPU');
  document.getElementById('mon-disk-title').textContent=T('monDisk');
  document.getElementById('mon-temp-title').textContent=T('monTemp');
  document.getElementById('mon-uptime-title').textContent=T('monUptime');
  document.getElementById('mon-network-title').textContent=T('monNetwork');
  document.getElementById('btn-speedtest-text').textContent=T('runSpeedTest');
  document.getElementById('dns-title').textContent=T('dnsTitle');
  fetchMonitor();
  fetchNetworkLatency();
  fetchCurrentDNS();
}

async function fetchMonitor(){
  try{
    const raw=await window.go.main.App.GetSystemInfo();
    const d=JSON.parse(raw);
    if(d.error)return;
    if(d.cpu){
      const cp=Number(d.cpu.pct)||0;
      document.getElementById('mon-cpu-val').textContent=cp+'%';
      document.getElementById('mon-cpu-bar').style.width=cp+'%';
      document.getElementById('mon-cpu-sub').textContent=(d.cpu.name||'')+(d.cpu.cores?' · '+d.cpu.cores+'C/'+d.cpu.threads+'T':'');
    }
    if(d.ram){
      document.getElementById('mon-ram-val').textContent=d.ram.usedGB+' / '+d.ram.totalGB+' GB';
      document.getElementById('mon-ram-bar').style.width=(Number(d.ram.pct)||0)+'%';
      document.getElementById('mon-ram-sub').textContent=d.ram.freeGB+' GB free';
    }
    if(d.gpus&&d.gpus.length>0){
      const g=d.gpus[0];
      const gu=Number(g.usage)||0;
      document.getElementById('mon-gpu-val').textContent=gu>0?gu+'%':'--';
      const sub=[];
      if(g.name)sub.push(g.name);
      if(g.ramGB)sub.push(Number(g.ramGB)+' GB');
      if(g.temp||g.temp===0)sub.push(Number(g.temp)+'°C');
      document.getElementById('mon-gpu-sub').textContent=sub.join(' · ')||'--';
    }
    if(d.disks&&d.disks.length>0){
      document.getElementById('mon-disk-val').textContent=d.disks[0].pct+'% used';
      document.getElementById('mon-disk-detail').innerHTML=d.disks.map(dk=>{
        const cl=dk.pct>90?'var(--rd)':dk.pct>70?'var(--yl)':'var(--gn)';
        return `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><span>${dk.drive}</span><div style="flex:1;height:4px;background:#1a1a1a;border-radius:2px"><div style="width:${dk.pct}%;height:100%;background:${cl};border-radius:2px"></div></div><span style="font-size:.85em;color:${cl}">${dk.pct}%</span></div>`;
      }).join('');
    }
    if(d.temps&&d.temps.length>0){
      document.getElementById('mon-temp-val').innerHTML=d.temps.map(t=>{
        const cl=t.temp>80?'var(--rd)':t.temp>60?'var(--yl)':'var(--gn)';
        return `<span style="color:${cl}">${t.temp}°C</span>`;
      }).join(' ');
      document.getElementById('mon-temp-sub').textContent=d.temps.map(t=>t.name).join(', ');
    }else{
      document.getElementById('mon-temp-val').textContent='--';
      document.getElementById('mon-temp-sub').textContent=T('monTempNA');
    }
    if(d.uptime){
      document.getElementById('mon-uptime-val').textContent=d.uptime;
    }
  }catch(e){}
}

async function fetchNetworkLatency(){
  try{
    const raw=await window.go.main.App.GetNetworkLatency();
    const d=JSON.parse(raw);
    if(!Array.isArray(d))return;
    const lines=d.map(r=>`${r.host}: ${r.ms>=0?r.ms+' ms':'--'}`).join(' · ');
    document.getElementById('mon-network-val').textContent=lines;
  }catch(e){}
}

async function fetchCurrentDNS(){
  try{
    const raw=await window.go.main.App.GetCurrentDNS();
    const sel=document.getElementById('dns-select');
    const currentDiv=document.getElementById('dns-current');
    if(!sel||!currentDiv)return;
    const current=raw.trim();
    const map={
      '8.8.8.8,8.8.4.4':'google',
      '1.1.1.1,1.0.0.1':'cloudflare',
      '1.1.1.2,1.0.0.2':'cloudflare_malware',
      '1.1.1.3,1.0.0.3':'cloudflare_malware_adult',
      '208.67.222.222,208.67.220.220':'opendns',
      '9.9.9.9,149.112.112.112':'quad9',
      '94.140.14.14,94.140.15.15':'adguard',
      '94.140.14.15,94.140.15.16':'adguard_full'
    };
    if(map[current]){
      sel.value=map[current];
      currentDiv.textContent=(lang==='es'?'Actual: ':'Current: ')+current;
    }else if(current==='DHCP'||current===''){
      sel.value='dhcp';
      currentDiv.textContent=(lang==='es'?'Actual: ':'Current: ')+'DHCP / Default';
    }else{
      sel.value='dhcp';
      currentDiv.textContent=(lang==='es'?'Actual: ':'Current: ')+current;
    }
  }catch(e){}
}

async function applyDNS(){
  if(busy)return;
  const sel=document.getElementById('dns-select');
  if(!sel)return;
  const provider=sel.value;
  busy=true;
  setTerm('Changing DNS...','running');
  appendLog('[CMD] Setting DNS to '+provider+'...');
  try{
    const r=await window.go.main.App.SetDNS(provider);
    appendLog(r);
    if(r.startsWith('OK')){setTerm('DNS updated','ok')}else{setTerm('DNS error','err')}
    await fetchCurrentDNS();
  }catch(e){
    appendLog('[ERR] '+e);
    setTerm('DNS error','err');
  }
  busy=false;
}

async function runSpeedTest(){
  if(busy)return;
  busy=true;
  document.getElementById('btn-speedtest').disabled=true;
  document.getElementById('btn-speedtest-text').textContent=T('testing');
  document.getElementById('speedtest-result').style.display='none';
  setTerm('Speed test running...','running');
  appendLog('[CMD] Starting Speedtest.net measurement...');
  try{
    const raw=await window.go.main.App.RunSpeedTest();
    const d=JSON.parse(raw);
    
    // Server info
    const serverInfo=d.serverName?`${d.serverName} — ${d.serverSponsor||''}`:'';
    
    // Build ping display
    const pingVal=d.pingMs!=null&&d.pingMs>0?d.pingMs.toFixed(0)+' ms':'--';
    
    document.getElementById('speedtest-ping').innerHTML=`
      <div class="speedtest-ping-item"><span class="speedtest-ping-label">Ping:</span><span class="speedtest-ping-value">${pingVal}</span></div>
      ${serverInfo?`<div class="speedtest-ping-item" style="margin-left:auto"><span class="speedtest-ping-label">Server:</span><span class="speedtest-ping-value" style="color:var(--tx2);font-size:.8em">${serverInfo}</span></div>`:''}
    `;
    
    // Format speeds: UI gets HTML, log gets plain text
    function fmtSpeedUI(val){
      if(!val||val<=0)return '--';
      if(val>=1000){
        return (val/1000).toFixed(2)+' <span style="font-size:.7em;font-weight:500;color:var(--tx3)">Gbps</span>';
      }
      return val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' <span style="font-size:.7em;font-weight:500;color:var(--tx3)">Mbps</span>';
    }
    function fmtSpeedLog(val){
      if(!val||val<=0)return '--';
      if(val>=1000)return (val/1000).toFixed(2)+' Gbps';
      return val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' Mbps';
    }
    
    const downUI=fmtSpeedUI(d.downloadMbps);
    const upUI=fmtSpeedUI(d.uploadMbps);
    const downLog=fmtSpeedLog(d.downloadMbps);
    const upLog=fmtSpeedLog(d.uploadMbps);
    
    document.getElementById('speedtest-speeds').innerHTML=`
      <div class="speedtest-down"><span class="speedtest-arrow">↓</span>${downUI}</div>
      <div class="speedtest-up"><span class="speedtest-arrow">↑</span>${upUI}</div>
    `;
    
    // Show result section
    document.getElementById('speedtest-result').style.display='block';
    
    appendLog(`[OK] Ping ${pingVal} · Download ${downLog} · Upload ${upLog}`);
    setTerm('Speed test complete','ok');
  }catch(e){
    appendLog('[ERR] Speed test failed: '+e);
    setTerm('Speed test failed','err');
  }
  busy=false;
  document.getElementById('btn-speedtest').disabled=false;
  document.getElementById('btn-speedtest-text').textContent=T('runSpeedTest');
}

const CLEANUP_TASKS=[
  {id:'temp',icon:'📁',n:{en:'Temporary files',es:'Archivos temporales'},d:{en:'%TEMP% and Windows\\Temp folders',es:'Carpetas %TEMP% y Windows\\Temp'}},
  {id:'recycle',icon:'🗑',n:{en:'Recycle Bin',es:'Papelera de reciclaje'},d:{en:'Empty all drives recycle bins',es:'Vaciar papelera de todas las unidades'}},
  {id:'prefetch',icon:'⚡',n:{en:'Prefetch files',es:'Archivos Prefetch'},d:{en:'Windows\\Prefetch — safe to delete',es:'Windows\\Prefetch — seguro de borrar'}},
  {id:'winupdate',icon:'🔽',n:{en:'Windows Update cache',es:'Caché de Windows Update'},d:{en:'SoftwareDistribution\\Download folder',es:'Carpeta SoftwareDistribution\\Download'}},
  {id:'thumbnails',icon:'🖼',n:{en:'Thumbnail cache',es:'Caché de miniaturas'},d:{en:'Explorer thumbnail cache files',es:'Archivos de caché de miniaturas'}},
  {id:'dnscache',icon:'🌐',n:{en:'DNS cache',es:'Caché DNS'},d:{en:'Flush DNS resolver cache',es:'Limpiar caché del resolver DNS'}},
  {id:'memorydump',icon:'💥',n:{en:'Memory dumps',es:'Volcados de memoria'},d:{en:'MEMORY.DMP + Minidump folder',es:'MEMORY.DMP + carpeta Minidump'}},
];
let cleanPicked=new Set();

function drawCleanup(){
  document.getElementById('tab-cleanup-label').textContent=T('tabCleanup');
  document.getElementById('cleanup-desc').textContent=T('cleanupDesc');
  document.getElementById('btn-cleanup-text').textContent=cleanPicked.size>0?T('cleanupBtnCount').replace('{n}',cleanPicked.size):T('cleanupBtn');
  const g=document.getElementById('cleanup-grid');
  g.innerHTML=CLEANUP_TASKS.map(t=>{
    const sel=cleanPicked.has(t.id)?' selected':'';
    const chk=cleanPicked.has(t.id)?'checked':'';
    return `<label class="cleanup-item${sel}">
      <label class="toggle"><input type="checkbox" data-cid="${t.id}" ${chk}><span class="toggle-slider"></span></label>
      <span style="font-size:1.2em">${t.icon}</span>
      <div class="cleanup-item-body">
        <div class="cleanup-item-name">${LO(t.n)}</div>
        <div class="cleanup-item-desc">${LO(t.d)}</div>
      </div>
    </label>`;
  }).join('');
  g.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change',function(){
      if(this.checked)cleanPicked.add(this.dataset.cid);else cleanPicked.delete(this.dataset.cid);
      this.closest('.cleanup-item').classList.toggle('selected',this.checked);
      const has=cleanPicked.size>0;
      document.getElementById('btn-cleanup-text').textContent=has?T('cleanupBtnCount').replace('{n}',cleanPicked.size):T('cleanupBtn');
      document.getElementById('btn-run-cleanup').disabled=busy||!has;
    });
  });
  document.getElementById('btn-run-cleanup').disabled=true;
}

async function doCleanup(){
  appendLog('[CMD] Cleanup triggered, selected: '+cleanPicked.size);
  if(busy){appendLog('[WARN] Busy');return}
  if(cleanPicked.size===0){appendLog('[WARN] No items selected');return}
  busy=true;refreshUI();
  try{
    setTerm('Cleaning...','running');
    const r=await window.go.main.App.CleanupRun([...cleanPicked],lang);
    if(r)appendLog(r);
    setTerm(T('idle'),'');
  }catch(e){
    appendLog('[ERR] Cleanup failed: '+e);
    setTerm('Error','err');
  }
  busy=false;refreshUI();
  cleanPicked.clear();drawCleanup();
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
  initRestoreListeners();
  initUpdateListeners();
  document.getElementById('btn-install-apps').addEventListener('click',doInstall);
  document.getElementById('btn-apply-tweaks').addEventListener('click',doApply);
  document.getElementById('btn-run-features').addEventListener('click',doRunFeatures);
  document.getElementById('btn-run-cleanup').addEventListener('click',doCleanup);
  document.getElementById('btn-speedtest')?.addEventListener('click',runSpeedTest);
  document.getElementById('dns-select')?.addEventListener('change',applyDNS);
  document.getElementById('btn-profile-save')?.addEventListener('click',showSaveProfileModal);
  document.getElementById('btn-profile-load')?.addEventListener('click',toggleProfileMenu);
  document.getElementById('btn-tweaks-clear')?.addEventListener('click',clearTweaksSelection);
  document.querySelectorAll('.profile-quick-btn').forEach(btn=>{
    btn.addEventListener('click',function(){doLoadProfile(this.dataset.profile);});
  });
  document.getElementById('apps-search').addEventListener('input',function(){appsSearch=this.value;drawApps()});
  document.getElementById('btn-clear-selection').addEventListener('click',function(){pickedA.clear();drawApps();refreshUI()});
  document.getElementById('btn-collapse-all').addEventListener('click',function(){const cats=[...new Set(APPS.map(a=>a.cat))];cats.forEach(c=>collapsedCats.add(c));drawApps()});
  document.getElementById('btn-show-installed').addEventListener('click',function(){showInstalledOnly=!showInstalledOnly;checkInstalled();});

  initTheme();
  document.getElementById('btn-clear').addEventListener('click',clearTerm);
  document.getElementById('btn-copy').addEventListener('click',copyTerm);
  document.querySelector('.term-header').addEventListener('click',function(e){if(e.target.closest('button'))return;document.getElementById('terminal').classList.toggle('collapsed')});
  document.querySelectorAll('.pkg-btn').forEach(b=>b.addEventListener('click',function(){pkgMgr=this.dataset.pkg;document.querySelectorAll('.pkg-btn').forEach(x=>x.classList.toggle('active',x===this));drawApps()}));
  document.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click',function(){switchLang(this.dataset.lang);document.querySelectorAll('.lang-btn').forEach(x=>x.classList.toggle('active',x===this))}));
  document.querySelector('.win-min')?.addEventListener('click',()=>window.runtime.WindowMinimise());
  document.querySelector('.win-max')?.addEventListener('click',async()=>{const m=await window.runtime.WindowIsMaximised();m?window.runtime.WindowUnmaximise():window.runtime.WindowMaximise()});
  document.querySelector('.win-close')?.addEventListener('click',()=>{try{window.runtime.Quit()}catch{try{window.runtime.WindowClose()}catch{window.go.main.App.Quit()}}});

  if(window.go?.main?.App){window.go.main.App.EventsOn('log',function(d){appendLog(d)})}
  checkAdmin();
  checkInstalled();
  switchLang(lang);
  setTerm(T('idle'),'');
}

function switchLang(l){lang=l;document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));drawAll();switchTab(curTab)}

/* ========= TABS ========= */
function switchTab(tab){
  curTab=tab;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.toggle('active',c.id==='tab-'+tab));
  if(tab==='tweaks'){drawTweaks();drawProfileMenu();}
  if(tab==='apps')drawApps();
  if(tab==='restore'){drawRestore();}
  if(tab==='features')drawFeatures();
  if(tab==='theme')drawTheme();
  if(tab==='monitor'){drawMonitor();startMonitorPoll()}else{stopMonitorPoll()}
  if(tab==='cleanup')drawCleanup();
  if(tab==='updates')drawUpdates();
  refreshUI();
}

let monTimer=null;
function startMonitorPoll(){stopMonitorPoll();drawMonitor();monTimer=setInterval(()=>{fetchMonitor();fetchNetworkLatency();},3000)}
function stopMonitorPoll(){if(monTimer){clearInterval(monTimer);monTimer=null}}

function drawAll(){drawRestore();drawApps();drawTweaks();drawFeatures();drawTheme();drawMonitor();drawCleanup();drawUpdates();refreshUI();drawProfileMenu();}

/* ========= TAB: APPS ========= */
let collapsedCats=new Set(),appsSearch='',showInstalledOnly=false;
function drawApps(){
  document.getElementById('tab-apps-label').textContent=T('tabApps');
  document.getElementById('selected-count-label').textContent=pickedA.size>0?T('selectedCount').replace('{n}',pickedA.size):'';
  document.getElementById('btn-show-installed').classList.toggle('active',showInstalledOnly);
  const q=appsSearch.toLowerCase();
  const catOrder=['Navegadores','Multimedia','Desarrollo','Juegos','Comunicacion','AI','Utilidades'];
  const allCats=[...new Set(APPS.map(a=>a.cat))].sort((a,b)=>{const ai=catOrder.indexOf(a),bi=catOrder.indexOf(b);return (ai===-1?99:ai)-(bi===-1?99:bi)});
  const grid=document.getElementById('apps-grid');
  grid.innerHTML=allCats.map((c,ci)=>{
    const apps=APPS.filter(a=>a.cat===c&&(!q||LO(a.n).toLowerCase().includes(q)||(a.id&&a.id.includes(q)))&&(!showInstalledOnly||installedSet.has(a.id)));
    if(apps.length===0)return'';
    const collapsed=collapsedCats.has(c);
    return `<div class="app-cat-section${collapsed?' collapsed':''}" data-cat="${c}">
      <div class="app-cat-title"><span class="app-cat-arrow">▼</span>${T('cat'+c)}<span class="app-cat-sel-all" data-ci="${ci}">${T('selectAll')}</span><span style="font-weight:400;color:var(--tx3);margin-left:auto">${apps.length} apps</span></div>
       <div class="app-cat-grid">${apps.map(a=>{
         const sel=pickedA.has(a.id)?' selected':'';
         const chk=pickedA.has(a.id)?'checked':'';
         const pkg=pkgMgr==='winget'?a.w:a.c;
          const noPkg=!pkg;
          const isInst=installedSet.has(a.id);
          const icls=isInst?' installed':'';
          return `<div class="app-card${sel}${icls}" data-aid="${a.id}">
           <label class="toggle"><input type="checkbox" data-aid="${a.id}" ${chk} ${noPkg||isInst?'disabled':''}><span class="toggle-slider"></span></label>
           ${a.img?`<img class="app-icon" src="${a.img}" alt="">`:`<span class="app-icon">${a.icon}</span>`}
           <div class="app-info">
             <div class="app-name">${LO(a.n)}${isInst?` <span class="app-inst-badge">${T('installed')}</span>`:''}</div>
             <div class="app-desc">${LO(a.d)}</div>
             <div class="app-actions">
              <button class="app-btn app-btn-uninstall" data-aid="${a.id}" data-action="uninstall" ${noPkg&&!isInst?'disabled':''}>${T('uninstall')}</button>
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
  grid.querySelectorAll('.app-cat-title').forEach(title=>{
    title.addEventListener('click',function(e){if(e.target.closest('.app-cat-sel-all'))return;const cat=this.parentElement.dataset.cat;collapsedCats.has(cat)?collapsedCats.delete(cat):collapsedCats.add(cat);drawApps()});
  });
  grid.querySelectorAll('.app-cat-sel-all').forEach(el=>{
    el.addEventListener('click',function(e){e.stopPropagation();const ci=parseInt(this.dataset.ci);const c=allCats[ci];if(!c)return;const apps=APPS.filter(a=>a.cat===c&&(!q||LO(a.n).toLowerCase().includes(q)));const all=apps.every(a=>pickedA.has(a.id));apps.forEach(a=>all?pickedA.delete(a.id):pickedA.add(a.id));drawApps();refreshUI()});
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
  checkInstalled();
}

async function doUninstall(appId){
  const app=APPS.find(a=>a.id===appId);if(!app)return;
  const name=LO(app.n);
  const pkg=pkgMgr==='winget'?app.w:app.c;
  if(!await showConfirm(T('confirm'),`Uninstall ${name} via ${pkgMgr==='winget'?'WinGet':'Chocolatey'}?`))return;
  if(busy)return;busy=true;refreshUI();
  appendLog('--- Uninstalling: '+name+' ('+pkg+') ---');
  setTerm('Uninstalling...','running');
  try{
    await window.go.main.App.UninstallApp(pkg,pkgMgr);
    appendLog('[OK] '+name+' uninstalled');setTerm('Uninstall complete','ok');
  }catch(e){appendLog('[ERR] Uninstall failed: '+e);setTerm('Uninstall failed','err')}
  busy=false;refreshUI();
  checkInstalled();
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
    <div class="cat-body"><div class="cat-sel-all" data-ci="${ci}"><button class="cat-sel-all-btn" type="button"><span class="sel-ico">☐</span><span class="sel-lbl">${T('selectAll')}</span></button></div>${c.tweaks.map(t=>tweakRow(t)).join('')}</div>
  </div>`;
}

function tweakRow(t){
  const n=LO(t.name);const d=LO(t.description);const cmds=(t.commands||[]).length;
  const hasW=(t.warnings?.[lang]||t.warnings?.['en']||[]).length>0;
  const chk=pickedT.has(t.id)?'checked':'';
  const disabled=cmds===0?'disabled':'';
  const uid='tcb-'+t.id;
  return `<div class="tweak-row" data-tid="${t.id}">
    <div class="tweak-left">
      <label class="toggle"><input type="checkbox" id="${uid}" data-tid="${t.id}" ${chk} ${disabled}><span class="toggle-slider"></span></label>
      <button class="tweak-more-btn" data-tid="${t.id}" type="button" title="${T('tweakMoreInfo')}">ℹ️</button>
    </div>
    <label class="tweak-row-main" for="${uid}">
      <div class="tweak-inf"><div class="tweak-inf-name"><span>${n}</span>${hasW?'<span class="warn-dot">●</span>':''}</div><div class="tweak-inf-desc">${d}</div><div class="tweak-inf-meta"><span class="badge badge-${t.impact}">${t.impact}</span>${cmds>0?`<span>${cmds} ${T('cmds')}</span>`:'<span>info</span>'}</div></div>
    </label>
  </div>`;
}

function bindTweakEv(){
  document.querySelectorAll('.cat-card').forEach(card=>{card.querySelector('.cat-head').addEventListener('click',function(e){if(e.target.tagName==='INPUT')return;const w=card.classList.contains('expanded');document.querySelectorAll('.cat-card').forEach(c=>c.classList.remove('expanded'));if(!w)card.classList.add('expanded')})});
  document.querySelectorAll('.cat-sel-all').forEach(el=>{el.addEventListener('click',function(e){e.stopPropagation();const ci=parseInt(this.dataset.ci);const cat=catData[ci];if(!cat)return;const tw=cat.tweaks.filter(t=>t.commands&&t.commands.length>0);const all=tw.length>0&&tw.every(t=>pickedT.has(t.id));tw.forEach(t=>all?pickedT.delete(t.id):pickedT.add(t.id));syncTweakCb(ci);refreshUI()})});
  document.querySelectorAll('.tweak-row input[type="checkbox"]').forEach(cb=>{cb.addEventListener('change',function(e){e.stopPropagation();const id=this.dataset.tid;if(this.checked)pickedT.add(id);else pickedT.delete(id);refreshUI()})});
  document.querySelectorAll('.tweak-row-main').forEach(row=>{row.addEventListener('click',function(e){if(e.target.tagName==='INPUT'||e.target.closest('.toggle'))return;const cb=this.closest('.tweak-row').querySelector('.tweak-left input[type="checkbox"]');if(cb&&!cb.disabled){cb.checked=!cb.checked;cb.dispatchEvent(new Event('change'))}})});
  document.querySelectorAll('.tweak-more-btn').forEach(btn=>{btn.addEventListener('click',function(e){e.stopPropagation();e.preventDefault();const tid=this.dataset.tid;const href=`https://codewinoptimizer.com/docs/tweaks/${tid}`;window.go.main.App.OpenURL(href);appendLog(`[DOCS] Opening: ${href}`)})});
}

function syncTweakCb(ci){
  const card=document.querySelector(`.cat-card[data-ci="${ci}"]`);if(!card)return;
  const cat=catData[ci];if(!cat)return;
  const tw=cat.tweaks.filter(t=>t.commands&&t.commands.length>0);
  const all=tw.length>0&&tw.every(t=>pickedT.has(t.id));
  const lbl=card.querySelector('.sel-lbl');const ico=card.querySelector('.sel-ico');const btn=card.querySelector('.cat-sel-all-btn');
  if(lbl)lbl.textContent=all?T('deselectAll'):T('selectAll');
  if(ico)ico.textContent=all?'☑':'☐';
  if(btn)btn.classList.toggle('all-selected',all);
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
  refreshRestoreUI();
  refreshUpdateUI();

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

async function checkInstalled(){
  try{
    const raw=await window.go.main.App.GetInstalledPackages();
    const ids=JSON.parse(raw);
    if(Array.isArray(ids)){
      installedSet=new Set(ids);
      APPS.forEach(a=>{if(a.w&&ids.includes(a.w))installedSet.add(a.id)});
    }
  }catch(e){}
  drawApps();
}

/* ========= TWEAK PROFILES ========= */

function drawProfileMenu(){
  const btnLoad=document.getElementById('btn-profile-load-text');
  const btnSave=document.getElementById('btn-profile-save-text');
  const btnClear=document.getElementById('btn-tweaks-clear-text');
  if(btnLoad)btnLoad.textContent=T('profileLoad');
  if(btnSave)btnSave.textContent=T('profileSave');
  if(btnClear)btnClear.textContent=T('tweaksClear');
}

async function toggleProfileMenu(){
  const menu=document.getElementById('profile-menu');
  if(!menu)return;
  if(!menu.classList.contains('hidden')){menu.classList.add('hidden');return;}

  let profiles=[];
  try{
    const raw=await window.go.main.App.ListProfiles();
    profiles=JSON.parse(raw);
  }catch(e){}

  if(profiles.length===0){
    menu.innerHTML=`<div class="profile-dropdown-item disabled">${T('profileEmpty')}</div>`;
  }else{
    menu.innerHTML=profiles.map(p=>`
      <div class="profile-dropdown-item">
        <span class="profile-name" data-name="${p}">${p}</span>
        <span class="profile-actions">
          <button class="profile-btn-load" data-name="${p}" title="${T('profileLoad')}">▶</button>
          <button class="profile-btn-del" data-name="${p}" title="${T('profileDelete')}">✕</button>
        </span>
      </div>
    `).join('');
  }
  menu.classList.remove('hidden');

  // Close on outside click
  setTimeout(()=>{
    const close=(e)=>{if(!menu.contains(e.target)&&e.target.id!=='btn-profile-load'){menu.classList.add('hidden');document.removeEventListener('click',close);}};
    document.addEventListener('click',close);
  },0);

  menu.querySelectorAll('.profile-btn-load').forEach(b=>{
    b.addEventListener('click',(e)=>{e.stopPropagation();doLoadProfile(b.dataset.name);document.getElementById('profile-menu').classList.add('hidden');});
  });
  menu.querySelectorAll('.profile-btn-del').forEach(b=>{
    b.addEventListener('click',async (e)=>{e.stopPropagation();if(await showConfirm(T('confirm'),`${T('profileDeleteConfirm')} "${b.dataset.name}"?`))doDeleteProfile(b.dataset.name);});
  });
}

function showSaveProfileModal(){
  const existing=document.getElementById('profile-save-modal');
  if(existing)existing.remove();

  const html=`<div class="startup-modal-overlay" id="profile-save-modal">
    <div class="startup-modal" style="min-width:340px;max-width:400px">
      <h3 style="margin:0 0 14px;font-size:1.1em">${T('profileSaveTitle')}</h3>
      <div style="margin-bottom:16px">
        <label style="font-size:.8em;color:var(--tx2);display:block;margin-bottom:4px">${T('profileName')}</label>
        <input type="text" id="profile-save-name" class="rp-name-input" style="width:100%;text-align:left;max-width:100%" placeholder="Gaming, Work, Minimal..." maxlength="32">
      </div>
      <div style="font-size:.78em;color:var(--tx3);margin-bottom:16px">${pickedT.size} ${T('profileTweaksSelected')}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="profile-save-cancel" class="btn-secondary" style="padding:8px 18px;font-size:.82em">${T('profileCancel')}</button>
        <button id="profile-save-ok" class="btn-primary" style="padding:8px 18px;font-size:.82em">${T('profileSave')}</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);

  document.getElementById('profile-save-cancel').addEventListener('click',()=>document.getElementById('profile-save-modal').remove());
  document.getElementById('profile-save-ok').addEventListener('click',()=>{
    const name=document.getElementById('profile-save-name').value.trim();
    if(!name){appendLog('[WARN] Profile name required');return;}
    if(pickedT.size===0){appendLog('[WARN] No tweaks selected');return;}
    doSaveProfile(name);
    document.getElementById('profile-save-modal').remove();
  });
  document.getElementById('profile-save-modal').addEventListener('click',function(e){if(e.target===this)this.remove();});
}

async function doSaveProfile(name){
  try{
    const ids=Array.from(pickedT);
    const r=await window.go.main.App.SaveProfile(name,ids);
    appendLog(r);
  }catch(e){appendLog('[ERR] Save profile failed: '+e);}
}

async function doLoadProfile(name){
  try{
    const raw=await window.go.main.App.LoadProfile(name);
    if(raw.startsWith('[ERR]')){appendLog(raw);return;}
    const ids=JSON.parse(raw);
    if(!Array.isArray(ids)){appendLog('[ERR] Invalid profile data');return;}
    pickedT=new Set(ids);
    drawTweaks();
    refreshUI();
    appendLog(`[OK] Profile loaded: ${name} (${ids.length} tweaks)`);
  }catch(e){appendLog('[ERR] Load profile failed: '+e);}
}

async function doDeleteProfile(name){
  try{
    const r=await window.go.main.App.DeleteProfile(name);
    appendLog(r);
    toggleProfileMenu();
  }catch(e){appendLog('[ERR] Delete profile failed: '+e);}
}


function clearTweaksSelection(){
  const count=pickedT.size;
  if(count===0)return;
  pickedT.clear();
  drawTweaks();
  refreshUI();
  appendLog(`[OK] Cleared ${count} selected tweak(s)`);
}

document.addEventListener('DOMContentLoaded',boot);
