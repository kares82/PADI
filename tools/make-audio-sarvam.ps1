<#
    ============================================================
    Padi Tamil — recorded audio, via Sarvam Bulbul
    ------------------------------------------------------------
    Renders every letter, syllable, word and sentence the app uses
    into audio/NNNN.mp3, exactly like tools/make-audio.ps1, but with
    a voice worth learning from.

    YOU ONLY NEED THIS ONCE. The app never calls the API at runtime,
    so once the files exist the account can sit idle or be closed.

    ------------------------------------------------------------
    BEFORE YOU RUN IT

    1. Get a key at sarvam.ai, then:
         $env:SARVAM_API_KEY = "your-key"
       or pass -Key "your-key".

    2. Pick a voice first. Do not record 627 clips with a voice you
       have not heard:
         .\tools\make-audio-sarvam.ps1 -Sample
       That renders the same eight items in every speaker into
       tools\sample\, costs a few paise, and takes a minute. Listen,
       then re-run with -Speaker <name>.

    3. If Padi Tamil is going to be a paid app, buy credits before
       recording. Sarvam's terms say output produced on a free or
       trial basis may be restricted to non-commercial use, and the
       whole run costs about fifteen rupees, so do not save the
       fifteen rupees and inherit the restriction.

    ------------------------------------------------------------
    THE ONE RULE

    Clips are numbered by position in tools\audio-list.json and this
    script skips files that already exist. Append to that list, never
    insert or reorder, or every existing recording silently ends up
    attached to different text. -Force re-records everything, which
    is the safe thing to do after any list surgery.
    ============================================================
#>
[CmdletBinding()]
param(
  [string]$Key      = $env:SARVAM_API_KEY,
  [string]$Speaker  = 'anushka',
  [string]$Model    = 'bulbul:v3',
  [double]$Pace     = 1.0,
  [int]$SampleRate  = 22050,
  [switch]$Sample,
  [switch]$Force,
  [switch]$Estimate
)

$ErrorActionPreference = 'Stop'
$root     = Split-Path -Parent $PSScriptRoot
$outDir   = Join-Path $root 'audio'
$listPath = Join-Path $PSScriptRoot 'audio-list.json'
$endpoint = 'https://api.sarvam.ai/text-to-speech'

if (-not (Test-Path $listPath)) { throw "Missing $listPath" }
$items = Get-Content $listPath -Raw -Encoding UTF8 | ConvertFrom-Json

# ---------- what this will cost ----------
$chars = ($items | ForEach-Object { $_.Length } | Measure-Object -Sum).Sum
$rupees = [math]::Round($chars / 1000.0 * 3.0, 2)
Write-Host ""
Write-Host ("{0} items, {1} characters. At Rs 3.00 per 1,000 characters that is about Rs {2}." -f $items.Count, $chars, $rupees) -ForegroundColor Cyan
Write-Host ""
if ($Estimate) { exit 0 }

if (-not $Key) {
  Write-Host "  No API key. Set `$env:SARVAM_API_KEY, or pass -Key." -ForegroundColor Yellow
  Write-Host "  -Estimate shows the cost without needing one."
  exit 1
}

# ---------- one request ----------
function Get-Clip {
  param([string]$Text, [string]$Voice)

  # bulbul:v3 takes up to 2500 characters; the longest thing this app
  # says is a Kural couplet at 72, so one item is always one request.
  $body = @{
    text                = $Text
    language_code       = 'ta-IN'
    model               = $Model
    speaker             = $Voice
    pace                = $Pace
    speech_sample_rate  = $SampleRate
    output_audio_codec  = 'mp3'
  } | ConvertTo-Json -Compress

  # ConvertTo-Json escapes non-ASCII to \uXXXX, which is valid JSON and
  # survives the trip, but the body must go out as UTF-8 bytes either way.
  $bytes = [Text.Encoding]::UTF8.GetBytes($body)

  $attempt = 0
  while ($true) {
    $attempt++
    try {
      $res = Invoke-RestMethod -Uri $endpoint -Method Post -Body $bytes `
        -ContentType 'application/json' `
        -Headers @{ 'api-subscription-key' = $Key }
      if (-not $res.audios -or $res.audios.Count -lt 1) { throw 'response carried no audio' }
      return [Convert]::FromBase64String($res.audios[0])
    }
    catch {
      # Rate limits and blips are worth retrying; a bad key or bad request
      # is not, and retrying it just burns time.
      $code = $null
      if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
      $retryable = ($code -eq 429) -or ($code -ge 500) -or ($null -eq $code)
      if (-not $retryable -or $attempt -ge 5) {
        throw ("'{0}' failed{1}: {2}" -f $Text, $(if ($code) { " (HTTP $code)" } else { '' }), $_.Exception.Message)
      }
      Start-Sleep -Seconds ([math]::Min(30, [math]::Pow(2, $attempt)))
    }
  }
}

# ---------- listen before you commit ----------
if ($Sample) {
  # Bulbul speaks Tamil in any of its voices; which one suits a teaching
  # app is a matter of taste, so this renders the same eight items - a
  # vowel, the plosives that the Windows voice mangled, a word and a
  # sentence - in each, and you pick.
  $voices = @('anushka','abhilash','manisha','vidya','arya','karun','hitesh')
  $probe  = @(
    [char]0x0B85,                                   # a
    [char]0x0B95,                                   # ka  - the one that broke
    [char]0x0B9A + [char]0x0BBF,                    # chi - the off-pitch one
    [char]0x0B95 + [char]0x0BCD,                    # k   - bare consonant
    [char]0x0BB4,                                   # zh  - the hard one
    [char]0x0B85 + [char]0xBAE + [char]0x0BCD + [char]0x0BAE + [char]0x0BBE,
    [char]0x0BA4 + [char]0x0BAE + [char]0x0BBF + [char]0x0BB4 + [char]0x0BCD,
    'வணக்கம்'
  )
  $sampleDir = Join-Path $PSScriptRoot 'sample'
  if (-not (Test-Path $sampleDir)) { New-Item -ItemType Directory -Path $sampleDir | Out-Null }
  foreach ($v in $voices) {
    $i = 0
    foreach ($t in $probe) {
      $i++
      try {
        $b = Get-Clip -Text $t -Voice $v
        [IO.File]::WriteAllBytes((Join-Path $sampleDir ("{0}_{1:d2}.mp3" -f $v, $i)), $b)
      } catch {
        Write-Host ("  {0}: {1}" -f $v, $_.Exception.Message) -ForegroundColor Yellow
        break
      }
    }
    Write-Host ("  {0} done" -f $v) -ForegroundColor Green
  }
  Write-Host ""
  Write-Host "Listen to tools\sample\, then run again with -Speaker <name>." -ForegroundColor Cyan
  Write-Host "Delete that folder afterwards - it is not part of the app."
  exit 0
}

# ---------- record ----------
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Sarvam returns mp3 already, so ffmpeg is only used to shave the silence
# off each end. Without it the clips still work, they just sit longer
# before they speak.
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue)
if ($ff) { Write-Host "ffmpeg found - trimming silence" -ForegroundColor Green }
else     { Write-Host "ffmpeg not found - keeping the clips untrimmed" -ForegroundColor Yellow }
$trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,' +
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse'

Write-Host ("Voice: {0}  model {1}  pace {2}" -f $Speaker, $Model, $Pace) -ForegroundColor Green

$index = @{}
$n = 0; $made = 0; $skipped = 0; $failed = @()
foreach ($text in $items) {
  $n++
  $name = ('{0:d4}.mp3' -f $n)
  $path = Join-Path $outDir $name
  $index[$text] = $name

  if ((Test-Path $path) -and -not $Force) { $skipped++; continue }

  # A bare consonant carrying the pulli has no vowel, so on its own it is
  # near-silence. Tamil only ever uses these closing a syllable, so record
  # them there. The manifest key stays the bare letter; only the text handed
  # to the synthesiser gains the leading vowel.
  $spoken = $text
  if ($text.Length -eq 2 -and $text[1] -eq [char]0x0BCD) { $spoken = [char]0x0B85 + $text }

  try { $bytes = Get-Clip -Text $spoken -Voice $Speaker }
  catch { $failed += $text; Write-Host ("  ! {0}" -f $_.Exception.Message) -ForegroundColor Red; continue }

  if ($ff) {
    $tmp = Join-Path $env:TEMP ('sv_' + [Guid]::NewGuid().ToString('N') + '.mp3')
    [IO.File]::WriteAllBytes($tmp, $bytes)
    & ffmpeg -hide_banner -loglevel error -y -i $tmp -af $trim -ac 1 -codec:a libmp3lame -b:a 48k $path
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $path)) { [IO.File]::WriteAllBytes($path, $bytes) }
  } else {
    [IO.File]::WriteAllBytes($path, $bytes)
  }
  $made++
  if ($n % 25 -eq 0) { Write-Host ("  {0} / {1}" -f $n, $items.Count) }
}

# ---------- manifest ----------
# Written last and from the full list, so it always describes every item,
# including the ones that were skipped because they already existed.
$json = $index | ConvertTo-Json -Compress
[IO.File]::WriteAllText((Join-Path $outDir 'index.json'), $json, (New-Object Text.UTF8Encoding($false)))

$mb = [math]::Round((Get-ChildItem $outDir -Filter *.mp3 | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host ""
Write-Host ("Done. {0} recorded, {1} already there, {2} failed. {3} MB in {4}" -f $made, $skipped, $failed.Count, $mb, $outDir) -ForegroundColor Green
if ($failed.Count) {
  Write-Host "Failed items (re-run to retry - existing files are skipped):" -ForegroundColor Yellow
  $failed | ForEach-Object { Write-Host ("  {0}" -f $_) }
}
Write-Host ""
Write-Host "Now check them:  python tools\check-audio.py" -ForegroundColor Cyan
Write-Host "Then turn the voice back on: VOICE = true at the top of app\engine.js" -ForegroundColor Cyan
Write-Host ""
