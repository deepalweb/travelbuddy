# Build Performance Monitor
# This script tracks build metrics for production deployments

# Create build metrics directory
if (!(Test-Path "build-metrics")) {
    New-Item -ItemType Directory -Name "build-metrics"
}

# Get current timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$buildDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"

# Analyze build output
Write-Host "📊 Analyzing build performance..."

$buildStats = @{
    timestamp = $buildDate
    totalSize = 0
    chunkCount = 0
    cssSize = 0
    jsSize = 0
    imageSize = 0
    chunks = @()
}

if (Test-Path "dist") {
    # Calculate total build size
    $buildStats.totalSize = (Get-ChildItem -Path "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum
    
    # Count chunks and categorize files
    Get-ChildItem -Path "dist" -Recurse -File | ForEach-Object {
        $extension = $_.Extension.ToLower()
        $size = $_.Length
        
        switch ($extension) {
            ".js" { 
                $buildStats.jsSize += $size
                $buildStats.chunkCount++
                $buildStats.chunks += @{
                    name = $_.Name
                    size = $size
                    type = "javascript"
                }
            }
            ".css" { 
                $buildStats.cssSize += $size 
                $buildStats.chunks += @{
                    name = $_.Name
                    size = $size
                    type = "stylesheet"
                }
            }
            {$_ -in ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"} { 
                $buildStats.imageSize += $size 
            }
        }
    }
    
    # Convert bytes to KB
    $totalKB = [math]::Round($buildStats.totalSize / 1KB, 2)
    $jsKB = [math]::Round($buildStats.jsSize / 1KB, 2)
    $cssKB = [math]::Round($buildStats.cssSize / 1KB, 2)
    $imageKB = [math]::Round($buildStats.imageSize / 1KB, 2)
    
    Write-Host ""
    Write-Host "🎯 Build Performance Summary:" -ForegroundColor Green
    Write-Host "----------------------------------------"
    Write-Host "Total Bundle Size: $totalKB KB"
    Write-Host "JavaScript: $jsKB KB ($($buildStats.chunkCount) chunks)"
    Write-Host "CSS: $cssKB KB"
    Write-Host "Images: $imageKB KB"
    Write-Host ""
    
    # Performance recommendations
    if ($totalKB -gt 3000) {
        Write-Host "⚠️  Large bundle detected! Consider code splitting." -ForegroundColor Yellow
    } elseif ($totalKB -lt 1000) {
        Write-Host "✅ Excellent bundle size!" -ForegroundColor Green
    } else {
        Write-Host "✅ Good bundle size." -ForegroundColor Green
    }
    
    if ($buildStats.chunkCount -gt 20) {
        Write-Host "ℹ️  Many chunks detected - this can improve caching." -ForegroundColor Cyan
    }
    
    # Save metrics to file
    $metricsFile = "build-metrics/build-$timestamp.json"
    $buildStats | ConvertTo-Json -Depth 3 | Out-File -FilePath $metricsFile -Encoding UTF8
    
    Write-Host ""
    Write-Host "📈 Metrics saved to: $metricsFile" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ No dist folder found!" -ForegroundColor Red
    exit 1
}

# Exit with success
Write-Host "✅ Build analysis complete!" -ForegroundColor Green
