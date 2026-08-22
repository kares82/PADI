@echo off
REM ============================================================
REM  Padi Tamil - double-click this file to open the app properly.
REM  It starts a tiny local web server and opens your browser.
REM  Close this black window when you are done.
REM ============================================================
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:5177/
  echo.
  echo   Padi Tamil is running at  http://localhost:5177/
  echo   Keep this window open while you use the app.
  echo.
  python -m http.server 5177
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:5177/
  echo.
  echo   Padi Tamil is running at  http://localhost:5177/
  echo   Keep this window open while you use the app.
  echo.
  py -m http.server 5177
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:5177/
  npx --yes serve -l 5177 .
  goto :eof
)

echo.
echo   Python and Node were not found on this computer.
echo   No problem - just double-click  index.html  instead.
echo   Everything works except offline install.
echo.
start "" "index.html"
pause
