# JIGRI Runner Image Build Script (PowerShell)
Write-Host "🚀 Building JIGRI Docker Runner Images..." -ForegroundColor Cyan

$runners = @(
    @{ Name = "jigri-runner-python:latest"; Path = "docker/runners/python" },
    @{ Name = "jigri-runner-node:latest"; Path = "docker/runners/node" },
    @{ Name = "jigri-runner-cpp:latest"; Path = "docker/runners/cpp" },
    @{ Name = "jigri-runner-java:latest"; Path = "docker/runners/java" },
    @{ Name = "jigri-runner-go:latest"; Path = "docker/runners/go" },
    @{ Name = "jigri-runner-ruby:latest"; Path = "docker/runners/ruby" },
    @{ Name = "jigri-runner-php:latest"; Path = "docker/runners/php" },
    @{ Name = "jigri-runner-rust:latest"; Path = "docker/runners/rust" },
    @{ Name = "jigri-notebook-python:latest"; Path = "docker/notebook-python" }
)

foreach ($runner in $runners) {
    Write-Host "📦 Building $($runner.Name)..." -ForegroundColor Yellow
    docker build -t $runner.Name $runner.Path
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build $($runner.Name)" -ForegroundColor Red
    } else {
        Write-Host "✅ Built $($runner.Name)" -ForegroundColor Green
    }
}

Write-Host "🎉 All runner images built successfully!" -ForegroundColor Cyan
