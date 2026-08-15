# 🚀 Bubble Blaster — Google Play Store Build & Upload Guide

This guide walks you through the complete process of building a signed `.aab` and publishing it to the Google Play Store.

---

## 📋 Prerequisites

Before starting, make sure you have:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| JDK | 17+ | https://adoptium.net |
| Android Studio | Latest | https://developer.android.com/studio |
| Google Play Console account | — | https://play.google.com/console |

> **Note**: Android Studio includes the Android SDK, Gradle, and build tools automatically.

---

## 🏗️ Step 1: Run the Build Script

Open **Command Prompt** (not PowerShell) in the project folder:

```cmd
cd F:\AI_Business\App\build-bubble-blaster-game
build_android.bat
```

This script will:
- ✅ Install all npm dependencies
- ✅ Build the web app → `dist/`
- ✅ Set up Capacitor Android project → `android/`
- ✅ Sync web assets into Android
- ✅ Configure Android SDK versions
- ✅ Generate your signing keystore

> **⚠️ CRITICAL**: When the script asks you to set a **keystore password**, write it down and keep it safe forever. You **cannot update your app on Play Store** without this password.

---

## 🔑 Step 2: Generate Signed .aab in Android Studio

1. Open Android Studio
2. Open the project: **File → Open** → select `android/` folder inside your project
3. Wait for Gradle sync to complete (~2-3 minutes first time)
4. Go to: **Build → Generate Signed Bundle / APK**
5. Select **Android App Bundle** → click Next
6. Select your keystore:
   - **Key store path**: browse to `bubble-blaster-release.jks` in your project root
   - **Key store password**: the password you set during build
   - **Key alias**: `bubble-blaster`
   - **Key password**: same as keystore password
7. Select **release** build variant
8. Click **Finish**

The `.aab` file will be at:
```
android\app\release\app-release.aab
```

---

## 🖥️ Step 2 (Alternative): Build via Command Line

If you don't want to open Android Studio:

```cmd
cd F:\AI_Business\App\build-bubble-blaster-game\android

REM Build unsigned AAB
gradlew bundleRelease

REM The unsigned AAB is at:
REM android\app\build\outputs\bundle\release\app-release.aab
```

Then sign it:
```cmd
REM From the project root:
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 ^
    -keystore bubble-blaster-release.jks ^
    android\app\build\outputs\bundle\release\app-release.aab ^
    bubble-blaster
```

---

## 📱 Step 3: Upload to Google Play Console

### First-time submission:

1. Go to https://play.google.com/console
2. Create a new app: **Create app** → fill in app details
3. Complete all required sections:
   - **App content**: age ratings, privacy policy, data safety
   - **Store listing**: description, screenshots, feature graphic
   - **Pricing**: Free or paid

### Upload the .aab:

1. Go to **Release → Production** (or start with **Internal Testing** recommended)
2. Click **Create new release**
3. Upload `android\app\release\app-release.aab`
4. Fill in release notes (e.g., "Initial release")
5. Click **Save** → **Review release** → **Start rollout**

---

## 📸 Required Assets for Play Store

You'll need to prepare these before submission:

| Asset | Size | Notes |
|-------|------|-------|
| App icon | 512×512 PNG | ✅ Already have: `public/icons/icon-512.png` |
| Feature graphic | 1024×500 PNG | Required for store listing |
| Screenshots | Min 2, max 8 | Phone screenshots (min 320px wide) |
| Short description | Max 80 chars | — |
| Full description | Max 4000 chars | — |
| Privacy Policy URL | — | Required for any app |

---

## 🔄 Future Updates

Every time you update your app:

```cmd
REM Make code changes, then:
npm run build
npx cap sync android

REM Then rebuild signed AAB in Android Studio (same steps as above)
REM Increment versionCode in android\app\build.gradle before each upload
```

> **Important**: Each Play Store upload must have a higher `versionCode` than the previous one.
> Edit `android\app\build.gradle`:
> ```gradle
> versionCode 2   // Increment this each release
> versionName "1.1.0"  // Human-readable version
> ```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `gradlew not recognized` | Run from `android/` folder, or use `.\gradlew` |
| `SDK location not found` | Open Android Studio first, set SDK path in `android/local.properties` |
| `Manifest merger failed` | Check `android/app/src/main/AndroidManifest.xml` |
| `keystore not found` | Make sure path to `.jks` file is correct |
| Play Console rejects AAB | Make sure it's signed with a valid keystore |

---

## 📞 App Details Summary

| Field | Value |
|-------|-------|
| App Name | Bubble Blaster |
| Package ID | com.yourname.bubbleblaster |
| Version | 1.0.0 (versionCode: 1) |
| Min Android | 7.0 (API 24) |
| Target Android | 16 (API 36) |
| Orientation | Portrait |
| Theme Color | #0b1030 (dark navy) |
