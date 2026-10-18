@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   === Installation de Claude Pet ===
echo.
where node >nul 2>nul || (
  echo   Node.js est introuvable. Installe-le depuis https://nodejs.org ^(version LTS^), puis relance ce fichier.
  pause & exit /b 1
)
echo   1/4  Telechargement d'Electron...
call npm install --no-fund --no-audit || (pause & exit /b 1)
echo   2/4  Branchement des hooks Claude Code...
call npm run hooks:install || (pause & exit /b 1)
echo   3/4  Lancement du pet...
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
timeout /t 3 /nobreak >nul
echo   4/4  Raccourci sur le Bureau...
call npm run shortcut
echo.
echo   C'est installe ! Le pet est en bas de ton ecran.
echo   La prochaine fois, double-clique sur "Claude Pet" sur le Bureau.
echo   Relance tes sessions Claude Code pour qu'elles parlent au pet.
echo.
pause
