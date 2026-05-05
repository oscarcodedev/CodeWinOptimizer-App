# 🚀 CodeWinOptimizer

CodeWinOptimizer is a portable Windows optimization & customization tool — 171 apps, 140+ tweaks, real-time monitor, network speed test, driver backup, tweak profiles — all in a single .exe. Auto-elevates to Administrator on launch.

## Features

### 🔧 System Restore & Backup
- Create restore points anytime (no 24h limit)
- Full registry backup (all 5 hives exported)
- Driver backup (DISM) & restore (pnputil) to Documents\CodeWinOptimizer\driver-backups\

### 📦 App Manager (171 apps)
- 7 categories: Browsers, Multimedia, Dev, Games, Communication, AI, Utilities
- Install/Uninstall via WinGet or Chocolatey (auto-installs Choco if missing)
- Detects installed apps, search bar, collapsible categories
- Toolbar: Clear Selection, Collapse All, Show Installed filter

### ⚡ System Tweaks (140+)
- 14 categories: Network, Memory, GPU, Privacy, Performance, UI/Bloat, Essential, Advanced
- Toggle switches with impact badges (low/medium/high)
- Clear Selection button to deselect all tweaks instantly

### 💾 Tweak Profiles
- Save/Load tweak selections as named profiles (JSON)
- 3 one-click profiles: Standard (15 tweaks), Gaming (21), Minimal (19)

### 🛠 Windows Features & Quick Fixes
- Enable: Hyper-V, WSL, Sandbox, .NET Framework, NFS, Legacy Media, F8 Boot
- Quick Fixes: Autologin, Network Reset, NTP Sync, SFC/DISM, Windows Update Reset, WinGet Reinstall

### 📊 Real-Time System Monitor
- CPU %, RAM, GPU usage/temp/VRAM, disk usage, temperatures, uptime (3s refresh)
- CPU/RAM via gopsutil (native), GPU via nvidia-smi, color-coded gauges
- Network latency (TCP ping) + Speedtest.net speed test

### 🧹 Disk Cleanup
- 7 tasks: Temp files, Recycle Bin, Prefetch, Windows Update cache, Thumbnails, DNS, Memory dumps
- Reports MB freed per task, auto-deselects after run

### 🎨 Appearance
- 6 accent colors + 6 font choices

### 💻 Terminal
- Real-time logs, collapsible, ES/EN language toggle

## Requirements
- Windows 10/11 (64-bit)
- WebView2 Runtime (pre-installed on Win 11)

## Limitations
- GPU stats require NVIDIA drivers (nvidia-smi)
- CPU temperature not available on most desktops
- Some antivirus may flag false positives
- Portable only (no installer)

## SHA256
32A1C42C286E552ED244BB1EB0EAE77462E3AE5EDCC9E493ADFD8910398284C9

Verify: `Get-FileHash -Algorithm SHA256 CodeWinOptimizer.exe`

## Changelog
https://github.com/kirii86/CodeWinOptimizer-App/commits/main
