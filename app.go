package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"

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
