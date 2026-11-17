@echo off
title StudyQuest Local Server
color 0b
echo ========================================================
echo              STARTING STUDYQUEST LOCALHOST
echo ========================================================
echo.
cd /d "D:\STUDYQUEST"

echo [1/2] Launching your browser to http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo [2/2] Running 'npm run dev' ...
echo (Keep this window open while playing or developing)
echo.
call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Vite server stopped or failed. Press any key to close.
    pause >nul
)
