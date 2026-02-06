@echo off
REM Windows Cleanup Script for Next.js Dev Server Issues
REM This script fixes lock file and port conflicts

echo ================================================
echo Next.js Dev Server Cleanup for Windows
echo ================================================
echo.

echo [1/4] Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Node processes terminated
) else (
    echo    ℹ No Node processes found
)

echo.
echo [2/4] Waiting for processes to fully terminate...
timeout /t 2 /nobreak >nul
echo    ✓ Wait complete

echo.
echo [3/4] Removing .next lock file...
if exist ".next\dev\lock" (
    del /F /Q ".next\dev\lock" >nul 2>&1
    echo    ✓ Lock file removed
) else (
    echo    ℹ Lock file doesn't exist (already clean)
)

echo.
echo [4/4] Cleaning stale .next cache (optional)...
set /p cleanup="Remove entire .next folder for fresh start? (y/N): "
if /i "%cleanup%"=="y" (
    if exist ".next" (
        rd /S /Q ".next" >nul 2>&1
        echo    ✓ .next folder removed
    )
) else (
    echo    ℹ Skipped .next folder cleanup
)

echo.
echo ================================================
echo Cleanup Complete!
echo ================================================
echo.
echo You can now run: npm run dev
echo.
pause
