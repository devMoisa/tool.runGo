package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"brolinGo.software/internal/config"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx    context.Context
	config *config.Config
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	// Carrega configuração
	cfg, err := config.LoadConfig()
	if err != nil {
		// Se houver erro, usa configuração padrão
		cfg = &config.Config{}
	}
	a.config = cfg
}

// RunCode executes Go code and returns the output
func (a *App) RunCode(code string) string {
	// Create a temporary directory
	tmpDir, err := os.MkdirTemp("", "go-playground-*")
	if err != nil {
		return fmt.Sprintf("Error creating temp directory: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create the main.go file
	mainFile := filepath.Join(tmpDir, "main.go")
	if err := os.WriteFile(mainFile, []byte(code), 0644); err != nil {
		return fmt.Sprintf("Error writing code file: %v", err)
	}

	// Create go.mod file
	goModContent := `module playground

go 1.23
`
	goModFile := filepath.Join(tmpDir, "go.mod")
	if err := os.WriteFile(goModFile, []byte(goModContent), 0644); err != nil {
		return fmt.Sprintf("Error creating go.mod: %v", err)
	}

	// Run the Go code with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Determina o executável do Go
	goExec := a.getGoExecutable()
	if goExec == "" {
		return "Erro: Go não encontrado. Configure o caminho do Go nas configurações."
	}
	
	// First, check for compilation errors with go build
	buildCmd := exec.CommandContext(ctx, goExec, "build", "-o", "main", "main.go")
	buildCmd.Dir = tmpDir
	var buildStderr bytes.Buffer
	buildCmd.Stderr = &buildStderr
	
	buildStart := time.Now()
	buildErr := buildCmd.Run()
	buildTime := time.Since(buildStart)
	
	if buildErr != nil {
		// Compilation failed, return the error
		errOutput := buildStderr.String()
		errOutput = strings.ReplaceAll(errOutput, tmpDir+"/", "")
		return fmt.Sprintf("Compilation Error:\n%s", errOutput)
	}

	// Compilation successful, now run the program
	runCmd := exec.CommandContext(ctx, "./main")
	runCmd.Dir = tmpDir

	var stdout, stderr bytes.Buffer
	runCmd.Stdout = &stdout
	runCmd.Stderr = &stderr

	runStart := time.Now()
	err = runCmd.Run()
	runTime := time.Since(runStart)
	
	output := stdout.String()
	errOutput := stderr.String()

	// Build result message
	result := fmt.Sprintf("=== Build Success ===\nCompilation time: %v\nExecution time: %v\n\n=== Output ===\n", 
		buildTime.Round(time.Millisecond), 
		runTime.Round(time.Millisecond))
	
	if output != "" {
		result += output
	}
	
	if errOutput != "" {
		// Clean up error messages to remove temp paths
		errOutput = strings.ReplaceAll(errOutput, tmpDir+"/", "")
		result += "\n=== Errors ===\n" + errOutput
	}
	
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			result += "\n\nError: Code execution timed out (30 seconds limit)"
		} else if exitErr, ok := err.(*exec.ExitError); ok {
			result += fmt.Sprintf("\n\nProgram exited with code: %d", exitErr.ExitCode())
		}
	}

	if output == "" && errOutput == "" && err == nil {
		result += "Program executed successfully with no output."
	}

	return result
}

// FormatCode formats Go code using go fmt
func (a *App) FormatCode(code string) string {
	// Create a temporary directory
	tmpDir, err := os.MkdirTemp("", "go-format-*")
	if err != nil {
		return code // Return original code if we can't format
	}
	defer os.RemoveAll(tmpDir)

	// Create the main.go file
	mainFile := filepath.Join(tmpDir, "main.go")
	if err := os.WriteFile(mainFile, []byte(code), 0644); err != nil {
		return code // Return original code if we can't write
	}

	// Run go fmt with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Determina o executável do Go
	goExec := a.getGoExecutable()
	if goExec == "" {
		return code // Retorna código original se Go não estiver configurado
	}
	
	fmtCmd := exec.CommandContext(ctx, goExec, "fmt", mainFile)
	fmtCmd.Dir = tmpDir
	
	// Run the formatter
	if err := fmtCmd.Run(); err != nil {
		return code // Return original code if formatting fails
	}

	// Read the formatted code
	formattedCode, err := os.ReadFile(mainFile)
	if err != nil {
		return code // Return original code if we can't read formatted file
	}

	return string(formattedCode)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// CodeExample represents an example structure
type CodeExample struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Code        string   `json:"code"`
	Instruction string   `json:"instruction"`
	Tags        []string `json:"tags"`
}

// SelectWorkspaceFolder opens a folder picker dialog
func (a *App) SelectWorkspaceFolder() (string, error) {
	options := runtime.OpenDialogOptions{
		Title: "Selecionar Pasta do Workspace",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Pastas",
				Pattern:     "*",
			},
		},
	}
	
	result, err := runtime.OpenDirectoryDialog(a.ctx, options)
	if err != nil {
		return "", fmt.Errorf("error opening directory dialog: %v", err)
	}
	
	return result, nil
}

// LoadExamplesFromFolder loads examples from a custom folder
func (a *App) LoadExamplesFromFolder(folderPath string) ([]CodeExample, error) {
	var examples []CodeExample
	
	if folderPath == "" {
		return examples, fmt.Errorf("folder path is empty")
	}
	
	// Check if folder exists
	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		return examples, fmt.Errorf("folder does not exist: %s", folderPath)
	}
	
	// Read all JSON files in the folder
	files, err := filepath.Glob(filepath.Join(folderPath, "*.json"))
	if err != nil {
		return examples, fmt.Errorf("error reading folder: %v", err)
	}
	
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			continue // Skip files that can't be read
		}
		
		var example CodeExample
		if err := json.Unmarshal(data, &example); err != nil {
			continue // Skip files that aren't valid JSON
		}
		
		examples = append(examples, example)
	}
	
	return examples, nil
}

// SaveExampleToFolder saves an example to a custom folder
func (a *App) SaveExampleToFolder(folderPath string, example CodeExample) error {
	if folderPath == "" {
		return fmt.Errorf("folder path is empty")
	}
	
	// Ensure folder exists
	if err := os.MkdirAll(folderPath, 0755); err != nil {
		return fmt.Errorf("error creating folder: %v", err)
	}
	
	// Generate filename from ID
	filename := fmt.Sprintf("%s.json", example.ID)
	filePath := filepath.Join(folderPath, filename)
	
	// Marshal example to JSON with pretty printing
	data, err := json.MarshalIndent(example, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling JSON: %v", err)
	}
	
	// Write file
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("error writing file: %v", err)
	}
	
	return nil
}

// DeleteExampleFromFolder deletes an example from a custom folder
func (a *App) DeleteExampleFromFolder(folderPath, exampleID string) error {
	if folderPath == "" || exampleID == "" {
		return fmt.Errorf("folder path or example ID is empty")
	}
	
	filename := fmt.Sprintf("%s.json", exampleID)
	filePath := filepath.Join(folderPath, filename)
	
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("error deleting file: %v", err)
	}
	
	return nil
}

// getGoExecutable retorna o caminho do executável Go
func (a *App) getGoExecutable() string {
	// Primeiro tenta usar o path configurado
	if a.config != nil && a.config.GoPath != "" && config.ValidateGoPath(a.config.GoPath) {
		return a.config.GoPath
	}
	
	// Se não houver configuração, tenta detectar
	detectedPath := config.DetectGoPath()
	if detectedPath != "" {
		// Salva o path detectado para uso futuro
		if a.config != nil {
			a.config.GoPath = detectedPath
			config.SaveConfig(a.config)
		}
	}
	
	return detectedPath
}

// GetConfig retorna a configuração atual
func (a *App) GetConfig() (*config.Config, error) {
	if a.config == nil {
		cfg, err := config.LoadConfig()
		if err != nil {
			return nil, err
		}
		a.config = cfg
	}
	return a.config, nil
}

// SaveConfig salva a configuração
func (a *App) SaveConfig(goPath string) error {
	cfg := &config.Config{
		GoPath: goPath,
	}
	
	if err := config.SaveConfig(cfg); err != nil {
		return err
	}
	
	a.config = cfg
	return nil
}

// ValidateGoPath valida um caminho do Go
func (a *App) ValidateGoPath(goPath string) bool {
	return config.ValidateGoPath(goPath)
}

// DetectGoPath detecta o caminho do Go no sistema
func (a *App) DetectGoPath() string {
	return config.DetectGoPath()
}

// CreateWorkspaceTemplate creates template files for a new workspace
func (a *App) CreateWorkspaceTemplate(folderPath string) error {
	if folderPath == "" {
		return fmt.Errorf("folder path is empty")
	}
	
	// Ensure folder exists
	if err := os.MkdirAll(folderPath, 0755); err != nil {
		return fmt.Errorf("error creating folder: %v", err)
	}
	
	// Create a sample example
	example := CodeExample{
		ID:          "my-first-example",
		Title:       "Meu Primeiro Exemplo",
		Description: "Um exemplo customizado criado por você",
		Category:    "Meus Exemplos",
		Tags:        []string{"customizado", "exemplo", "meu"},
		Instruction: "# Meu Primeiro Exemplo\n\nEste é um exemplo que você pode editar e personalizar.\n\n## O que faz:\n- Imprime uma mensagem personalizada\n- Demonstra conceitos básicos de Go\n\n## Como usar:\n1. Execute o código\n2. Veja o resultado\n3. Modifique como quiser!",
		Code: `package main

import "fmt"

func main() {
    fmt.Println("Olá! Este é meu exemplo personalizado!")
    fmt.Println("Você pode editar este código como quiser.")
    
    name := "Desenvolvedor"
    fmt.Printf("Bem-vindo, %s!\\n", name)
}`,
	}
	
	return a.SaveExampleToFolder(folderPath, example)
}