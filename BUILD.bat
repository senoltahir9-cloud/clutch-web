@echo off
chcp 65001 >nul
title ClutchApp - Symlink Fix + Build
color 0A

cd /d "%~dp0"

echo.
echo  🔧 Symlink cache sorunu duzeltiliyor...
echo.
node -e "const fs=require('fs'),p=require('path'),base=p.join(process.env.LOCALAPPDATA,'electron-builder','Cache','winCodeSign');try{const dirs=fs.readdirSync(base).filter(f=>!f.endsWith('.7z'));dirs.forEach(d=>{const lib=p.join(base,d,'darwin','10.12','lib');fs.mkdirSync(lib,{recursive:true});try{fs.unlinkSync(p.join(lib,'libcrypto.dylib'))}catch(e){}try{fs.unlinkSync(p.join(lib,'libssl.dylib'))}catch(e){}fs.writeFileSync(p.join(lib,'libcrypto.dylib'),'x');fs.writeFileSync(p.join(lib,'libssl.dylib'),'x');console.log('Fixed: '+d)})}catch(e){console.log('Skip: '+e.message)}"

echo.
echo  🔨 Build baslatiliyor (portable .exe)...
echo  Bu islem 1-2 dakika surebilir...
echo.

set CSC_IDENTITY_AUTO_DISCOVERY=false
call npx electron-builder --win portable --x64 --config.win.signAndEditExecutable=false

if %errorlevel% neq 0 (
    echo.
    echo  ❌ Build basarisiz!
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║    ✅  BUILD TAMAMLANDI!                                 ║
echo ║                                                          ║
echo ║    dist\ klasorunde .exe dosyasi hazir!                  ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: exe'yi website klasorune kopyala
if exist "dist\*.exe" (
    for %%f in (dist\*.exe) do (
        copy /y "%%f" "clutch-website\ClutchApp-Setup.exe" >nul 2>&1
        echo  📦 %%f → clutch-website\ClutchApp-Setup.exe
    )
)

start "" "dist"
pause
