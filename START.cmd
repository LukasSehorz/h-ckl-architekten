@echo off
title Haeckl Architekten - Vorschau
cd /d "%~dp0site"
echo.
echo   Haeckl Architekten - lokale Vorschau
echo   -----------------------------------
echo   Server startet auf http://localhost:8899
echo   Fenster offen lassen. Zum Beenden: Strg+C
echo.
start "" http://localhost:8899
npx --yes http-server -p 8899 -c-1
