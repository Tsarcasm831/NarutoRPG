@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Change to the directory of this script (project root)
pushd "%~dp0"

REM ------------------------------------------------------------
REM Functions
REM ------------------------------------------------------------

:CheckPython
REM Try Python launcher first (preferred)
where py >nul 2>&1
if %ERRORLEVEL%==0 (
    py -3 -V >nul 2>&1
    if %ERRORLEVEL%==0 (
        set "PYCMD=py -3"
        goto :PythonReady
    )
)

REM Try plain python and verify it's version 3+
where python >nul 2>&1
if %ERRORLEVEL%==0 (
    python -c "import sys; sys.exit(0 if sys.version_info[0]>=3 else 1)" >nul 2>&1
    if %ERRORLEVEL%==0 (
        set "PYCMD=python"
        goto :PythonReady
    )
)

goto :InstallPython

:InstallPython
echo [Setup] Python 3 not found. Installing silently...

REM Try winget per-user (no admin required)
where winget >nul 2>&1
if %ERRORLEVEL%==0 (
    echo [Setup] Attempting winget install (user scope)...
    winget install -e --id Python.Python.3 --scope user --accept-source-agreements --accept-package-agreements --silent >nul 2>&1
    if %ERRORLEVEL%==0 goto :PostInstall

    echo [Setup] Winget user-scope failed. Trying machine scope...
    winget install -e --id Python.Python.3 --scope machine --accept-source-agreements --accept-package-agreements --silent >nul 2>&1
    if %ERRORLEVEL%==0 goto :PostInstall
)

REM Fallback: direct download from python.org (pinned version)
set "PY_VER=3.12.6"
set "PY_FILE=python-%PY_VER%.exe"
set "PY_URL_BASE=https://www.python.org/ftp/python/%PY_VER%"

REM Detect architecture for the correct installer
set "PY_ARCH_SUFFIX="
if /I "%PROCESSOR_ARCHITECTURE%"=="AMD64" set "PY_ARCH_SUFFIX=-amd64"
if /I "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "PY_ARCH_SUFFIX=-arm64"
if defined PROCESSOR_ARCHITEW6432 (
    if /I "%PROCESSOR_ARCHITEW6432%"=="AMD64" set "PY_ARCH_SUFFIX=-amd64"
    if /I "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "PY_ARCH_SUFFIX=-arm64"
)

if defined PY_ARCH_SUFFIX (
    set "PY_FILE=python-%PY_VER%%PY_ARCH_SUFFIX%.exe"
)

set "PY_TMP=%TEMP%\%PY_FILE%"

echo [Setup] Downloading %PY_FILE% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try{ Invoke-WebRequest -UseBasicParsing -Uri '%PY_URL_BASE%/%PY_FILE%' -OutFile '%PY_TMP%'; exit 0 }catch{ exit 1 }" >nul 2>&1
if not exist "%PY_TMP%" (
    echo [Error] Could not download Python installer.
    echo Please install Python 3 manually from https://www.python.org/downloads/
    goto :FailExit
)

echo [Setup] Running silent installer...
REM Try per-user first (no admin), then machine-wide
start /wait "" "%PY_TMP%" /quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1 SimpleInstall=1 >nul 2>&1
if not %ERRORLEVEL%==0 (
    start /wait "" "%PY_TMP%" /quiet InstallAllUsers=1 PrependPath=1 Include_launcher=1 SimpleInstall=1 >nul 2>&1
)

del /q "%PY_TMP%" >nul 2>&1

:PostInstall
REM Best-effort: add typical Python install dirs to PATH for this session
set "PYPATH="
for /d %%D in ("%LocalAppData%\Programs\Python\Python3*") do (
    set "PYPATH=%%~fD"
)
if not defined PYPATH (
    for /d %%D in ("%ProgramFiles%\Python3*") do (
        set "PYPATH=%%~fD"
    )
)
if defined PYPATH (
    set "PATH=!PYPATH!;!PYPATH!\Scripts;!PATH!"
)

REM Re-check availability
goto :CheckPython

:PythonReady
echo [OK] Using Python: %PYCMD%

REM ------------------------------------------------------------
REM Start server
REM ------------------------------------------------------------

REM Prefer custom server to set proper MIME types for .jsx/.mjs
if exist "serve.py" (
    start "Naruto RPG - Local Server" cmd /c "%PYCMD% serve.py"
) else (
    REM Fallback: Python's built-in server (may mislabel .jsx/.mjs)
    start "Naruto RPG - Local Server" cmd /c "%PYCMD% -m http.server 8000 --bind 127.0.0.1"
)

REM Small delay to let the server initialize
timeout /t 1 >nul 2>&1

REM Open the page in the default browser
start "" "http://127.0.0.1:8000/index.html"

goto :SuccessExit

:FailExit
popd
endlocal
exit /b 1

:SuccessExit
popd
endlocal
exit /b 0
