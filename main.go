package main

import (
	"embed"
	"log"
	"os"
	"os/exec"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func isAdmin() bool {
	_, err := os.Open("\\\\.\\PHYSICALDRIVE0")
	return err == nil
}

func main() {
	if !isAdmin() {
		exe, _ := os.Executable()
		cmd := exec.Command("powershell", "-Command", "Start-Process", "-FilePath", exe, "-Verb", "RunAs")
		cmd.Run()
		os.Exit(0)
	}

	app := NewApp()

	err := wails.Run(&options.App{
		Title:     "CodeWinOptimizer",
		Width:     1200,
		Height:    850,
		MinWidth:  800,
		MinHeight: 550,
		Frameless: true,
		Windows: &windows.Options{
			WebviewIsTransparent: false,
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
