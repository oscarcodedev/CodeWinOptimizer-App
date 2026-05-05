# 🚀 CodeWinOptimizer v1.1.0

CodeWinOptimizer is a portable Windows optimization & customization tool — 171 apps, **140+ tweaks**, real-time monitor, disk cleanup, network speed test, driver backup & restore, tweak profiles — all in a single .exe. Auto-elevates to Administrator on launch.

## Features

### 🔧 System Restore & Backup
- Create restore points anytime (no 24h limit)
- Full registry backup (all 5 hives exported)
- Driver backup (DISM export) & restore (pnputil) to `Documents\CodeWinOptimizer\driver-backups\`

### 📦 App Manager (171 apps)
- 7 categories: Browsers, Multimedia, Dev, Games, Communication, AI, Utilities
- Install/Uninstall via WinGet or Chocolatey (auto-installs Choco if missing)
- Detects installed apps, search bar, collapsible categories
- Toolbar: Clear Selection, Collapse All, Show Installed filter

### ⚡ System Tweaks (140+)
- **14 categories** organized by use case:
  - 🌐 Network, 🧠 Memory, 🎮 GPU, ⚙️ Windows Features
  - 🛡️ Firewall & Security, 🔧 Nagle Algorithm, 📊 Network Throttling
  - ⚡ System Responsiveness, ⏱️ Latency Timers
  - 🔒 Privacy, 🚀 Performance, 🖥 UI & Bloat Removal
  - ✅ **Essential Tweaks** — 12 safe optimizations for any user
  - ⚠️ **Advanced Tweaks — CAUTION** — 17 deeper system changes
- Toggle switches with impact badges (low/medium/high)
- **Clear Selection** button to deselect all tweaks instantly
- **Save/Load Tweak Profiles** — export selections as JSON
  - 3 default profiles: **Standard** (15 safe tweaks), **Gaming** (21 performance tweaks), **Minimal** (19 clean-install tweaks)
  - Profiles stored in `Documents\CodeWinOptimizer\profiles\`

### 🛠 Windows Features & Quick Fixes
- Enable: Hyper-V, WSL, Sandbox, .NET Framework, NFS, Legacy Media, F8 Boot
- Quick Fixes: Autologin, Network Reset, NTP Sync, SFC/DISM, Windows Update Reset, WinGet Reinstall

### 📊 Real-Time System Monitor
- CPU %, RAM, GPU usage/temp/VRAM, disk usage, temperatures, uptime (3s refresh)
- CPU/RAM via gopsutil (native), GPU via nvidia-smi, color-coded gauges
- **Network latency** — TCP ping to 1.1.1.1, 8.8.8.8, google.com
- **Speed Test** — Professional Speedtest.net measurement (ping + download/upload)

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
```
5A861CCEE284CF54E8D370FB129B255DE8EC8533D175B65E3C52C428FD7D51F6
```

Verify: `Get-FileHash -Algorithm SHA256 CodeWinOptimizer.exe`

## Changelog
https://github.com/kirii86/CodeWinOptimizer-App/commits/main

---

### What's New in v1.1.0

- **💾 Tweak Profiles** — Save, load, and manage your tweak selections as named profiles
  - 3 built-in profiles: **Standard** (15 safe tweaks), **Gaming** (21 performance tweaks), **Minimal** (19 clean-install tweaks)
  - One-click apply via colored buttons in the Tweaks tab
  - Full CRUD: Save, Load, Delete, List
- **🌐 Network Speed Test** — Professional Speedtest.net measurement via speedtest-go (ping + download/upload)
- **💾 Driver Backup & Restore** — Export all drivers via DISM, restore via pnputil
- **29 New Tweaks** organized in 2 new categories:
  - ✅ **Essential Tweaks** (12 safe optimizations: ConsumerFeatures, Location Tracking, WPBT, etc.)
  - ⚠️ **Advanced Tweaks — CAUTION** (17 deeper changes: Edge removal, Copilot disable, bloatware removal, etc.)
- **Clear Selection** button in Tweaks tab to deselect all tweaks instantly
- Total tweaks: **140+** across **14 categories**
- Removed Startup tab (was not matching expected Autoruns behavior)
- Updated all ES/EN translations
