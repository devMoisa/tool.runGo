package config

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type Config struct {
	GoPath string `json:"goPath"`
}

func GetConfigPath() (string, error) {
	var configDir string
	
	switch runtime.GOOS {
	case "windows":
		configDir = os.Getenv("APPDATA")
	case "darwin":
		configDir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support")
	default: // Linux and others
		configDir = filepath.Join(os.Getenv("HOME"), ".config")
	}
	
	appConfigDir := filepath.Join(configDir, "brolinGo")
	if err := os.MkdirAll(appConfigDir, 0755); err != nil {
		return "", err
	}
	
	return filepath.Join(appConfigDir, "config.json"), nil
}

func LoadConfig() (*Config, error) {
	configPath, err := GetConfigPath()
	if err != nil {
		return nil, err
	}
	
	config := &Config{}
	
	// Se o arquivo não existir, retorna config padrão
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Tenta detectar o Go automaticamente
		config.GoPath = DetectGoPath()
		return config, nil
	}
	
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}
	
	if err := json.Unmarshal(data, config); err != nil {
		return nil, err
	}
	
	// Se GoPath estiver vazio, tenta detectar
	if config.GoPath == "" {
		config.GoPath = DetectGoPath()
	}
	
	return config, nil
}

func SaveConfig(config *Config) error {
	configPath, err := GetConfigPath()
	if err != nil {
		return err
	}
	
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	
	return os.WriteFile(configPath, data, 0644)
}

func DetectGoPath() string {
	// Tenta encontrar o Go no PATH do sistema
	if path, err := exec.LookPath("go"); err == nil {
		return path
	}
	
	// Tenta locais comuns de instalação
	commonPaths := []string{
		"/usr/local/go/bin/go",
		"/usr/bin/go",
		"/opt/homebrew/bin/go",
		"C:\\Program Files\\Go\\bin\\go.exe",
		"C:\\go\\bin\\go.exe",
	}
	
	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	
	return ""
}

func ValidateGoPath(goPath string) bool {
	if goPath == "" {
		return false
	}
	
	// Verifica se o arquivo existe
	if _, err := os.Stat(goPath); err != nil {
		return false
	}
	
	// Tenta executar "go version" para verificar se é um executável Go válido
	cmd := exec.Command(goPath, "version")
	if err := cmd.Run(); err != nil {
		return false
	}
	
	return true
}