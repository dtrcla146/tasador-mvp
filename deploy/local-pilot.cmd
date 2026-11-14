@echo off
setlocal
cd /d "%~dp0\.."

if not exist ".venv\Scripts\activate.bat" (
    echo No se encontro .venv. Sigue primero los pasos de instalacion del README.
    exit /b 1
)
call ".venv\Scripts\activate.bat"
if errorlevel 1 exit /b 1

if not defined LOCALAPPDATA (
    echo No se encontro LOCALAPPDATA. Ejecuta este archivo desde Windows.
    exit /b 1
)

set "PILOT_DIR=%LOCALAPPDATA%\TasadorMVP-Pilot"
set "TASADOR_DATA_DIR=%PILOT_DIR%\data"
if not exist "%TASADOR_DATA_DIR%" mkdir "%TASADOR_DATA_DIR%"
if errorlevel 1 exit /b 1

set "PILOT_SECRET_FILE=%PILOT_DIR%\secret.key"
python -c "from pathlib import Path; import os, secrets; p=Path(os.environ['PILOT_SECRET_FILE']); p.write_text(secrets.token_hex(32), encoding='ascii') if not p.exists() else None"
if errorlevel 1 (
    echo No se pudo preparar la clave privada del piloto.
    exit /b 1
)
set /p "TASADOR_SECRET_KEY="<"%PILOT_SECRET_FILE%"
if not defined TASADOR_SECRET_KEY (
    echo El archivo privado de clave del piloto esta vacio.
    exit /b 1
)

set "TASADOR_ENV=production"
set "TASADOR_MAX_USERS=10"
set "TASADOR_CORS_ORIGINS="
set /p "TASADOR_CORS_ORIGINS=Escribe el origen HTTPS exacto de Vercel, por ejemplo https://tasador-mvp.vercel.app: "
if not defined TASADOR_CORS_ORIGINS (
    echo El origen HTTPS de Vercel es obligatorio.
    exit /b 1
)
python -c "import os, sys; from urllib.parse import urlparse; u=urlparse(os.environ['TASADOR_CORS_ORIGINS']); sys.exit(0 if u.scheme == 'https' and u.netloc and not u.path and not u.query and not u.fragment else 1)"
if errorlevel 1 (
    echo Escribe solo el origen HTTPS, sin ruta final, consulta ni fragmento.
    exit /b 1
)

if /I "%~1"=="invites" (
    if "%~2"=="" (
        echo Uso: deploy\local-pilot.cmd invites CANTIDAD
        exit /b 1
    )
    python -m backend.pilot_invites %~2
    if errorlevel 1 exit /b 1
    exit /b 0
)

if not "%~1"=="" (
    echo Uso: deploy\local-pilot.cmd
    echo Uso: deploy\local-pilot.cmd invites CANTIDAD
    exit /b 1
)

echo.
echo Datos del piloto: %TASADOR_DATA_DIR%
echo El backend quedara disponible solo en esta computadora.
echo Manten abierta esta ventana CMD mientras los usuarios prueban la aplicacion.
echo No cierres esta ventana para conservar la clave y la sesion del servidor.
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
