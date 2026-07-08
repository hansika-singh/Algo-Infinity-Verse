# PowerShell script to prepend design-tokens import to every CSS file
# Run from the repository root
Get-ChildItem -Path . -Recurse -Filter *.css | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -Raw $file
    $importLine = '@import "../styles/design-tokens.css";'
    if (-not $content.TrimStart().StartsWith($importLine)) {
        Set-Content -Path $file -Value ($importLine + "`n" + $content)
        Write-Host "Updated $file"
    }
}
