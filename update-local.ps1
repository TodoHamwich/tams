# update-local.ps1
# This script copies the current project files to your local Foundry VTT systems folder for testing.

$SystemId = "tams"
$FoundryDataPath = "$env:LOCALAPPDATA\FoundryVTT\Data\systems\$SystemId"

# You can override the path here if your Foundry data is elsewhere:
# $FoundryDataPath = "C:\Path\To\Your\FoundryData\Data\systems\$SystemId"

Write-Host "Updating local Foundry VTT system at: $FoundryDataPath" -ForegroundColor Cyan

if (!(Test-Path $FoundryDataPath)) {
    Write-Host "Creating directory..."
    New-Item -ItemType Directory -Path $FoundryDataPath -Force | Out-Null
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
