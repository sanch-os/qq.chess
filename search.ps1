Select-String -Path 'app.js' -Pattern 'extraction|[Pp]reset' | Select-Object -First 40 | ForEach-Object {
    $lineNum = $_.LineNumber.ToString()
    $lineText = $_.Line
    "$lineNum : $lineText"
}
