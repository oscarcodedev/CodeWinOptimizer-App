# CodeWinOptimizer

Windows optimization & customization tool — system restore, app management, registry tweaks, and quick fixes.

Built with [Wails v2](https://wails.io/) — Go backend + HTML/CSS/JS frontend rendered in WebView2.

> **IMPORTANT:** Run as Administrator. Most features (registry, DISM, bcdedit, WinGet) require admin privileges.

> **Antivirus notice:** This tool uses PowerShell, DISM, WMI, and registry commands. Some antivirus may flag the .exe as suspicious (heuristic/AI false positives). All code is open source — [review the source](https://github.com/kirii86/CodeWinOptimizer) or build it yourself with `wails build`.

---

## Features

### 🔧 Restore
- **Create System Restore Point** with custom name — bypasses the Windows 24h cooldown via registry tweak + WMI
- **Full Registry Backup** — exports all 5 hives (HKLM, HKCU, HKCR, HKU, HKCC) to `.reg` files in `Documents\CodeWinOptimizer\registry-backups\`
- Backups folder opens automatically after completion

### 📦 Apps
- **86+ apps** across 7 categories: Navegadores (15), Multimedia (17), Desarrollo (29), AI (13), Juegos (2), Utilidades (5), Comunicación (2), Seguridad (2)
- Install/Uninstall via **WinGet** or **Chocolatey** (toggle selector)
- Per-category "Select All / Deselect All"
- Each app has **Website** link and **Uninstall** button
- Toggle switches instead of checkboxes
- **Detects already installed apps** (green badge + border)

### ⚡ Tweaks
- **105+ system tweaks** across 12 categories:
  - 🌐 Network, 🧠 Memory, 🎮 GPU, ⚙️ Windows Features
  - 🛡️ Firewall & Security, 🔧 Nagle Algorithm, 📊 Network Throttling
  - ⚡ System Responsiveness, ⏱️ Latency Timers
  - 🔒 Privacy, 🚀 Performance, 🖥 UI & Bloat Removal
- Toggle switches per tweak
- Single-column accordion layout with scroll when expanded

### 🛠 Features
- **Windows Features:** Enable/disable .NET Framework, Hyper-V, WSL, Sandbox, NFS, F8 Boot Recovery, Legacy Media, scheduled registry backup
- **Quick Fixes:** Autologin, Network Reset, NTP Sync, SFC/DISM Scan, Windows Update Reset, WinGet Reinstall
- Execute selected features or individual fixes with terminal logs

### 📊 Monitor
- **Real-time system dashboard** with 3-second auto-refresh
- **CPU:** usage %, model name, cores/threads (gopsutil native)
- **RAM:** used/total GB with gauge bar (gopsutil)
- **GPU:** usage %, VRAM, temperature via nvidia-smi (NVIDIA GPUs)
- **Disks:** per-drive usage with color-coded bars (green/yellow/red)
- **Temperatures:** GPU temp (nvidia-smi), WMI thermal zones
- **Uptime:** days/hours since last boot

### 🎨 Appearance
- **6 accent colors:** Neon Green (default), Cyan, Purple, Orange, Pink, Yellow
- **6 font choices:** Segoe UI, Cascadia Code, Inter, JetBrains Mono, Arial, Trebuchet MS
- Live preview + persistent via localStorage

### 💻 Terminal
- Real-time command output logging
- **Copy** button to clipboard
- **Clear** button
- Text selection enabled

---

## Preview

| Restore | Apps |
|-----------|------|
| ![Restore](https://i.imgur.com/1ZVIUVs.png) | ![Apps](https://i.imgur.com/rJqpplf.png) |

| Tweaks | Features |
|--------|----------|
| ![Tweaks](https://i.imgur.com/dGvBRuB.png) | ![Features](https://i.imgur.com/CIAySy3.png) |

| Appearance |
|-----------|
| ![Appearance](https://i.imgur.com/exoZMYs.png) |

---

## How to Run

### Prerequisites
- [Go](https://go.dev/doc/install) 1.20+
- [Wails](https://wails.io/docs/gettingstarted/installation) v2
- Windows 10/11 with WebView2 runtime

### Development (live reload)
```bash
wails dev
```

### Build executable
```bash
wails build
```
Output: `build/bin/CodeWinOptimizer.exe`

### Usage
1. Run `CodeWinOptimizer.exe` **as Administrator**
2. (Recommended) Create a restore point first — type a name and click "Create Restore Point"
3. Use any tab: install apps, apply tweaks, run features/fixes
4. All operations are logged in the terminal

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go + Wails v2 runtime |
| Frontend | Vanilla JS, CSS (dark theme, neon green #39ff14) |
| Window | WebView2 (embedded Edge Chromium) |
| Package managers | WinGet, Chocolatey |
| System tools | PowerShell, DISM, bcdedit, reg.exe, nvidia-smi |
| Monitoring | gopsutil (CPU/RAM), nvidia-smi (GPU), WMI |

---

## Roadmap

### Completed
- [x] System Restore Point creation (registry bypass for 24h cooldown)
- [x] Full registry backup to .reg files (5 hives)
- [x] App manager — install/uninstall via WinGet & Chocolatey (86+ apps, 7 categories including AI)
- [x] Installed app detection via winget list (green badge + border)
- [x] 105+ system tweaks across 12 categories (network, GPU, memory, privacy, performance...)
- [x] Windows Features manager — .NET, Hyper-V, WSL, Sandbox, NFS, etc.
- [x] Quick Fixes — network reset, NTP sync, SFC/DISM scan, Windows Update reset, WinGet reinstall, autologin
- [x] Portable mode — no installation required, single .exe
- [x] Terminal with real-time logs, copy to clipboard, always visible at bottom
- [x] Custom frameless titlebar with min/max/close
- [x] Toggle switches UI, language selector ES/EN
- [x] Per-category Select All / Deselect All
- [x] Custom theme editor — 6 accent colors, 6 fonts, persisted via localStorage
- [x] System monitoring dashboard — CPU, RAM, GPU (usage/temp/VRAM), disks, temps, uptime

### Planned
- [ ] Save/Load tweak profiles (export selections as JSON)
- [ ] Startup program manager
- [ ] Context menu (right-click) editor
- [ ] Disk cleanup & temp files removal
- [ ] Driver backup & restore
- [ ] Auto-update mechanism
- [ ] More apps: Docker, Wireshark, VirtualBox, VS 2022 Build Tools, CMake, .NET SDK
- [ ] System benchmark (CPU/GPU/disk scores)
- [ ] Network speed test & latency monitor
- [ ] Registry defrag & optimization
- [ ] Scheduled maintenance (auto-clean, auto-backup registry)
- [ ] Process/service manager (stop bloatware)


## License

MIT — see [LICENSE](LICENSE)
