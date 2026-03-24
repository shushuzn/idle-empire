@echo off
chcp 65001 >nul
title Idle Empire - 挂机放置游戏
cd /d "%~dp0"

echo ========================================
echo    Idle Empire - 挂机放置游戏
echo ========================================
echo.
echo [INFO] 正在启动游戏...
echo.

REM 直接用默认浏览器打开index.html
start "" "%~dp0index.html"

echo [OK] 游戏已在浏览器中打开！
echo.
pause
