@echo off
REM ============================================================
REM  Bubble Blaster — Android .aab Build Script
REM  Run this from the project root folder in CMD:
REM    build_android.bat
REM ============================================================

SETLOCAL ENABLEDELAYEDEXPANSION
SET PROJECT_DIR=%~dp0
SET APP_ID=com.yourname.bubbleblaster
SET APP_NAME=Bubble Blaster
SET KEYSTORE_NAME=bubble-blaster-release.jks
SET KEY_ALIAS=bubble-blaster

echo.
echo ================================================
echo   Bubble Blaster - Android AAB Build Script
echo ================================================
echo.

REM --- Step 1: Check prerequisites ---
echo [1/7] Checking prerequisites...
where node >nul 2>&1 || (echo ERROR: Node.js not found. Install from https://nodejs.org && pause && exit /b 1)
where npm >nul 2>&1  || (echo ERROR: npm not found. Reinstall Node.js && pause && exit /b 1)
where java >nul 2>&1 || (echo ERROR: Java JDK not found. Install JDK 17+ from https://adoptium.net && pause && exit /b 1)
echo    Node.js, npm, and Java found!

REM --- Step 2: Install dependencies ---
echo.
echo [2/7] Installing npm dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (echo ERROR: npm install failed && pause && exit /b 1)

REM --- Step 3: Build web app ---
echo.
echo [3/7] Building web app (Vite)...
call npm run build
IF %ERRORLEVEL% NEQ 0 (echo ERROR: vite build failed && pause && exit /b 1)
echo    dist/ folder created successfully!

REM --- Step 4: Initialize Capacitor (only runs if android/ doesn't exist) ---
echo.
IF NOT EXIST "android\" (
    echo [4/7] Setting up Capacitor + Android platform...
    call npx cap init "%APP_NAME%" "%APP_ID%" --web-dir=dist
    IF %ERRORLEVEL% NEQ 0 (echo ERROR: cap init failed && pause && exit /b 1)
    call npx cap add android
    IF %ERRORLEVEL% NEQ 0 (echo ERROR: cap add android failed && pause && exit /b 1)
) ELSE (
    echo [4/7] Android platform already exists, skipping init...
)

REM --- Step 5: Sync web assets to Android ---
echo.
echo [5/7] Syncing web assets to Android project...
call npx cap sync android
IF %ERRORLEVEL% NEQ 0 (echo ERROR: cap sync failed && pause && exit /b 1)
echo    Web assets synced to android/ folder!

REM --- Step 6: Set Android SDK versions ---
echo.
echo [6/7] Configuring Android SDK versions...
SET VARS_FILE=android\variables.gradle

REM Update minSdkVersion
powershell -Command "(Get-Content '%VARS_FILE%') -replace 'minSdkVersion = \d+', 'minSdkVersion = 24' | Set-Content '%VARS_FILE%'"
REM Update compileSdkVersion
powershell -Command "(Get-Content '%VARS_FILE%') -replace 'compileSdkVersion = \d+', 'compileSdkVersion = 36' | Set-Content '%VARS_FILE%'"
REM Update targetSdkVersion
powershell -Command "(Get-Content '%VARS_FILE%') -replace 'targetSdkVersion = \d+', 'targetSdkVersion = 36' | Set-Content '%VARS_FILE%'"
echo    SDK versions set: min=24, compile=36, target=36

REM --- Step 7: Generate keystore if it doesn't exist ---
echo.
IF NOT EXIST "%KEYSTORE_NAME%" (
    echo [7/7] Generating release keystore...
    echo.
    echo IMPORTANT: You will be prompted to set a keystore password.
    echo            REMEMBER this password — you need it for every future update!
    echo.
    keytool -genkey -v -keystore "%KEYSTORE_NAME%" -alias "%KEY_ALIAS%" -keyalg RSA -keysize 2048 -validity 10000
    IF %ERRORLEVEL% NEQ 0 (echo ERROR: keytool failed. Make sure JDK bin is in PATH && pause && exit /b 1)
    echo    Keystore created: %KEYSTORE_NAME%
) ELSE (
    echo [7/7] Keystore already exists: %KEYSTORE_NAME%
)

echo.
echo ================================================
echo   SETUP COMPLETE!
echo ================================================
echo.
echo   Next steps to build the .aab:
echo.
echo   OPTION A - Android Studio (Recommended):
echo     1. Run: npx cap open android
echo     2. In Android Studio: Build → Generate Signed Bundle / APK
echo     3. Choose "Android App Bundle (.aab)"
echo     4. Select keystore: %KEYSTORE_NAME%, alias: %KEY_ALIAS%
echo     5. Choose "release" build variant
echo     6. Find .aab at: android\app\release\app-release.aab
echo.
echo   OPTION B - Command line (Gradle):
echo     cd android
echo     gradlew bundleRelease
echo     (Then sign with: jarsigner or apksigner)
echo.
echo   Upload the .aab to Google Play Console:
echo     https://play.google.com/console
echo.
pause
