# update-local.ps1
# This script copies the current project files to your local Foundry VTT systems folder for testing.

$SystemId = "tams"
$FoundryDataPath = "$env:LOCALAPPDATA\FoundryVTT\Data\systems\$SystemId"

# You can override the path here if your Foundry data is elsewhere:
# $FoundryDataPath = "C:\Path\To\Your\FoundryData\Data\systems\$SystemId"

Write-Host "Updating local Foundry VTT system at: $FoundryDataPath" -ForegroundColor Cyan

if (!(Test-Path $FoundryDataPath)) {
    Write-Host "Destination path does not exist. Attempting to create: $FoundryDataPath" -ForegroundColor Yellow
    try {
        New-Item -ItemType Directory -Path $FoundryDataPath -Force -ErrorAction Stop | Out-Null
        Write-Host "Directory created successfully." -ForegroundColor Green
    } catch {
        Write-Host "FAILED to create directory. Please ensure your Foundry VTT data path is correct." -ForegroundColor Red
        Write-Host "Current target: $FoundryDataPath"
        Write-Host "You can edit this script to set the correct path manually if needed."
        exit 1
    }
}

# Define files and folders to exclude from copying
$ExcludeList = @(".git", ".idea", ".vscode", "update-local.ps1", ".gitignore", "README.md", "package.json", "package-lock.json", "index.js")

# 1. Cleanup previous botched updates (nested folders like scripts/scripts)
$Subfolders = @("lang", "scripts", "styles", "templates")
foreach ($folder in $Subfolders) {
    $NestedPath = Join-Path $FoundryDataPath $folder
    $NestedNestedPath = Join-Path $NestedPath $folder
    if (Test-Path $NestedNestedPath) {
        Write-Host "Cleaning up nested folder: $NestedNestedPath" -ForegroundColor Yellow
        Remove-Item -Path $NestedNestedPath -Recurse -Force
    }
}

# 2. Correct copy logic: Copy items to the root of the system folder
# We filter manually because -Exclude is unreliable for directories in some PS versions
Get-ChildItem -Path ".\" | Where-Object { $ExcludeList -notcontains $_.Name } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $FoundryDataPath -Recurse -Force
}

Write-Host "Local update complete! Restart Foundry VTT or Refresh (F5) to see changes." -ForegroundColor Green
