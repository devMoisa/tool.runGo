.PHONY: build dev clean run

# Build the application
build:
	@echo "Building..."
	@go build -o build/brolinGo ./cmd/app

# Build with Wails
wails-build:
	@echo "Building with Wails..."
	@go build -tags desktop,production -ldflags "-w -s" -o build/brolinGo ./cmd/app

# Development mode
dev:
	@echo "Starting development server..."
	@wails dev -s ./cmd/app

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf build/
	@rm -rf frontend/dist/

# Run the application
run: build
	@echo "Running..."
	@./build/brolinGo