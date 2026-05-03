package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"

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
	// --- CPU % (gopsutil — native, reliable) ---
	cpuPercent := 0.0
	if percents, err := cpu.Percent(0, false); err == nil && len(percents) > 0 {
		cpuPercent = math.Round(percents[0]*10) / 10
	}

	// CPU info via CIM (one-shot, no polling needed)
	cpuInfo, _ := cpu.Info()
	cpuName := ""
	cpuCores := 0
	cpuThreads := 0
	if len(cpuInfo) > 0 {
		cpuName = cpuInfo[0].ModelName
		cpuCores = int(cpuInfo[0].Cores)
	}
	// Logical (thread) count
	if n, err := cpu.Counts(true); err == nil {
		cpuThreads = n
	}

	// --- RAM (gopsutil) ---
	ramTotal := 0.0
	ramFree := 0.0
	ramUsed := 0.0
	ramPct := 0.0
	if vmem, err := mem.VirtualMemory(); err == nil {
		ramTotal = math.Round(float64(vmem.Total)/1024/1024/1024*10) / 10
		ramFree = math.Round(float64(vmem.Available)/1024/1024/1024*10) / 10
		ramUsed = math.Round(float64(vmem.Used)/1024/1024/1024*10) / 10
		ramPct = math.Round(vmem.UsedPercent*10) / 10
	}

	// --- Uptime (gopsutil) ---
	uptimeStr := ""
	if up, err := host.Uptime(); err == nil {
		uptimeSec := uint64(up)
		days := uptimeSec / 86400
		hours := (uptimeSec % 86400) / 3600
		minutes := (uptimeSec % 3600) / 60
		uptimeStr = fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	}

	// --- GPU, Disks, Temps via PowerShell ---
	psCmd := `[Console]::OutputEncoding = [Text.Encoding]::UTF8

$gpuList = @()
$gpus = Get-CimInstance Win32_VideoController
foreach ($g in $gpus) {
	$name = $g.Name; if (-not $name) { $name = 'Unknown' }
	if ($name.Length -gt 50) { $name = $name.Substring(0,47)+'...' }
	$vram = 0
	if ($g.AdapterRAM -and $g.AdapterRAM -gt 0) { $vram = [math]::Round($g.AdapterRAM/1GB, 1) }
	$gpuList += [PSCustomObject]@{ name = $name; driver = $g.DriverVersion; ramGB = $vram; usage = 0; temp = 0 }
}

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

func (a *App) RunCleanup(tasks []string, lang string) string {
	type CleanupTask struct {
		id     string
		nameEN string
		nameES string
		ps     string
	}
	allTasks := []CleanupTask{
		{"temp", "Temporary files", "Archivos temporales", "$c=0;try{$d=\"$env:TEMP\";if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Recurse -Force \"$d\\*\" -ErrorAction SilentlyContinue};$d=\"$env:WINDIR\\Temp\";if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Recurse -Force \"$d\\*\" -ErrorAction SilentlyContinue};Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}"},
		{"recycle", "Recycle Bin", "Papelera de reciclaje", "try{Clear-RecycleBin -Force -ErrorAction Stop;Write-Host \"[OK] Recycle bin emptied\"}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}"},
		{"prefetch", "Prefetch files", "Archivos Prefetch", "try{$d=\"$env:WINDIR\\Prefetch\";if(Test-Path $d){$s=(Get-ChildItem -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;Remove-Item -Force \"$d\\*\" -ErrorAction SilentlyContinue;Write-Host (\"[OK] \"+[math]::Round($s/1MB,1)+\" MB cleaned\")}else{Write-Host \"[WARN] Prefetch not found\"}}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}"},
		{"winupdate", "Windows Update cache", "Caché de Windows Update", "try{net stop wuauserv 2>$null;net stop bits 2>$null;$d=\"$env:WINDIR\\SoftwareDistribution\\Download\";$c=0;if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Recurse -Force \"$d\\*\" -ErrorAction SilentlyContinue};net start wuauserv 2>$null;net start bits 2>$null;Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}"},
		{"thumbnails", "Thumbnail cache", "Caché de miniaturas", "try{$c=0;$u=$env:LOCALAPPDATA;if($u){$d=\"$u\\Microsoft\\Windows\\Explorer\";if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force \"$d\\thumbcache_*\" -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Force \"$d\\thumbcache_*\" -ErrorAction SilentlyContinue}};Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}"},
		{"dnscache", "DNS cache", "Caché DNS", "try{ipconfig /flushdns 2>$null|Out-Null;Write-Host \"[OK] DNS cache flushed\"}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}"},
		{"memorydump", "Memory dumps", "Volcados de memoria", "try{$d=\"$env:WINDIR\\MEMORY.DMP\";$c=0;if(Test-Path $d){$s=(Get-Item $d).Length;$c+=$s;Remove-Item -Force $d -ErrorAction SilentlyContinue};$d2=\"$env:WINDIR\\Minidump\";if(Test-Path $d2){$s=(Get-ChildItem -Force $d2 -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Force \"$d2\\*\" -ErrorAction SilentlyContinue};Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}"},
	}
	for _, id := range tasks {
		var t *CleanupTask
		for i := range allTasks {
			if allTasks[i].id == id {
				t = &allTasks[i]
				break
			}
		}
		if t == nil {
			continue
		}
		name := t.nameEN
		if lang == "es" {
			name = t.nameES
		}
		a.emitLog(fmt.Sprintf("--- %s ---", name))
		cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", "[Console]::OutputEncoding = [Text.Encoding]::UTF8; "+t.ps)
		cmd.SysProcAttr = getSysProcAttr()
		out, err := cmd.CombinedOutput()
		if err != nil {
			a.emitLog(fmt.Sprintf("[ERR] %v", err))
		}
		if len(out) > 0 {
			a.emitLog(strings.TrimSpace(string(out)))
		}
	}
	a.emitLog("=== Complete ===")
	return ""
}
			}
		}
	} catch {}
}

$diskList = @()
$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
foreach ($d in $disks) {
	$t = [math]::Round($d.Size/1GB, 1)
	$f = [math]::Round($d.FreeSpace/1GB, 1)
	$u = [math]::Round($t - $f, 1)
	$p = if($t -gt 0){[math]::Round(($t-$f)/$t*100,1)}else{0}
	$diskList += [PSCustomObject]@{ drive = $d.DeviceID; total = $t; free = $f; used = $u; pct = $p }
}

$tempList = @()
if ($nvidiaIdx -ge 0 -and $gpuList[$nvidiaIdx].temp -gt 0) {
	$tempList += [PSCustomObject]@{ name = 'GPU'; temp = $gpuList[$nvidiaIdx].temp }
}
try {
	$wmiTemps = Get-CimInstance -Namespace root/wmi MSAcpi_ThermalZoneTemperature -ErrorAction Stop
	foreach ($tz in $wmiTemps) {
		$n = $tz.InstanceName -replace '.*\\',''
		$t = [math]::Round(($tz.CurrentTemperature - 2732) / 10.0, 1)
		if ($t -ge 0 -and $t -le 125) { $tempList += [PSCustomObject]@{ name = $n; temp = $t } }
	}
} catch {}

[PSCustomObject]@{ 
	gpus = @($gpuList);
	disks = @($diskList);
	temps = @($tempList);
} | ConvertTo-Json -Compress -Depth 4
`
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCmd)
	cmd.SysProcAttr = getSysProcAttr()
	psOutput, psErr := cmd.Output()

	// Build final JSON
	psJSON := `{"gpus":[],"disks":[],"temps":[]}`
	if psErr == nil && len(psOutput) > 0 {
		psJSON = strings.TrimSpace(string(psOutput))
	}

	// Parse PS output and inject Go-computed values
	type CPUOut struct {
		Pct     float64 `json:"pct"`
		Name    string  `json:"name"`
		Cores   int     `json:"cores"`
		Threads int     `json:"threads"`
	}
	type RAMOut struct {
		TotalGB float64 `json:"totalGB"`
		FreeGB  float64 `json:"freeGB"`
		UsedGB  float64 `json:"usedGB"`
		Pct     float64 `json:"pct"`
	}
	type FullOut struct {
		CPU    CPUOut  `json:"cpu"`
		RAM    RAMOut  `json:"ram"`
		Uptime string  `json:"uptime"`
	}

	fo := FullOut{
		CPU:    CPUOut{Pct: cpuPercent, Name: cpuName, Cores: cpuCores, Threads: cpuThreads},
		RAM:    RAMOut{TotalGB: ramTotal, FreeGB: ramFree, UsedGB: ramUsed, Pct: ramPct},
		Uptime: uptimeStr,
	}

	foJSON, _ := json.Marshal(fo)

	// Merge: strip closing } from foJSON, strip opening { from psJSON
	foStr := strings.TrimSuffix(string(foJSON), "}")
	psStr := strings.TrimPrefix(psJSON, "{")
	result := foStr + "," + psStr

	return result
}

var cleanupScripts = map[string]string{
	"temp":       "$c=0;try{$d=\"$env:TEMP\";if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Recurse -Force \"$d\\*\" -ErrorAction SilentlyContinue};$d=\"$env:WINDIR\\Temp\";if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Recurse -Force \"$d\\*\" -ErrorAction SilentlyContinue};Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}",
	"recycle":    "try{Clear-RecycleBin -Force -ErrorAction Stop;Write-Host \"[OK] Recycle bin emptied\"}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}",
	"prefetch":   "try{$d=\"$env:WINDIR\\Prefetch\";if(Test-Path $d){$s=(Get-ChildItem -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;Remove-Item -Force \"$d\\*\" -ErrorAction SilentlyContinue;Write-Host (\"[OK] \"+[math]::Round($s/1MB,1)+\" MB cleaned\")}else{Write-Host \"[WARN] Prefetch not found\"}}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}",
	"winupdate":  "try{net stop wuauserv 2>$null;net stop bits 2>$null;$d=\"$env:WINDIR\\SoftwareDistribution\\Download\";$c=0;if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force $d -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Recurse -Force \"$d\\*\" -ErrorAction SilentlyContinue};net start wuauserv 2>$null;net start bits 2>$null;Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}",
	"thumbnails": "try{$c=0;$u=$env:LOCALAPPDATA;if($u){$d=\"$u\\Microsoft\\Windows\\Explorer\";if(Test-Path $d){$s=(Get-ChildItem -Recurse -Force \"$d\\thumbcache_*\" -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Force \"$d\\thumbcache_*\" -ErrorAction SilentlyContinue}};Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}",
	"dnscache":   "try{ipconfig /flushdns 2>$null|Out-Null;Write-Host \"[OK] DNS cache flushed\"}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}",
	"memorydump": "try{$d=\"$env:WINDIR\\MEMORY.DMP\";$c=0;if(Test-Path $d){$s=(Get-Item $d).Length;$c+=$s;Remove-Item -Force $d -ErrorAction SilentlyContinue};$d2=\"$env:WINDIR\\Minidump\";if(Test-Path $d2){$s=(Get-ChildItem -Force $d2 -ErrorAction SilentlyContinue|Measure-Object -Property Length -Sum).Sum;$c+=$s;Remove-Item -Force \"$d2\\*\" -ErrorAction SilentlyContinue};Write-Host (\"[OK] \"+[math]::Round($c/1MB,1)+\" MB cleaned\")}catch{Write-Host (\"[ERR] \"+$_.Exception.Message)}",
}
var cleanupNamesES = map[string]string{"temp":"Archivos temporales","recycle":"Papelera","prefetch":"Archivos Prefetch","winupdate":"Cache Windows Update","thumbnails":"Cache miniaturas","dnscache":"Cache DNS","memorydump":"Volcados de memoria"}

func (a *App) CleanupRun(tasks []string, lang string) string {
	for _, id := range tasks {
		ps, ok := cleanupScripts[id]
		if !ok { continue }
		name := id
		if lang == "es" {
			if n, ok := cleanupNamesES[id]; ok { name = n }
		}
		a.emitLog(fmt.Sprintf("--- %s ---", name))
		cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", "[Console]::OutputEncoding = [Text.Encoding]::UTF8; "+ps)
		cmd.SysProcAttr = getSysProcAttr()
		out, err := cmd.CombinedOutput()
		if err != nil { a.emitLog(fmt.Sprintf("[ERR] %v", err)) }
		if len(out) > 0 { a.emitLog(strings.TrimSpace(string(out))) }
	}
	a.emitLog("=== Complete ===")
	return ""
}
