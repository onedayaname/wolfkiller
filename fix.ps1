$lines = Get-Content "components/game/GamePlay.tsx"
$newLines = @()
$skipNext = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    if ($line -match 'variant="ghost"' -and $i + 2 -lt $lines.Count) {
        $nextLine = $lines[$i + 1]
        $nextNextLine = $lines[$i + 2]
        if ($nextLine -match 'size="sm"' -and $nextNextLine -match 'variant="outline"') {
            $newLines += $line -replace 'variant="ghost"', ''
            $newLines += $nextLine
            $newLines += $nextNextLine
            $i = $i + 2
            continue
        }
    }
    
    $newLines += $line
}

Set-Content "components/game/GamePlay.tsx" $newLines -Encoding UTF8
Write-Host "Fixed"
