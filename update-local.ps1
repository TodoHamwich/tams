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

# Copy contents
Get-ChildItem -Path ".\" -Exclude $ExcludeList | ForEach-Object {
    $Dest = Join-Path $FoundryDataPath $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $Dest -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $Dest -Force
    }
}

Write-Host "Local update complete! Restart Foundry VTT or Refresh (F5) to see changes." -ForegroundColor Green
