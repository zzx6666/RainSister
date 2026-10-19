# 根据页面实际使用的汉字与假名，截取并自托管 Noto Serif JP 的 900 字重子集。
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$fontDir = Join-Path $projectRoot "assets/fonts/noto-serif-jp"
$outputCss = Join-Path $projectRoot "src/noto-serif-jp.css"
New-Item -ItemType Directory -Path $fontDir -Force | Out-Null

$sourceText = @()
$sourceText += Get-Content -Raw (Join-Path $projectRoot "index.html")
$sourceText += Get-ChildItem (Join-Path $projectRoot "src") -Recurse -File -Include *.ts,*.css |
  ForEach-Object { Get-Content -Raw $_.FullName }
$text = $sourceText -join "`n"

$characters = [System.Collections.Generic.HashSet[int]]::new()
foreach ($character in $text.ToCharArray()) {
  $codePoint = [int][char]$character
  if ($codePoint -ge 0x3000) { [void]$characters.Add($codePoint) }
}

$headers = @{
  "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36"
}
$cssUrl = "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@900&display=swap"
$remoteCss = (Invoke-WebRequest -Uri $cssUrl -Headers $headers -TimeoutSec 30).Content
$blocks = [regex]::Matches($remoteCss, "@font-face\s*\{[^}]+\}")
$localRules = [System.Collections.Generic.List[string]]::new()
$downloaded = [System.Collections.Generic.HashSet[string]]::new()
$index = 0

foreach ($block in $blocks) {
  $rangeMatch = [regex]::Match($block.Value, "unicode-range:\s*([^;]+);")
  if (-not $rangeMatch.Success) { continue }
  $unicodeRange = $rangeMatch.Groups[1].Value
  $hit = $false

  foreach ($token in ($unicodeRange -split ",\s*")) {
    if ($token -match "^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$") {
      $start = [Convert]::ToInt32($matches[1], 16)
      $end = if ($matches[2]) { [Convert]::ToInt32($matches[2], 16) } else { $start }
      foreach ($character in $characters) {
        if ($character -ge $start -and $character -le $end) { $hit = $true; break }
      }
      if ($hit) { break }
    }
  }

  if (-not $hit) { continue }
  $url = [regex]::Match($block.Value, "url\((https://[^)]+)\)").Groups[1].Value
  if (-not $url) { continue }

  $fileName = "noto-serif-jp-900-{0:D3}.woff2" -f $index
  $filePath = Join-Path $fontDir $fileName
  if (-not $downloaded.Contains($url)) {
    Invoke-WebRequest -Uri $url -OutFile $filePath -TimeoutSec 30
    [void]$downloaded.Add($url)
  } else {
    $existing = Get-ChildItem $fontDir -Filter "*.woff2" | Where-Object { $_.Name -ne $fileName } | Select-Object -First 1
    if (-not $existing) { continue }
    $fileName = $existing.Name
  }

  $localRules.Add(@"
@font-face {
  font-family: "Noto Serif JP";
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url("../assets/fonts/noto-serif-jp/$fileName") format("woff2");
  unicode-range: $unicodeRange;
}
"@)
  $index += 1
}

$header = "/* 由 scripts/build-noto-font.ps1 生成，仅包含页面实际使用的字符子集。 */`n"
Set-Content -Path $outputCss -Value ($header + ($localRules -join "`n")) -Encoding utf8NoBOM
Write-Output "生成 $($localRules.Count) 个字体子集：$outputCss"
