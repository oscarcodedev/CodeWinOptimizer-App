/* ========= TAB: RESTORE ========= */
function drawRestore(){
  document.getElementById('tab-restore-label').textContent=T('tabRestore');
  document.getElementById('restore-title').textContent=T('restoreTitle');
  document.getElementById('restore-desc').textContent=T('restoreDesc');
  document.getElementById('btn-restore-text').textContent=T('restoreBtn');
  document.getElementById('btn-regbackup-text').textContent=T('regBackup');
  document.getElementById('rp-name').placeholder=T('rpPlaceholder');

  document.getElementById('driver-backup-title').textContent=T('driverBackupTitle');
  document.getElementById('driver-backup-desc').textContent=T('driverBackupDesc');
  document.getElementById('btn-driver-backup-text').textContent=T('driverBackupBtn');
  document.getElementById('btn-driver-restore-text').textContent=T('driverRestoreBtn');
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

async function doDriverBackup(){
  if(busy)return;busy=true;refreshUI();
  setTerm(T('driverBackupRunning'),'running');appendLog('=== '+T('driverBackupRunning')+' ===');
  try{
    const r=await window.go.main.App.BackupDrivers();
    if(r)appendLog(r);
    appendLog('[OK] '+T('driverBackupOk'));setTerm(T('driverBackupOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('driverBackupFail')+': '+e);setTerm(T('driverBackupFail'),'err')}
  busy=false;refreshUI();
}

async function doDriverRestore(){
  if(busy)return;
  const input=document.createElement('input');
  input.type='file';
  input.webkitdirectory=true;
  input.directory=true;
  input.addEventListener('change',async function(ev){
    const files=ev.target.files;
    if(!files||files.length===0){return;} // User cancelled
    // Get the parent folder path from the first file
    const firstPath=files[0].path||files[0].webkitRelativePath;
    if(!firstPath){return;}
    const folderPath=firstPath.replace(/[\\/][^\\/]*$/,'');
    busy=true;refreshUI();
    setTerm(T('driverRestoreRunning'),'running');appendLog('=== '+T('driverRestoreRunning')+' ===');
    try{
      const r=await window.go.main.App.RestoreDrivers(folderPath);
      if(r)appendLog(r);
      appendLog('[OK] '+T('driverRestoreOk'));setTerm(T('driverRestoreOk'),'ok');
    }catch(e){appendLog('[ERR] '+T('driverRestoreFail')+': '+e);setTerm(T('driverRestoreFail'),'err')}
    busy=false;refreshUI();
  });
  input.click();
}

function initRestoreListeners(){
  document.getElementById('btn-restore').addEventListener('click',doRestore);
  document.getElementById('btn-regbackup').addEventListener('click',doRegBackup);
  document.getElementById('open-backups-link').addEventListener('click',function(e){e.preventDefault();window.go.main.App.OpenFolder()});
  document.getElementById('open-drivers-link')?.addEventListener('click',function(e){e.preventDefault();window.go.main.App.OpenDriverFolder()});
  document.getElementById('btn-driver-backup')?.addEventListener('click',doDriverBackup);
  document.getElementById('btn-driver-restore')?.addEventListener('click',doDriverRestore);
}

function refreshRestoreUI(){
  const rb=document.getElementById('btn-restore'),rt=document.getElementById('btn-restore-text');
  const rbb=document.getElementById('btn-regbackup'),rbt=document.getElementById('btn-regbackup-text');
  const dbb=document.getElementById('btn-driver-backup'),dbt=document.getElementById('btn-driver-backup-text');
  const dbr=document.getElementById('btn-driver-restore'),dbrt=document.getElementById('btn-driver-restore-text');

  rb.disabled=busy;rt.textContent=busy?'...':T('restoreBtn');
  rbb.disabled=busy;rbt.textContent=busy?'...':T('regBackup');
  if(dbb){dbb.disabled=busy;dbt.textContent=busy?'...':T('driverBackupBtn');}
  if(dbr){dbr.disabled=busy;dbrt.textContent=busy?'...':T('driverRestoreBtn');}
}
