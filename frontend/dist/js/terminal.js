function appendLog(m) {
  const t = document.getElementById("terminal");
  if (t) t.classList.remove("collapsed");
  const l = document.getElementById("term-log");
  if (!l) return;
  let c = "";
  if (m.startsWith("[OK]")) c = "log-ok";
  else if (m.startsWith("[ERR]")) c = "log-err";
  else if (m.startsWith("[WARN]")) c = "log-warn";
  else if (m.startsWith("[CMD]")) c = "log-cmd";
  else if (m.startsWith("---")) c = "log-hdr";
  else if (m.startsWith("===")) c = "log-dim";
  const e = document.createElement("span");
  e.className = c;
  e.textContent = m + "\n";
  l.appendChild(e);
  l.scrollTop = l.scrollHeight;
}
function setTerm(t, c) {
  const el = document.getElementById("term-status");
  if (el) {
    el.textContent = t;
    el.className = c;
  }
}
function clearTerm() {
  const l = document.getElementById("term-log");
  if (l) l.innerHTML = "";
  setTerm(T("idle"), "");
}
async function copyTerm() {
  const l = document.getElementById("term-log");
  if (!l) return;
  try {
    await navigator.clipboard.writeText(l.textContent);
    setTerm("Copied!", "ok");
    setTimeout(() => setTerm(T("idle"), ""), 1500);
  } catch (e) {
    setTerm("Copy failed", "err");
  }
}
