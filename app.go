package main

import (
	"brolinGo.software/internal/app"
)

// App is a proxy to the internal app
type App = app.App

// NewApp creates a new App application struct
func NewApp() *App {
	return app.NewApp()
}