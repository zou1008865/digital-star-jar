@echo off
cd /d "%~dp0"
start "Digital Star Jar" cmd /k "npm run dev -- --host 127.0.0.1"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5173/"
