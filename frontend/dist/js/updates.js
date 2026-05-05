/* ========= TAB: UPDATES ========= */
function drawUpdates(){
  document.getElementById('tab-updates-label').textContent=T('tabUpdates');

  document.getElementById('btn-update-default-text').textContent=T('updateDefaultBtn');
  document.getElementById('update-default-title').textContent=T('updateDefaultTitle');
  document.getElementById('update-default-list').innerHTML=`<li>${T('updateDefaultItem1')}</li><li>${T('updateDefaultItem2')}</li>`;
  document.getElementById('update-default-note').textContent=T('updateDefaultNote');

  document.getElementById('btn-update-security-text').textContent=T('updateSecurityBtn');
  document.getElementById('update-security-title').textContent=T('updateSecurityTitle');
  document.getElementById('update-security-list').innerHTML=`<li>${T('updateSecurityItem1')}</li><li>${T('updateSecurityItem2')}</li><li>${T('updateSecurityItem3')}</li>`;
  document.getElementById('update-security-note').textContent=T('updateSecurityNote');

  document.getElementById('btn-update-disable-text').textContent=T('updateDisableBtn');
  document.getElementById('update-disable-title').textContent=T('updateDisableTitle');
  document.getElementById('update-disable-list').innerHTML=`<li>${T('updateDisableItem1')}</li><li>${T('updateDisableItem2')}</li><li>${T('updateDisableItem3')}</li>`;
  document.getElementById('update-disable-warning').textContent=T('updateDisableWarning');
}

async function doUpdateDefault(){
  if(busy)return;
  busy=true;refreshUI();
  setTerm(T('updateDefaultRunning'),'running');appendLog('=== '+T('updateDefaultRunning')+' ===');
  try{
    const r=await window.go.main.App.SetWindowsUpdate('default');
    if(r)appendLog(r);
    appendLog('[OK] '+T('updateDefaultOk'));setTerm(T('updateDefaultOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('updateDefaultFail')+': '+e);setTerm(T('updateDefaultFail'),'err')}
  busy=false;refreshUI();
}

async function doUpdateSecurity(){
  if(busy)return;
  busy=true;refreshUI();
  setTerm(T('updateSecurityRunning'),'running');appendLog('=== '+T('updateSecurityRunning')+' ===');
  try{
    const r=await window.go.main.App.SetWindowsUpdate('security');
    if(r)appendLog(r);
    appendLog('[OK] '+T('updateSecurityOk'));setTerm(T('updateSecurityOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('updateSecurityFail')+': '+e);setTerm(T('updateSecurityFail'),'err')}
  busy=false;refreshUI();
}

async function doUpdateDisable(){
  if(busy)return;
  const ok=await showConfirm(T('updateDisableConfirm'),T('updateDisableConfirmMsg'));
  if(!ok){return;}
  busy=true;refreshUI();
  setTerm(T('updateDisableRunning'),'running');appendLog('=== '+T('updateDisableRunning')+' ===');
  try{
    const r=await window.go.main.App.SetWindowsUpdate('disable');
    if(r)appendLog(r);
    appendLog('[OK] '+T('updateDisableOk'));setTerm(T('updateDisableOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('updateDisableFail')+': '+e);setTerm(T('updateDisableFail'),'err')}
  busy=false;refreshUI();
}

function initUpdateListeners(){
  document.getElementById('btn-update-default')?.addEventListener('click',doUpdateDefault);
  document.getElementById('btn-update-security')?.addEventListener('click',doUpdateSecurity);
  document.getElementById('btn-update-disable')?.addEventListener('click',doUpdateDisable);
}

function refreshUpdateUI(){
  const d=document.getElementById('btn-update-default'),dt=document.getElementById('btn-update-default-text');
  const s=document.getElementById('btn-update-security'),st=document.getElementById('btn-update-security-text');
  const dis=document.getElementById('btn-update-disable'),dist=document.getElementById('btn-update-disable-text');

  if(d){d.disabled=busy;dt.textContent=busy?'...':T('updateDefaultBtn');}
  if(s){s.disabled=busy;st.textContent=busy?'...':T('updateSecurityBtn');}
  if(dis){dis.disabled=busy;dist.textContent=busy?'...':T('updateDisableBtn');}
}
