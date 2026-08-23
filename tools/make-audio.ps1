<#
    ============================================================
    Padi Tamil — recorded audio generator
    ------------------------------------------------------------
    Renders every letter, syllable, word and sentence the app uses
    into a .wav file, so the app never depends on the browser's
    speech engine being in the mood.

    YOU ONLY NEED THIS ONCE.

    Before running, install a Tamil voice:
      Settings -> Time & Language -> Speech -> Manage voices
      -> Add voices -> Tamil
    (On some builds it lives under Language & region -> Add a
     language -> Tamil -> tick "Text-to-speech".)
    Then sign out and back in, or reboot, so Windows registers it.

    Run:
      powershell -ExecutionPolicy Bypass -File tools\make-audio.ps1

    Useful switches:
      -List          show every voice Windows can see, then exit
      -SelfTest      render two English clips to prove the pipeline
                     works, without needing Tamil installed
      -Voice "name"  force a particular voice
      -Force         re-render clips that already exist
    ============================================================
#>
[CmdletBinding()]
param(
  [switch]$List,
  [switch]$SelfTest,
  [string]$Voice,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$root    = Split-Path -Parent $PSScriptRoot
$outDir  = Join-Path $root 'audio'
$listPath = Join-Path $PSScriptRoot 'audio-list.json'

# ---------- WinRT plumbing ----------
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($op, $type) {
  $m = $asTaskGeneric.MakeGenericMethod($type)
  $t = $m.Invoke($null, @($op))
  $t.Wait(-1) | Out-Null
  $t.Result
}

# ---------- voices ----------
$allVoices = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices

if ($List) {
  Write-Host ""
  Write-Host "Voices Windows can see:" -ForegroundColor Cyan
  foreach ($v in $allVoices) { "  {0,-34} {1}" -f $v.DisplayName, $v.Language }
  Write-Host ""
  Write-Host ("Tamil available: " + [bool]($allVoices | Where-Object { $_.Language -like 'ta*' }))
  exit 0
}

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer

if ($Voice) {
  $picked = $allVoices | Where-Object { $_.DisplayName -like "*$Voice*" } | Select-Object -First 1
  if (-not $picked) { throw "No voice matching '$Voice'. Run with -List to see what is installed." }
}
elseif ($SelfTest) {
  $picked = $allVoices | Select-Object -First 1
}
else {
  $picked = $allVoices | Where-Object { $_.Language -like 'ta*' } | Select-Object -First 1
  if (-not $picked) {
    Write-Host ""
    Write-Host "  No Tamil voice is installed, so there is nothing to record yet." -ForegroundColor Yellow
    Write-Host "  Install one:  Settings > Time & Language > Speech > Manage voices > Add voices > Tamil"
    Write-Host "  Then reboot and run this script again."
    Write-Host ""
    Write-Host "  (The app still works without it - it falls back to the browser's own"
    Write-Host "   speech engine, or stays silent if that has no Tamil either.)"
    Write-Host ""
    Write-Host "  To check the recording pipeline itself right now:  -SelfTest" -ForegroundColor Cyan
    Write-Host ""
    exit 1
  }
}
$synth.Voice = $picked
Write-Host ("Voice: {0}  ({1})" -f $picked.DisplayName, $picked.Language) -ForegroundColor Green

# ---------- what to render ----------
if ($SelfTest) {
  $items  = @('This is a test.', 'The recording pipeline works.')
  $outDir = Join-Path $PSScriptRoot 'selftest'
}
else {
  if (-not (Test-Path $listPath)) { throw "Missing $listPath" }
  $items = Get-Content $listPath -Raw -Encoding UTF8 | ConvertFrom-Json
}

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# ffmpeg is optional: if it is around we trim the silence the synthesiser
# leaves on each clip and store mp3 instead of wav (about 15x smaller)
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue)
$ext = if ($ff) { 'mp3' } else { 'wav' }
if ($ff) { Write-Host "ffmpeg found - trimming silence and encoding mp3" -ForegroundColor Green }
else     { Write-Host "ffmpeg not found - keeping full-size wav files" -ForegroundColor Yellow }
$trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,' +
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse'

# ---------- render ----------
$index = @{}
$n = 0; $made = 0; $skipped = 0
foreach ($text in $items) {
  $n++
  $name = ('{0:d4}.{1}' -f $n, $ext)
  $path = Join-Path $outDir $name
  $index[$text] = $name

  if ((Test-Path $path) -and -not $Force) { $skipped++; continue }

  # A bare consonant with the pulli has no vowel to carry it, so the stops
  # synthesise as near-silence. Tamil only uses them closing a syllable, so
  # record them there - the key stays the bare letter, only the spoken text
  # gains a leading vowel.
  $spoken = $text
  if ($text.Length -eq 2 -and $text[1] -eq [char]0x0BCD) { $spoken = [char]0x0B85 + $text }

  $stream = Await ($synth.SynthesizeTextToStreamAsync($spoken)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $size   = [uint32]$stream.Size
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  Await ($reader.LoadAsync($size)) ([uint32]) | Out-Null
  $bytes  = New-Object byte[] $size
  $reader.ReadBytes($bytes)
  $reader.Dispose(); $stream.Dispose()

  if ($ff) {
    $tmp = Join-Path $env:TEMP ('tp_' + [Guid]::NewGuid().ToString('N') + '.wav')
    [IO.File]::WriteAllBytes($tmp, $bytes)
    & ffmpeg -hide_banner -loglevel error -y -i $tmp -af $trim -ac 1 -ar 22050 -codec:a libmp3lame -b:a 48k $path
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  } else {
    [IO.File]::WriteAllBytes($path, $bytes)
  }
  $made++

  if ($n % 25 -eq 0) { Write-Host ("  {0} / {1}" -f $n, $items.Count) }
}

# ---------- manifest ----------
if (-not $SelfTest) {
  $json = $index | ConvertTo-Json -Compress
  [IO.File]::WriteAllText((Join-Path $outDir 'index.json'), $json, (New-Object Text.UTF8Encoding($false)))
}

$mb = [math]::Round((Get-ChildItem $outDir -Include *.wav,*.mp3 -Recurse | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host ""
Write-Host ("Done. {0} recorded, {1} already there. {2} MB in {3}" -f $made, $skipped, $mb, $outDir) -ForegroundColor Green
if ($SelfTest) {
  Write-Host "Self-test only - play tools\selftest\0001.wav to confirm, then delete that folder."
} else {
  Write-Host "Reload the app. It will pick the recordings up automatically."
}
Write-Host ""
