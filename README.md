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
- **70+ apps** across 6 categories: Navegadores (15), Multimedia (17), Desarrollo (28), Juegos (2), Utilidades (5), Comunicación (2), Seguridad (2)
- Install/Uninstall via **WinGet** or **Chocolatey** (toggle selector)
- Per-category "Select All / Deselect All"
- Each app has **Website** link and **Uninstall** button
- Toggle switches instead of checkboxes

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

### 💻 Terminal
- Real-time command output logging
- **Copy** button to clipboard
- **Clear** button
- Text selection enabled

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
Output: `build/bin/codewinoptimizer.exe`

### Usage
1. Run `codewinoptimizer.exe` **as Administrator**
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
| System tools | PowerShell, DISM, bcdedit, reg.exe |

---

## Roadmap

### Completed
- [x] System Restore Point creation (registry bypass for 24h cooldown)
- [x] Full registry backup to .reg files (5 hives)
- [x] App manager — install/uninstall via WinGet & Chocolatey (70+ apps)
- [x] 105+ system tweaks across 12 categories (network, GPU, memory, privacy, performance...)
- [x] Windows Features manager — .NET, Hyper-V, WSL, Sandbox, NFS, etc.
- [x] Quick Fixes — network reset, NTP sync, SFC/DISM scan, Windows Update reset, WinGet reinstall, autologin
- [x] Portable mode — no installation required, single .exe
- [x] Terminal with real-time logs, copy to clipboard
- [x] Custom frameless titlebar with min/max/close
- [x] Toggle switches UI, language selector ES/EN
- [x] Per-category Select All / Deselect All
- [x] Custom theme editor (colors, fonts)

### Planned
- [ ] Save/Load tweak profiles (export selections as JSON)
- [ ] System monitoring dashboard (CPU, GPU, RAM, temps)
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
