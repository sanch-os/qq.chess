$files = @(
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/app.js'; path='app.js'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/index.html'; path='index.html'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/style.css'; path='style.css'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/chess-engine.js'; path='chess-engine.js'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/locales.js'; path='locales.js'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/piece-entity.js'; path='piece-entity.js'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/items-db.js'; path='items-db.js'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/run-manager.js'; path='run-manager.js'},
    @{url='https://raw.githubusercontent.com/sanch-os/qq.chess/main/chess-ai.js'; path='chess-ai.js'}
)

foreach ($f in $files) {
    try {
        $response = Invoke-WebRequest -Uri $f.url -UseBasicParsing
        [System.IO.File]::WriteAllBytes($f.path, $response.Content)
        Write-Host ('SAVED: ' + $f.path + ' (' + $response.Content.Length + ' bytes)')
    } catch {
        Write-Host ('FAILED: ' + $f.path + ' - ' + $_.Exception.Message)
    }
}
Write-Host 'ALL DONE'
