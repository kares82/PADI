<#
    ============================================================
    Padi Tamil — recorded audio via Google Cloud Text-to-Speech
    ------------------------------------------------------------
    Renders every letter, syllable, word and sentence the app uses
    into an mp3, ONCE, on your machine. The app then plays those
    files. No key is ever shipped, nothing is called at runtime,
    and it all still works offline.

    WHY NOT CALL THE API FROM THE APP ITSELF
      Padi Tamil is a static site in a public repository. Any key
      placed in the page is readable by anyone who opens it, and
      the charges land on your card. Runtime calls would also break
      offline use and add a delay to every tap. The app says the
      same 319 things forever, so synthesising them once is both
      safer and better.

    WHAT IT COSTS
      The whole corpus is about 5,000 characters. Google's free
      tier each month is 1,000,000 characters for the high quality
      voices and 4,000,000 for standard - so a full run uses about
      half of one percent of the free allowance. In practice: zero.
      Google does still require a billing account on file to enable
      the API, which is the only real catch.

    SETUP (once)
      1. console.cloud.google.com  ->  create a project
      2. Enable "Cloud Text-to-Speech API" for it
      3. APIs & Services -> Credentials -> Create API key
      4. Restrict the key to the Text-to-Speech API (recommended)

    RUN
      $env:GOOGLE_TTS_KEY = "your-key-here"
      powershell -ExecutionPolicy Bypass -File tools\make-audio-google.ps1 -List
      powershell -ExecutionPolicy Bypass -File tools\make-audio-google.ps1 -Sample
      powershell -ExecutionPolicy Bypass -File tools\make-audio-google.ps1

    SWITCHES
      -List     show every Tamil voice Google offers, then exit
      -Sample   render 8 clips only, so you can listen before
                committing to the full run
      -Voice    force a specific voice name from -List
      -Rate     speaking rate, default 0.85 (a little slow, on
                purpose - this is for learners)
      -Force    re-render clips that already exist
    ============================================================
#>
[CmdletBinding()]
param(
  [switch]$List,
  [switch]$Sample,
  [string]$Voice,
  [double]$Rate = 0.85,
  [switch]$Force,
  [string]$Key = $env:GOOGLE_TTS_KEY
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root     = Split-Path -Parent $PSScriptRoot
$outDir   = Join-Path $root 'audio'
$listPath = Join-Path $PSScriptRoot 'audio-list.json'
$api      = 'https://texttospeech.googleapis.com/v1'

if (-not $Key) {
  Write-Host ""
  Write-Host "  No API key." -ForegroundColor Yellow
  Write-Host "  Set one for this session, then run again:"
  Write-Host ""
  Write-Host '      $env:GOOGLE_TTS_KEY = "AIza..."' -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  Get one at console.cloud.google.com -> APIs & Services -> Credentials,"
  Write-Host "  after enabling the Cloud Text-to-Speech API for your project."
  Write-Host ""
  Write-Host "  The key stays in your shell. It is never written to a file and never"
  Write-Host "  reaches the app." -ForegroundColor Green
  Write-Host ""
  exit 1
}

# ---------------- which voices exist ----------------
try {
  $voices = (Invoke-RestMethod -Method Get -Uri "$api/voices?languageCode=ta-IN&key=$Key").voices
} catch {
  Write-Host ""
  Write-Host "  Could not reach the Text-to-Speech API." -ForegroundColor Red
  Write-Host "  $($_.Exception.Message)"
  Write-Host ""
  Write-Host "  Most often this means the API is not enabled on the project, or the"
  Write-Host "  key is restricted to a different API. Check both in the console."
  Write-Host ""
  exit 1
}

if (-not $voices) { throw "Google returned no ta-IN voices." }

# prefer the better engines, and a female voice for clarity at low rates
function Rank($n) {
  if ($n -match 'Chirp')    { return 0 }
  if ($n -match 'Neural2')  { return 1 }
  if ($n -match 'Wavenet')  { return 2 }
  return 3
}
$sorted = $voices | Sort-Object @{ Expression = { Rank $_.name } }, name

if ($List) {
  Write-Host ""
  Write-Host "Tamil voices Google offers:" -ForegroundColor Cyan
  foreach ($v in $sorted) {
    "  {0,-28} {1,-8} {2} Hz" -f $v.name, $v.ssmlGender, $v.naturalSampleRateHertz
  }
  Write-Host ""
  Write-Host ("Default choice: " + $sorted[0].name) -ForegroundColor Green
  Write-Host ""
  exit 0
}

$picked = if ($Voice) {
  $m = $sorted | Where-Object { $_.name -eq $Voice -or $_.name -like "*$Voice*" } | Select-Object -First 1
  if (-not $m) { throw "No ta-IN voice matching '$Voice'. Run with -List." }
  $m
} else { $sorted[0] }

Write-Host ("Voice: {0}  ({1}, rate {2})" -f $picked.name, $picked.ssmlGender, $Rate) -ForegroundColor Green

# ---------------- what to say ----------------
if (-not (Test-Path $listPath)) { throw "Missing $listPath" }
$items = Get-Content $listPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($Sample) {
  $items = @($items[0], $items[1], $items[12], $items[25], $items[40],
             $items[$items.Count-1], $items[$items.Count-2], $items[$items.Count-3])
  $outDir = Join-Path $PSScriptRoot 'sample'
  Write-Host "Sample run: 8 clips into tools\sample" -ForegroundColor Cyan
}
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# ---------------- render ----------------
$utf8 = New-Object Text.UTF8Encoding($false)
$index = @{}
$n = 0; $made = 0; $skipped = 0; $chars = 0

foreach ($text in $items) {
  $n++
  $name = '{0:d4}.mp3' -f $n
  $path = Join-Path $outDir $name
  $index[$text] = $name

  if ((Test-Path $path) -and -not $Force) { $skipped++; continue }

  $body = @{
    input       = @{ text = $text }
    voice       = @{ languageCode = 'ta-IN'; name = $picked.name }
    audioConfig = @{ audioEncoding = 'MP3'; speakingRate = $Rate }
  } | ConvertTo-Json -Depth 5 -Compress

  $bytes = $utf8.GetBytes($body)     # Tamil must go out as UTF-8, not ANSI

  $ok = $false
  for ($try = 1; $try -le 3 -and -not $ok; $try++) {
    try {
      $res = Invoke-RestMethod -Method Post -Uri "$api/text:synthesize?key=$Key" `
               -ContentType 'application/json; charset=utf-8' -Body $bytes
      [IO.File]::WriteAllBytes($path, [Convert]::FromBase64String($res.audioContent))
      $ok = $true; $made++; $chars += $text.Length
    } catch {
      if ($try -eq 3) { throw "Failed on '$text': $($_.Exception.Message)" }
      Start-Sleep -Milliseconds (250 * $try)
    }
  }

  if ($n % 25 -eq 0) { Write-Host ("  {0} / {1}" -f $n, $items.Count) }
}

# ---------------- manifest ----------------
if (-not $Sample) {
  [IO.File]::WriteAllText((Join-Path $outDir 'index.json'),
                          ($index | ConvertTo-Json -Compress), $utf8)
}

$mb = [math]::Round((Get-ChildItem $outDir -Filter *.mp3 | Measure-Object Length -Sum).Sum / 1MB, 2)
Write-Host ""
Write-Host ("Done. {0} recorded, {1} already there. {2} MB, {3} characters billed." -f `
            $made, $skipped, $mb, $chars) -ForegroundColor Green

if ($Sample) {
  Write-Host ""
  Write-Host "Listen to tools\sample\*.mp3. If the pronunciation is good, run without"
  Write-Host "-Sample for the full set. Try -Voice with another name from -List if not."
  Write-Host ""
} else {
  Write-Host ""
  Write-Host "Reload the app locally to hear it, then publish:" -ForegroundColor Cyan
  Write-Host "    git add audio"
  Write-Host '    git commit -m "Add recorded Tamil audio"'
  Write-Host "    git push"
  Write-Host ""
}
