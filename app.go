package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed tweaks.json
var tweaksJSON []byte

type Category struct {
	ID     string            `json:"id"`
	Icon   string            `json:"icon"`
	Name   map[string]string `json:"name"`
	Tweaks []Tweak           `json:"tweaks"`
}

type Tweak struct {
	ID          string              `json:"id"`
	Name        map[string]string   `json:"name"`
	Description map[string]string   `json:"description"`
	Benefit     map[string]string   `json:"benefit"`
	Impact      string              `json:"impact"`
	Commands    []string            `json:"commands"`
	Warnings    map[string][]string `json:"warnings"`
}

type App struct {
	ctx        context.Context
	categories []Category
}

func NewApp() *App {
	a := &App{}
	a.loadTweaks()
	return a
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	wailsRuntime.LogInfo(ctx, "CodeWinOptimizer started")
}

func (a *App) loadTweaks() {
	if err := json.Unmarshal(tweaksJSON, &a.categories); err != nil {
		panic("Failed to load embedded tweaks.json: " + err.Error())
	}
}

func (a *App) emitLog(msg string) {
	wailsRuntime.EventsEmit(a.ctx, "log", msg)
}

func (a *App) GetCategories() []Category {
	return a.categories
}

func (a *App) CreateRestorePoint(description string) string {
	// Sanitize description for PowerShell double-quoted string
	desc := strings.NewReplacer(
		"`", "``",
		"$", "`$",
		"\"", "\"\"",
	).Replace(description)

	psCmd := fmt.Sprintf(`[Console]::OutputEncoding = [Text.Encoding]::UTF8
$desc = "%s"

# Enable System Restore if needed
try { Enable-ComputerRestore -Drive "$env:SystemDrive\" -ErrorAction SilentlyContinue } catch {}

# Bypass the 24h limit — use reg.exe (works on all Windows versions)
$freqPath = "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore"
$freqName = "SystemRestorePointCreationFrequency"

# Save old value
$oldVal = (reg query $freqPath /v $freqName 2>$null | Select-String "0x" | ForEach-Object { $_.Line.Split()[2] }) -replace "0x",""

# Set to 0
reg add "$freqPath" /v $freqName /t REG_DWORD /d 0 /f 2>$null | Out-Null

try {
    Checkpoint-Computer -Description $desc -RestorePointType MODIFY_SETTINGS -ErrorAction Stop

    $created = Get-ComputerRestorePoint | Where-Object { $_.Description -eq $desc } | Select-Object -First 1
    if ($created) {
        Write-Host "OK - Restore point created: $desc"
    } else {
        Write-Host "ERR: created but not found in list"
        exit 1
    }
} catch {
    Write-Host "ERR: $($_.Exception.Message)"
    exit 1
} finally {
    # Restore old frequency
    if ($oldVal) {
        reg add "$freqPath" /v $freqName /t REG_DWORD /d $oldVal /f 2>$null | Out-Null
    } else {
        reg delete "$freqPath" /v $freqName /f 2>$null | Out-Null
    }
}`, desc)

	a.emitLog("[CMD] Creating restore point")
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCmd)
	cmd.SysProcAttr = getSysProcAttr()
	output, err := cmd.CombinedOutput()

	if err != nil {
		msg := fmt.Sprintf("[ERR] Restore point failed: %v", err)
		a.emitLog(msg)
		if len(output) > 0 {
			a.emitLog(strings.TrimSpace(string(output)))
		}
		return string(output)
	}

	a.emitLog("[OK] Restore point created")
	return strings.TrimSpace(string(output))
}

func (a *App) RunCommands(tweakIDs []string, lang string) string {
	total := len(tweakIDs)

	for i, tweakID := range tweakIDs {
		tweak := a.findTweak(tweakID)
		if tweak == nil || len(tweak.Commands) == 0 {
			continue
		}

		name := tweak.Name["en"]
		if lang == "es" {
			name = tweak.Name["es"]
		}

		a.emitLog(fmt.Sprintf("--- [%d/%d] %s ---", i+1, total, name))

		joinedCmd := "[Console]::OutputEncoding = [Text.Encoding]::UTF8; " + strings.Join(tweak.Commands, "; ")
		cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", joinedCmd)
		cmd.SysProcAttr = getSysProcAttr()
		output, err := cmd.CombinedOutput()

		if err != nil {
			a.emitLog(fmt.Sprintf("[ERR] %v", err))
			a.emitLog(strings.TrimSpace(string(output)))
		} else {
			out := strings.TrimSpace(string(output))
			if out != "" {
				a.emitLog(out)
			} else {
				a.emitLog("[OK] Applied successfully")
			}
		}
	}

	a.emitLog("=== Complete ===")
	return ""
}

func (a *App) InstallApps(ids []string, lang string, pkgMgr string) string {
	total := len(ids)

	for i, id := range ids {
		a.emitLog(fmt.Sprintf("--- [%d/%d] Installing: %s ---", i+1, total, id))

		var psCmd string
		if pkgMgr == "choco" {
			psCmd = fmt.Sprintf("[Console]::OutputEncoding = [Text.Encoding]::UTF8; choco install %s -y --limit-output", id)
		} else {
			psCmd = fmt.Sprintf("[Console]::OutputEncoding = [Text.Encoding]::UTF8; winget install --id %s --silent --accept-package-agreements --accept-source-agreements", id)
		}

		cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCmd)
		cmd.SysProcAttr = getSysProcAttr()
		output, err := cmd.CombinedOutput()

		if err != nil {
			a.emitLog(fmt.Sprintf("[ERR] %v", err))
			a.emitLog(strings.TrimSpace(string(output)))
		} else {
			out := strings.TrimSpace(string(output))
			if out != "" {
				a.emitLog(out)
			} else {
				a.emitLog("[OK] Installed successfully")
			}
		}
	}

	a.emitLog("=== Complete ===")
	return ""
}

func (a *App) UninstallApp(id string, pkgMgr string) string {
	var psCmd string
	if pkgMgr == "choco" {
		psCmd = fmt.Sprintf("[Console]::OutputEncoding = [Text.Encoding]::UTF8; choco uninstall %s -y --limit-output", id)
	} else {
		psCmd = fmt.Sprintf("[Console]::OutputEncoding = [Text.Encoding]::UTF8; winget uninstall --id %s --silent --accept-source-agreements", id)
	}

	a.emitLog(fmt.Sprintf("[CMD] Uninstalling: %s via %s", id, pkgMgr))
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCmd)
	cmd.SysProcAttr = getSysProcAttr()
	output, err := cmd.CombinedOutput()

	if err != nil {
		a.emitLog(fmt.Sprintf("[ERR] %v", err))
		a.emitLog(strings.TrimSpace(string(output)))
	} else {
		out := strings.TrimSpace(string(output))
		if out != "" {
			a.emitLog(out)
		} else {
			a.emitLog("[OK] Uninstalled successfully")
		}
	}
	return ""
}

func (a *App) OpenURL(url string) {
	wailsRuntime.BrowserOpenURL(a.ctx, url)
}

func (a *App) OpenFolder() {
	backupDir := fmt.Sprintf("%s\\CodeWinOptimizer\\registry-backups", os.Getenv("USERPROFILE"))
	os.MkdirAll(backupDir, 0755)
	exec.Command("explorer", backupDir).Start()
}

func (a *App) ExecPowerShell(script string) string {
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script)
	cmd.SysProcAttr = getSysProcAttr()
	output, err := cmd.CombinedOutput()
	out := strings.TrimSpace(string(output))

	if err != nil {
		if out != "" {
			a.emitLog(out)
		}
		a.emitLog(fmt.Sprintf("[ERR] %v", err))
	} else if out != "" {
		a.emitLog(out)
	} else {
		a.emitLog("[OK] Command completed")
	}

	return out
}

func (a *App) Quit() {
	wailsRuntime.Quit(a.ctx)
}

func (a *App) BackupRegistry() string {
	backupDir := fmt.Sprintf("%s\\CodeWinOptimizer\\registry-backups", os.Getenv("USERPROFILE"))
	ts := time.Now().Format("2006-01-02_150405")
	dir := fmt.Sprintf("%s\\%s", backupDir, ts)

	psCmd := fmt.Sprintf(`[Console]::OutputEncoding = [Text.Encoding]::UTF8
$dir = "%s"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
$hives = @("HKLM","HKCU","HKCR","HKU","HKCC")
$total = $hives.Count; $ok = 0
foreach ($h in $hives) {
    try {
        $out = Join-Path $dir "$h.reg"
        reg export $h $out /y 2>$null
        if ($LASTEXITCODE -eq 0) { $ok++; Write-Host "OK: $h exported" }
        else { Write-Host "WARN: $h had warnings (partial export)" }
    } catch {
        Write-Host "ERR: $h - $($_.Exception.Message)"
    }
}
Write-Host "--- Full registry backup: $ok/$total hives -> $dir ---"
# Open folder in Explorer
Start-Process explorer.exe -ArgumentList $dir`, dir)

	a.emitLog("[CMD] Backing up full registry (5 hives: HKLM, HKCU, HKCR, HKU, HKCC)...")
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCmd)
	cmd.SysProcAttr = getSysProcAttr()
	output, err := cmd.CombinedOutput()

	if err != nil {
		a.emitLog(fmt.Sprintf("[ERR] Registry backup failed: %v", err))
	} else {
		a.emitLog(fmt.Sprintf("[OK] Full registry backup saved to: %s", dir))
	}

	return strings.TrimSpace(string(output))
}

func (a *App) findTweak(id string) *Tweak {
	for _, cat := range a.categories {
		for j := range cat.Tweaks {
			if cat.Tweaks[j].ID == id {
				return &cat.Tweaks[j]
			}
		}
	}
	return nil
}

func (a *App) SelectLanguage(lang string) string {
	return "ok"
}

func (a *App) CheckAdmin() bool {
	cmd := exec.Command("powershell", "-NoProfile", "-Command",
		"(New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)")
	output, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.TrimSpace(string(output)) == "True"
}

func (a *App) GetInstalledPackages() string {
	psCmd := `$out = winget list --accept-source-agreements 2>$null | Out-String -Width 4096; $lines = $out -split '\r?\n' | Where-Object { $_ -match '\S' }; $collect = $false; $ids = @(); foreach ($l in $lines) { if ($l -match '^-{2,}') { $collect = $true; continue }; if (-not $collect) { continue }; $p = @($l -split '\s{2,}'); if ($p.Count -ge 2 -and $p[1] -match '\.') { $ids += $p[1].Trim() } }; $ids | ConvertTo-Json -Compress; if (-not $?) { '[]' }`
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCmd)
	cmd.SysProcAttr = getSysProcAttr()
	output, err := cmd.Output()
	if err != nil {
		return "[]"
	}
	result := strings.TrimSpace(string(output))
	if result == "" || result == "null" {
		return "[]"
	}
	return result
}

func (a *App) GetSystemInfo() string {
	psCmd := `[Console]::OutputEncoding = [Text.Encoding]::UTF8

# --- CPU ---
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuPct = 0
# Two-sample Get-Counter for accurate reading
try {
	$null = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop
	Start-Sleep -Milliseconds 600
	$s = (Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop).CounterSamples[0].CookedValue
	$cpuPct = [math]::Round([double]$s, 1)
} catch {
	# Fallback to CIM LoadPercentage
	try { $cpuPct = [double]($cpu.LoadPercentage) } catch {}
}
$cpuName = $cpu.Name
$cpuCores = $cpu.NumberOfCores
$cpuThreads = $cpu.NumberOfLogicalProcessors

# --- RAM ---
$os = Get-CimInstance Win32_OperatingSystem
$ramTotal = [math]::Round($os.TotalVisibleMemorySize/1MB, 1)
$ramFree = [math]::Round($os.FreePhysicalMemory/1MB, 1)
$ramUsed = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory)/1MB, 1)
$ramPct = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize * 100, 1)

# --- GPU: collect CIM info + try nvidia-smi ---
$gpuList = @()
$gpus = Get-CimInstance Win32_VideoController
foreach ($g in $gpus) {
	$name = $g.Name; if (-not $name) { $name = 'Unknown' }
	if ($name.Length -gt 50) { $name = $name.Substring(0,47)+'...' }
	$vram = 0
	if ($g.AdapterRAM -and $g.AdapterRAM -gt 0) { $vram = [math]::Round($g.AdapterRAM/1GB, 1) }
	$gpuList += [PSCustomObject]@{ name = $name; driver = $g.DriverVersion; ramGB = $vram; usage = 0; temp = 0 }
}

# Try nvidia-smi for usage+temp (find first NVIDIA GPU index)
$nvidiaIdx = -1
for ($i=0; $i -lt $gpuList.Count; $i++) {
	if ($gpuList[$i].name -match '(?i)nvidia|geforce|rtx|quadro|tesla') { $nvidiaIdx = $i; break }
}
if ($nvidiaIdx -ge 0) {
	try {
		$smi = & nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.total --format=csv,noheader,nounits 2>$null
		if ($smi) {
			$parts = $smi.Trim() -split ',\s*'
			if ($parts.Count -ge 2) {
				$gpuList[$nvidiaIdx].usage = [double]$parts[0]
				$gpuList[$nvidiaIdx].temp = [double]$parts[1]
				if ($parts.Count -ge 3 -and [double]$parts[2] -gt 0) {
					$gpuList[$nvidiaIdx].ramGB = [math]::Round([double]$parts[2]/1024, 1)
				}
			}
		}
	} catch {}
}

# --- Disks ---
$diskList = @()
$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
foreach ($d in $disks) {
	$t = [math]::Round($d.Size/1GB, 1)
	$f = [math]::Round($d.FreeSpace/1GB, 1)
	$u = [math]::Round($t - $f, 1)
	$p = if($t -gt 0){[math]::Round(($t-$f)/$t*100,1)}else{0}
	$diskList += [PSCustomObject]@{ drive = $d.DeviceID; total = $t; free = $f; used = $u; pct = $p }
}

# --- Temps ---
$tempList = @()
# NVIDIA GPU temp from smi
if ($nvidiaIdx -ge 0 -and $gpuList[$nvidiaIdx].temp -gt 0) {
	$tempList += [PSCustomObject]@{ name = 'GPU'; temp = $gpuList[$nvidiaIdx].temp }
}
# WMI thermal zones
try {
	$wmiTemps = Get-CimInstance -Namespace root/wmi MSAcpi_ThermalZoneTemperature -ErrorAction Stop
	foreach ($tz in $wmiTemps) {
		$n = $tz.InstanceName -replace '.*\\',''
		$t = [math]::Round(($tz.CurrentTemperature - 2732) / 10.0, 1)
		if ($t -ge 0 -and $t -le 125) { $tempList += [PSCustomObject]@{ name = $n; temp = $t } }
	}
} catch {}

# --- Uptime ---
$uptime = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
$uptimeStr = "$($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"

# --- Build JSON safely ---
[PSCustomObject]@{ 
	cpu = [PSCustomObject]@{ pct = $cpuPct; name = $cpuName; cores = $cpuCores; threads = $cpuThreads };
	ram = [PSCustomObject]@{ totalGB = $ramTotal; freeGB = $ramFree; usedGB = $ramUsed; pct = $ramPct };
	gpus = @($gpuList);
	disks = @($diskList);
	temps = @($tempList);
	uptime = $uptimeStr
} | ConvertTo-Json -Compress -Depth 4
`
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCmd)
	cmd.SysProcAttr = getSysProcAttr()
	output, err := cmd.Output()
	if err != nil {
		return `{"error":"` + err.Error() + `"}`
	}
	result := strings.TrimSpace(string(output))
	if result == "" || result == "null" {
		return `{"error":"empty"}`
	}
	return result
}
