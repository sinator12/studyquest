@echo off
title StudyQuest Local Server
color 0b

:: Change drive and folder safely
if exist "%~dp0server.js" (
    cd /d "%~dp0"
    goto launch
)

D: 2>nul
cd "\STUDYQUEST" 2>nul
if exist "server.js" goto launch

pushd "D:\STUDYQUEST" 2>nul
if exist "server.js" goto launch

echo ========================================================
echo [ERROR] Could not navigate to STUDYQUEST folder!
echo Please make sure D:\STUDYQUEST exists.
echo ========================================================
pause
exit /b 1

:launch
echo ========================================================
echo         STARTING STUDYQUEST (PURE NODE.JS SERVER)
echo ========================================================
echo Folder: %CD%
echo.
echo [1/2] Opening browser at http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo [2/2] Running 'node server.js' ...
echo (No Vite needed! Keep this window open while using StudyQuest)
echo.
node server.js

if errorlevel 1 (
    echo.
    echo Node.js server exited. Press any key to close.
    pause >nul
)
